import { utcDayDiff, utcDayKey } from "@/lib/learning/dates";

/**
 * 掌握度是工程规则，不是诊断。
 * 样本不够时 status=insufficient、score=null，报告写「数据不足」或「待评估」，不写「未掌握」。
 *
 * M = 0.4A + 0.25C + 0.2R + 0.15D，各项 0–100。
 * 还没有任何 review_completed 时，不把 R 当成 0，只用 A/C/D 的 0.4/0.25/0.15 重新归一。
 * 跟读设备分可以另作展示，不进入 A/C/D，也不能单独升到熟练。
 * 单次答错最多掉一档，由回放时的夹取保证。
 */
export const MASTERY_WEIGHT = {
  accuracy: 0.4,
  consecutive: 0.25,
  review: 0.2,
  stability: 0.15,
} as const;

export const MIN_OBJECTIVE_SAMPLES = 3;
export const RECENT_OBJECTIVE_WINDOW = 10;
export const CONSECUTIVE_FULL = 3;
export const STABILITY_ZERO_DAYS = 14;

export const MASTERY_STATUSES = ["insufficient", "not_yet", "learning", "basic", "fluent"] as const;
export type MasteryStatus = (typeof MASTERY_STATUSES)[number];
export type ScoredStatus = Exclude<MasteryStatus, "insufficient">;

export const BAND_FLOOR: Record<ScoredStatus, number> = {
  not_yet: 0,
  learning: 40,
  basic: 60,
  fluent: 80,
};

const BAND_ORDER: ScoredStatus[] = ["not_yet", "learning", "basic", "fluent"];
const OBJECTIVE_DEVICE_TYPES = new Set(["tap", "drag", "sort"]);

export type MasteryInputEvent = {
  type: string;
  source: "server" | "device";
  correct: boolean | null;
  knowledgePointId: string | null;
  levelId: string | null;
  stepId: string | null;
  clientEventId: string;
  createdAt: string;
  stepType: string | null;
};

export type MasteryPlanRef = {
  knowledgePointId: string;
  dueOn: string;
  status: string;
};

export type ObjectiveSample = {
  correct: boolean;
  createdAt: string;
  clientEventId: string;
};

export type MasteryParts = {
  A: number;
  C: number;
  D: number;
  R: number | null;
};

export type MasteryScore = {
  status: MasteryStatus;
  score: number | null;
  parts: MasteryParts | null;
  objectiveCount: number;
  speak: { correct: number; total: number } | null;
};

export function bandForScore(score: number): ScoredStatus {
  if (score < 40) return "not_yet";
  if (score < 60) return "learning";
  if (score < 80) return "basic";
  return "fluent";
}

export function parentMasteryLabel(status: MasteryStatus) {
  if (status === "insufficient") return "数据不足";
  if (status === "not_yet") return "还要再练";
  if (status === "learning") return "学习中";
  if (status === "basic") return "基本掌握";
  return "熟练";
}

/** 样本不够时的评估词。和家长报告的「数据不足」一起用，都不是「未掌握」。 */
export function assessmentLabel(status: MasteryStatus) {
  if (status === "insufficient") return "待评估";
  return parentMasteryLabel(status);
}

export function accuracyScore(correctFlags: boolean[]) {
  const recent = correctFlags.slice(-RECENT_OBJECTIVE_WINDOW);
  if (recent.length === 0) return 0;
  const correct = recent.filter(Boolean).length;
  return Math.round((correct / recent.length) * 100);
}

export function consecutiveScore(correctFlags: boolean[]) {
  let streak = 0;
  for (let index = correctFlags.length - 1; index >= 0; index -= 1) {
    if (!correctFlags[index]) break;
    streak += 1;
  }
  return Math.round(Math.min(100, (streak / CONSECUTIVE_FULL) * 100));
}

export function stabilityScore(lastSuccessAt: Date | null, now: Date) {
  if (!lastSuccessAt || Number.isNaN(lastSuccessAt.getTime())) return 0;
  const days = utcDayDiff(utcDayKey(now), utcDayKey(lastSuccessAt));
  if (days <= 0) return 100;
  if (days >= STABILITY_ZERO_DAYS) return 0;
  return Math.round(100 - (days / STABILITY_ZERO_DAYS) * 100);
}

export function combineMastery(parts: MasteryParts) {
  const { accuracy, consecutive, review, stability } = MASTERY_WEIGHT;
  if (parts.R == null) {
    const sum = accuracy + consecutive + stability;
    return Math.round((accuracy * parts.A + consecutive * parts.C + stability * parts.D) / sum);
  }
  return Math.round(accuracy * parts.A + consecutive * parts.C + review * parts.R + stability * parts.D);
}

export function clampScoreDrop(previous: { score: number; status: ScoredStatus } | null, computed: number) {
  if (!previous) return computed;
  const prevIndex = BAND_ORDER.indexOf(previous.status);
  const nextIndex = BAND_ORDER.indexOf(bandForScore(computed));
  if (nextIndex >= prevIndex - 1) return computed;
  return BAND_FLOOR[BAND_ORDER[Math.max(0, prevIndex - 1)]];
}

