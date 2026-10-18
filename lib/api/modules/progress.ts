import { HttpError, jsonOk, asNumber, asString } from "@/lib/api/http";
import { currentChild, db, uid, type Memory, type ProgressRecord } from "@/lib/api/memory";
import { requireUser } from "@/lib/api/modules/auth";

const SUBJECT_ORDER = ["lang", "math", "eng", "life"] as const;
const PACKS_BY_SUBJECT: Record<(typeof SUBJECT_ORDER)[number], string[]> = {
  lang: ["lang-starter"],
  math: ["math-starter", "math-life"],
  eng: ["eng-starter"],
  life: ["life-starter"],
};
const START_ORDER = { A: 1, B: 2, C: 3 } as const;

function suggestionFor() {
  // TODO: 按薄弱项推荐。文案先用原型里的「颜色词」。
  return "颜色词";
}

export function getToday(request: Request, url: URL) {
  requireUser(request);
  const child = currentChild(db(), url.searchParams.get("childId"));
  if (!child) throw new HttpError(403, "FORBIDDEN", "还没有孩子档案");
  const state = db();
  const done = new Set(
    state.progress
      .filter((item) => item.childId === child.id && item.status === "completed")
      .map((item) => item.levelId),
  );
  const tasks = tasksForToday(state, child.id, child.ageBand, done);
  const finished = tasks.filter((task) => task.status === "done").length;
  const continueTask = tasks.find((task) => task.status !== "done") ?? tasks[0];
  const childRows = state.progress.filter((item) => item.childId === child.id);
  return jsonOk({
    child,
    streakDays: streakDaysFor(childRows),
    continueLevel: continueTask
      ? {
          id: continueTask.id,
          title: continueTask.title,
          minutes: continueTask.minutes,
          status: continueTask.status,
          subject: continueTask.subject,
          subjectId: continueTask.subjectId,
          progress: tasks.length === 0 ? 0 : finished / tasks.length,
        }
      : null,
    tasks,
  });
}

type DailyTask = {
  id: string;
  kind: "level";
  title: string;
  minutes: number;
  status: "todo" | "done";
  href: string;
  subject: string;
  subjectId: string;
};

function tasksForToday(state: Memory, childId: string, age: "A" | "B" | "C", done: Set<string>) {
  if (!state.todayPlans) state.todayPlans = {};
  const day = utcDayKey(new Date());
  let plan = state.todayPlans[childId];
  if (!plan || plan.day !== day || plan.ageBand !== age) {
    plan = {
      day,
      ageBand: age,
      levelIds: SUBJECT_ORDER.map((subjectId) => dailyTask(state, subjectId, age, done)?.id).filter((id): id is string => Boolean(id)),
    };
    state.todayPlans[childId] = plan;
  }
  return plan.levelIds
    .map((id) => {
      const level = state.levels.find((item) => item.id === id);
      if (!level) return null;
      const subjectId = state.packs.find((pack) => pack.id === level.packId)?.subjectId ?? "";
      const subject = state.subjects.find((item) => item.id === subjectId)?.name ?? subjectId;
      const task: DailyTask = {
        id: level.id,
        kind: "level",
        title: level.title,
        minutes: level.minutes,
        status: done.has(level.id) ? "done" : "todo",
        href: `/play/${level.id}`,
        subject,
        subjectId,
      };
      return task;
    })
    .filter((task): task is DailyTask => task !== null);
}

