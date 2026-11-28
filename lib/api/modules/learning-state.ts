import type { LearningEventRecord } from "@/lib/learning/events";
import { utcDayKey } from "@/lib/learning/dates";
import {
  objectiveSamples,
  scoreKnowledgePoint,
  type MasteryInputEvent,
  type MasteryPlanRef,
} from "@/lib/learning/mastery";
import { needsSpacedReview, planNextReview } from "@/lib/learning/review";
import { pointsOnLevel } from "@/lib/learning/today-tasks";
import type { KnowledgeMasteryRecord, ReviewPlanRecord } from "@/lib/learning/records";
import { db, uid } from "@/lib/api/memory";
import { appendLearningEvent } from "@/lib/api/modules/events";
import { persistMastery, persistReviewPlan } from "@/lib/api/persist";

const SCORED_TYPES = new Set(["question_answered", "question_failed", "review_completed"]);

export async function applyLearningEvent(event: LearningEventRecord) {
  if (!event.knowledgePointId || !SCORED_TYPES.has(event.type)) return;
  await recomputePoint(event.childId, event.knowledgePointId);
}

/** 按孩子和知识点重算。再跑一次不会多插复习，也不会把分数写成另一套。 */
export async function reconcileLearningState(now = new Date()) {
  const state = db();
  const pairs = new Set<string>();
  const add = (childId: string, pointId: string | null) => {
    if (pointId) pairs.add(`${childId}\n${pointId}`);
  };
  for (const event of state.learningEvents) {
    if (!SCORED_TYPES.has(event.type)) continue;
    add(event.childId, event.knowledgePointId);
  }
  for (const row of state.knowledgeMastery) add(row.childId, row.knowledgePointId);
  for (const row of state.reviewPlans) add(row.childId, row.knowledgePointId);
  for (const key of pairs) {
    const [childId, pointId] = key.split("\n");
    if (childId && pointId) await recomputePoint(childId, pointId, now);
  }
}

export async function settleLevelReview(input: {
  childId: string;
  levelId: string;
  attemptId: string;
  passed: boolean;
  durationMs: number;
  now?: Date;
}) {
  if (!input.passed) return;
  const now = input.now ?? new Date();
  const day = utcDayKey(now);
  const points = new Set(pointsOnLevel(db().playableLevels[input.levelId]));
  const due = db().reviewPlans.filter(
    (plan) => plan.childId === input.childId && plan.status === "pending" && plan.dueOn <= day && points.has(plan.knowledgePointId),
  );
  for (const plan of due) {
    plan.status = "completed";
    plan.updatedAt = now.toISOString();
    await persistReviewPlan(plan);
    await appendLearningEvent({
      childId: input.childId,
      sessionId: `server:${input.attemptId}`,
      type: "review_completed",
      knowledgePointId: plan.knowledgePointId,
      levelId: input.levelId,
      gameId: null,
      stepId: null,
      correct: true,
      durationMs: input.durationMs,
      errorCause: null,
      source: "server",
      clientEventId: `${input.attemptId}:server:review:${plan.knowledgePointId}:${plan.dueOn}`,
    });
  }
}

async function recomputePoint(childId: string, knowledgePointId: string, now = new Date()) {
  const state = db();
  const events = state.learningEvents.filter((event) => event.childId === childId).map(toMasteryEvent);
  const ownPlans = state.reviewPlans.filter((plan) => plan.childId === childId && plan.knowledgePointId === knowledgePointId);
  const scored = scoreKnowledgePoint(events, ownPlans.map(toPlanRef), knowledgePointId, now);
  const samples = objectiveSamples(events, knowledgePointId);
  const reviewEvents = events.filter((event) => event.type === "review_completed" && event.knowledgePointId === knowledgePointId);
  if (samples.length === 0 && reviewEvents.length === 0) return;

  const existing = state.knowledgeMastery.find((row) => row.childId === childId && row.knowledgePointId === knowledgePointId);
  let status = existing?.status ?? scored.status;
  if (samples.length > 0) {
    const saved = upsertMastery(childId, knowledgePointId, scored.score, scored.status, now);
    status = saved.status;
    await persistMastery(saved);
  }

  const anchor = [...reviewEvents, ...samples].sort((a, b) => a.createdAt.localeCompare(b.createdAt)).at(-1);
  const anchorDay = anchor ? utcDayKey(new Date(anchor.createdAt)) : utcDayKey(now);
  const next = planNextReview(
    ownPlans,
    anchorDay,
    reviewEvents.length,
    needsSpacedReview({
      status,
      failed: samples.some((sample) => !sample.correct),
      reviewCompletions: reviewEvents.length,
    }),
  );
  if (!next) return;
  const created: ReviewPlanRecord = {
    id: uid("rev"),
    childId,
    knowledgePointId,
    dueOn: next.dueOn,
    status: next.status,
    updatedAt: now.toISOString(),
  };
  state.reviewPlans.push(created);
  await persistReviewPlan(created);
}

function upsertMastery(childId: string, knowledgePointId: string, score: number | null, status: KnowledgeMasteryRecord["status"], now: Date) {
  const state = db();
  const existing = state.knowledgeMastery.find((row) => row.childId === childId && row.knowledgePointId === knowledgePointId);
  if (existing && existing.score === score && existing.status === status) return existing;
  const row: KnowledgeMasteryRecord = {
    id: existing?.id ?? uid("mst"),
    childId,
    knowledgePointId,
    score,
    status,
    updatedAt: now.toISOString(),
  };
  if (existing) {
    existing.score = row.score;
    existing.status = row.status;
    existing.updatedAt = row.updatedAt;
    return existing;
  }
  state.knowledgeMastery.push(row);
  return row;
}

function toMasteryEvent(event: LearningEventRecord): MasteryInputEvent {
  const level = event.levelId ? db().playableLevels[event.levelId] : undefined;
  const step = level?.steps.find((item) => item.id === event.stepId);
  return {
    type: event.type,
    source: event.source,
    correct: event.correct,
    knowledgePointId: event.knowledgePointId,
    levelId: event.levelId,
    stepId: event.stepId,
    clientEventId: event.clientEventId,
    createdAt: event.createdAt,
    stepType: step?.type ?? null,
  };
}

function toPlanRef(plan: ReviewPlanRecord): MasteryPlanRef {
  return { knowledgePointId: plan.knowledgePointId, dueOn: plan.dueOn, status: plan.status };
}