function attemptKey(event: MasteryInputEvent) {
  if (event.type !== "question_answered" && event.type !== "question_failed") return null;
  const server = /^(.*):server:([^:]+)(?::[^:]*)?$/.exec(event.clientEventId);
  if (event.source === "server" && server) {
    return `${server[1]}|${event.levelId ?? ""}|${server[2]}|${event.knowledgePointId ?? ""}`;
  }
  const device = /^(.*):(question_answered|question_failed):([^:]+)(?::.*)?$/.exec(event.clientEventId);
  if (event.source === "device" && device) {
    return `${device[1]}|${event.levelId ?? ""}|${device[3]}|${event.knowledgePointId ?? ""}`;
  }
  return null;
}

export function objectiveSamples(events: MasteryInputEvent[], knowledgePointId: string) {
  const related = events.filter(
    (event) =>
      event.knowledgePointId === knowledgePointId &&
      (event.type === "question_answered" || event.type === "question_failed") &&
      event.correct != null,
  );
  const serverKeys = new Set<string>();
  for (const event of related) {
    if (event.source !== "server") continue;
    const key = attemptKey(event);
    if (key) serverKeys.add(key);
  }
  const samples: ObjectiveSample[] = [];
  for (const event of related) {
    if (event.source === "device") {
      if (event.stepType === "speak") continue;
      if (!event.stepType || !OBJECTIVE_DEVICE_TYPES.has(event.stepType)) continue;
      const key = attemptKey(event);
      if (key && serverKeys.has(key)) continue;
    } else if (event.source !== "server") {
      continue;
    }
    samples.push({
      correct: event.correct === true,
      createdAt: event.createdAt,
      clientEventId: event.clientEventId,
    });
  }
  samples.sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.clientEventId.localeCompare(b.clientEventId));
  return samples;
}

export function speakReference(events: MasteryInputEvent[], knowledgePointId: string) {
  const rows = events.filter(
    (event) =>
      event.knowledgePointId === knowledgePointId &&
      event.source === "device" &&
      event.stepType === "speak" &&
      (event.type === "question_answered" || event.type === "question_failed") &&
      event.correct != null,
  );
  if (rows.length === 0) return null;
  return {
    correct: rows.filter((event) => event.correct === true).length,
    total: rows.length,
  };
}

function reviewPerformance(events: MasteryInputEvent[], plans: MasteryPlanRef[], knowledgePointId: string, at: string) {
  const done = events
    .filter(
      (event) =>
        event.type === "review_completed" &&
        event.knowledgePointId === knowledgePointId &&
        event.createdAt <= at,
    )
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.clientEventId.localeCompare(b.clientEventId));
  if (done.length === 0) return null;
  const completedPlans = plans
    .filter((plan) => plan.knowledgePointId === knowledgePointId && plan.status === "completed" && plan.dueOn <= utcDayKey(new Date(at)))
    .sort((a, b) => a.dueOn.localeCompare(b.dueOn));
  if (completedPlans.length === 0) return 100;
  let timely = 0;
  const used = new Set<number>();
  for (const plan of completedPlans) {
    const index = done.findIndex((event, eventIndex) => !used.has(eventIndex) && utcDayKey(new Date(event.createdAt)) <= plan.dueOn);
    if (index >= 0) {
      used.add(index);
      timely += 1;
    }
  }
  return Math.round((100 * timely) / completedPlans.length);
}

function partsFor(samples: ObjectiveSample[], events: MasteryInputEvent[], plans: MasteryPlanRef[], knowledgePointId: string, now: Date, at: string) {
  const flags = samples.map((sample) => sample.correct);
  const lastSuccess = [...samples].reverse().find((sample) => sample.correct);
  return {
    A: accuracyScore(flags),
    C: consecutiveScore(flags),
    D: stabilityScore(lastSuccess ? new Date(lastSuccess.createdAt) : null, now),
    R: reviewPerformance(events, plans, knowledgePointId, at),
  } satisfies MasteryParts;
}

export function scoreKnowledgePoint(events: MasteryInputEvent[], plans: MasteryPlanRef[], knowledgePointId: string, now = new Date()): MasteryScore {
  const samples = objectiveSamples(events, knowledgePointId);
  const speak = speakReference(events, knowledgePointId);
  if (samples.length < MIN_OBJECTIVE_SAMPLES) {
    return { status: "insufficient", score: null, parts: null, objectiveCount: samples.length, speak };
  }
  let previous: { score: number; status: ScoredStatus } | null = null;
  let parts: MasteryParts | null = null;
  for (let end = MIN_OBJECTIVE_SAMPLES; end <= samples.length; end += 1) {
    const prefix = samples.slice(0, end);
    const at = prefix[prefix.length - 1]?.createdAt ?? now.toISOString();
    const nextParts = partsFor(prefix, events, plans, knowledgePointId, now, at);
    const score = clampScoreDrop(previous, combineMastery(nextParts));
    previous = { score, status: bandForScore(score) };
    parts = nextParts;
  }
  const lastSampleAt = samples[samples.length - 1]?.createdAt ?? now.toISOString();
  const lastReviewAt = events
    .filter((event) => event.type === "review_completed" && event.knowledgePointId === knowledgePointId)
    .map((event) => event.createdAt)
    .sort()
    .at(-1);
  if (previous && lastReviewAt && lastReviewAt > lastSampleAt) {
    const nextParts = partsFor(samples, events, plans, knowledgePointId, now, lastReviewAt);
    const score = clampScoreDrop(previous, combineMastery(nextParts));
    previous = { score, status: bandForScore(score) };
    parts = nextParts;
  }
  return {
    status: previous?.status ?? "insufficient",
    score: previous?.score ?? null,
    parts,
    objectiveCount: samples.length,
    speak,
  };
}