function dailyTask(state: Memory, subjectId: (typeof SUBJECT_ORDER)[number], age: "A" | "B" | "C", done: Set<string>): DailyTask | null {
  const packIds = PACKS_BY_SUBJECT[subjectId].filter((packId) => !(age === "A" && packId === "math-life"));
  const levels = packIds.flatMap((packId) =>
    state.levels.filter((level) => level.packId === packId && level.playable).sort((a, b) => a.order - b.order),
  );
  if (levels.length === 0) return null;
  const start = START_ORDER[age];
  const incomplete = levels.filter((level) => !done.has(level.id));
  const chosen = incomplete.find((level) => level.order >= start) ?? incomplete[0] ?? levels[0];
  const subject = state.subjects.find((item) => item.id === subjectId)?.name ?? subjectId;
  return {
    id: chosen.id,
    kind: "level",
    title: chosen.title,
    minutes: chosen.minutes,
    status: done.has(chosen.id) ? "done" : "todo",
    href: `/play/${chosen.id}`,
    subject,
    subjectId,
  };
}

export function completeLevel(request: Request, levelId: string, body: Record<string, unknown>) {
  requireUser(request);
  const urlChild = asString(body.childId);
  const child = currentChild(db(), urlChild || null);
  if (!child) throw new HttpError(403, "FORBIDDEN", "还没有孩子档案");
  const level = db().levels.find((item) => item.id === levelId);
  if (!level) throw new HttpError(404, "NOT_FOUND", "找不到这一关");
  if (!level.playable) throw new HttpError(403, "LOCKED", "未解锁", { lockReason: "AD_OR_VIP" });

  const clientEventId = asString(body.clientEventId) || null;
  if (clientEventId) {
    const existing = db().progress.find((item) => item.clientEventId === clientEventId);
    if (existing) {
      return jsonOk({
        progress: existing,
        rewards: { stars: existing.stars },
        nextHint: "可以去课程馆接着玩",
        idempotent: true,
      });
    }
  }

  const score = clamp(asNumber(body.score), 0, 100);
  const stars = clamp(asNumber(body.stars), 1, 3);
  const duration = clamp(asNumber(body.duration), 0, 60 * 30);
  const previous = db().progress.find((item) => item.childId === child.id && item.levelId === levelId);
  const now = new Date().toISOString();
  if (previous) {
    previous.status = "completed";
    previous.stars = Math.max(previous.stars, stars);
    previous.score = Math.max(previous.score, score);
    previous.durationSec += duration;
    previous.completedAt = now;
    previous.clientEventId = clientEventId ?? previous.clientEventId;
    return jsonOk({
      progress: previous,
      rewards: { stars: previous.stars, copy: "Great job!" },
      nextHint: "可以去课程馆接着玩",
    });
  }

  const created: ProgressRecord = {
    id: uid("prog"),
    childId: child.id,
    levelId,
    status: "completed",
    stars,
    score,
    durationSec: duration,
    clientEventId,
    completedAt: now,
  };
  db().progress.push(created);
  return jsonOk({
    progress: created,
    rewards: { stars, copy: "Great job!" },
    nextHint: "可以去课程馆接着玩",
  });
}

export function progressSummary(request: Request, url: URL) {
  requireUser(request);
  const child = currentChild(db(), url.searchParams.get("childId"));
  if (!child) throw new HttpError(403, "FORBIDDEN", "还没有孩子档案");
  const rows = db().progress.filter((item) => item.childId === child.id && item.status === "completed");
  const weekRows = rows.filter((item) => item.completedAt && isSameWeek(item.completedAt));
  const minutes = Math.round(weekRows.reduce((sum, item) => sum + item.durationSec, 0) / 60);
  return jsonOk({
    childId: child.id,
    minutes,
    completedLevels: weekRows.length,
    streakDays: streakDaysFor(rows),
    suggestion: suggestionFor(),
    todo: "REPORT_AGGREGATION",
  });
}

function clamp(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.round(value)));
}

function utcDayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function shiftUtcDay(key: string, delta: number) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + delta)).toISOString().slice(0, 10);
}

function streakDaysFor(rows: Array<{ status: string; completedAt: string | null }>, now = new Date()) {
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

function isSameWeek(iso: string, now = new Date()) {
  const date = new Date(iso);
  const start = new Date(now);
  start.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  start.setHours(0, 0, 0, 0);
  return date >= start;
}
