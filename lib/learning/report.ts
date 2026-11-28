import type { Memory, ProgressRecord } from "@/lib/api/memory";
import { displayUtcDay, isInUtcWeek, shiftUtcDay, utcDayKey, utcWeekBounds } from "@/lib/learning/dates";
import { assessmentLabel, parentMasteryLabel, type MasteryStatus } from "@/lib/learning/mastery";

const SUBJECT_ORDER = ["lang", "math", "eng", "life"] as const;

export const INSUFFICIENT_COPY = "数据不足";

export type ReportPoint = {
  knowledgePointId: string;
  title: string;
  topic: string;
  status: MasteryStatus;
  score: number | null;
  label: string;
  assessment: string;
  speak: { correct: number; total: number } | null;
};

export type ProgressReport = {
  minutes: number;
  completedLevels: number;
  streakDays: number;
  suggestion: string;
  weakAreaTip: string;
  subjects: Array<{ id: string; name: string; completed: number }>;
  habit: {
    minutes: number;
    completedLevels: number;
    streakDays: number;
    weekStart: string;
    weekEnd: string;
    weekLabel: string;
  };
  mastery: {
    ready: boolean;
    emptyCopy: string;
    points: ReportPoint[];
  };
  trend: {
    state: "empty" | "ready";
    emptyCopy: string;
    minutesDelta: number | null;
    completedDelta: number | null;
    copy: string;
  };
  suggestions: string[];
};

export function buildProgressReport(state: Memory, childId: string, now = new Date()): ProgressReport {
  const rows = state.progress.filter((item) => item.childId === childId && item.status === "completed");
  const bounds = utcWeekBounds(now);
  const weekRows = rows.filter((item) => item.completedAt && isInUtcWeek(item.completedAt, now));
  const previousStart = new Date(bounds.start);
  previousStart.setUTCDate(previousStart.getUTCDate() - 7);
  const previousRows = rows.filter((item) => item.completedAt && inRange(item.completedAt, previousStart, bounds.start));
  const subjects = subjectStats(state, weekRows);
  const weakAreaTip = weakTip(subjects);
  const points = reportPoints(state, childId);
  const ready = points.some((point) => point.status !== "insufficient");
  const thisMinutes = minutesOf(weekRows);
  const lastMinutes = minutesOf(previousRows);
  const trend = trendBlock(weekRows.length, previousRows.length, thisMinutes, lastMinutes);
  return {
    minutes: thisMinutes,
    completedLevels: weekRows.length,
    streakDays: streakDaysFor(rows, now),
    suggestion: weakAreaTip,
    weakAreaTip,
    subjects: subjects.map((item) => ({ id: item.id, name: item.name, completed: item.levels })),
    habit: {
      minutes: thisMinutes,
      completedLevels: weekRows.length,
      streakDays: streakDaysFor(rows, now),
      weekStart: bounds.startKey,
      weekEnd: bounds.endKey,
      weekLabel: `${displayUtcDay(bounds.startKey)} – ${displayUtcDay(bounds.endKey)}`,
    },
    mastery: {
      ready,
      emptyCopy: INSUFFICIENT_COPY,
      points,
    },
    trend,
    suggestions: ready ? suggestionsFor(points) : [],
  };
}

function reportPoints(state: Memory, childId: string): ReportPoint[] {
  return state.knowledgeMastery
    .filter((row) => row.childId === childId)
    .sort((a, b) => a.knowledgePointId.localeCompare(b.knowledgePointId))
    .map((row) => {
      const point = state.knowledgePoints.find((item) => item.id === row.knowledgePointId || item.code === row.knowledgePointId);
      const course = point ? state.curriculumCourses.find((item) => item.id === point.courseId) : undefined;
      const speak = speakFor(state, childId, row.knowledgePointId);
      return {
        knowledgePointId: row.knowledgePointId,
        title: point?.title ?? row.knowledgePointId,
        topic: course?.title ?? "",
        status: row.status,
        score: row.score,
        label: parentMasteryLabel(row.status),
        assessment: assessmentLabel(row.status),
        speak,
      };
    });
}

function speakFor(state: Memory, childId: string, pointId: string) {
  const rows = state.learningEvents.filter(
    (event) =>
      event.childId === childId &&
      event.knowledgePointId === pointId &&
      event.source === "device" &&
      (event.type === "question_answered" || event.type === "question_failed") &&
      event.correct != null &&
      state.playableLevels[event.levelId ?? ""]?.steps.find((step) => step.id === event.stepId)?.type === "speak",
  );
  if (rows.length === 0) return null;
  return { correct: rows.filter((event) => event.correct === true).length, total: rows.length };
}

function suggestionsFor(points: ReportPoint[]) {
  const lines: string[] = [];
  const weak = points.filter((point) => point.status === "not_yet" || point.status === "learning");
  const fluent = points.filter((point) => point.status === "fluent");
  for (const point of weak.slice(0, 2)) lines.push(`${point.title}可以再轻轻练一练。`);
  for (const point of fluent.slice(0, 1)) lines.push(`${point.title}已经比较熟，过几天再复习就好。`);
  if (lines.length === 0) {
    const basic = points.find((point) => point.status === "basic");
    if (basic) lines.push(`${basic.title}可以过几天再见面。`);
  }
  return lines;
}

function trendBlock(thisCompleted: number, lastCompleted: number, thisMinutes: number, lastMinutes: number): ProgressReport["trend"] {
  if (thisCompleted === 0 && lastCompleted === 0) {
    return { state: "empty", emptyCopy: INSUFFICIENT_COPY, minutesDelta: null, completedDelta: null, copy: INSUFFICIENT_COPY };
  }
  const completedDelta = thisCompleted - lastCompleted;
  const minutesDelta = thisMinutes - lastMinutes;
  const copy =
    lastCompleted === 0
      ? "上周还没有记录，先看这周就好。"
      : `这周完成 ${thisCompleted} 关，上周 ${lastCompleted} 关。`;
  return { state: "ready", emptyCopy: INSUFFICIENT_COPY, minutesDelta, completedDelta, copy };
}

function minutesOf(rows: ProgressRecord[]) {
  const seconds = rows.reduce((sum, item) => sum + item.durationSec, 0);
  return seconds <= 0 ? 0 : Math.max(1, Math.round(seconds / 60));
}

function inRange(iso: string, start: Date, end: Date) {
  const time = new Date(iso).getTime();
  return time >= start.getTime() && time < end.getTime();
}

function subjectStats(state: Memory, rows: ProgressRecord[]) {
  const stats = SUBJECT_ORDER.map((id) => ({
    id,
    name: state.subjects.find((item) => item.id === id)?.name ?? id,
    levels: 0,
    stars: 0,
  }));
  const byId = new Map(stats.map((item) => [item.id, item]));
  for (const row of rows) {
    const level = state.levels.find((item) => item.id === row.levelId);
    const subjectId = level ? state.packs.find((pack) => pack.id === level.packId)?.subjectId : undefined;
    if (!subjectId || !isProductSubject(subjectId)) continue;
    const bucket = byId.get(subjectId);
    if (!bucket) continue;
    bucket.levels += 1;
    bucket.stars += row.stars;
  }
  return stats;
}

function isProductSubject(value: string): value is (typeof SUBJECT_ORDER)[number] {
  return (SUBJECT_ORDER as readonly string[]).includes(value);
}

function weakTip(subjects: Array<{ name: string; levels: number; stars: number }>) {
  const played = subjects.filter((item) => item.levels > 0);
  if (played.length === 0) {
    const first = subjects[0]?.name ?? "语言";
    return `先从${first}开始，听一听再点一点。`;
  }
  const missing = subjects.find((item) => item.levels === 0);
  if (missing) return `这周还没碰${missing.name}，抽一关练练。`;
  const weakest = played.reduce((low, item) => (item.stars / item.levels < low.stars / low.levels ? item : low));
  return `${weakest.name}的星星最少，再玩一关会更稳。`;
}

function streakDaysFor(rows: Array<{ status: string; completedAt: string | null }>, now: Date) {
  const days = new Set(
    rows
      .filter((item) => item.status === "completed" && item.completedAt)
      .map((item) => utcDayKey(new Date(item.completedAt!))),
  );
  const today = utcDayKey(now);
  let cursor = days.has(today) ? today : days.has(shiftUtcDay(today, -1)) ? shiftUtcDay(today, -1) : null;
  if (!cursor) return 0;
  let count = 0;
  while (days.has(cursor)) {
    count += 1;
    cursor = shiftUtcDay(cursor, -1);
  }
  return count;
}
