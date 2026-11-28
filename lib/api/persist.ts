import { Prisma } from "@prisma/client";
import type { ChildRecord, ProgressRecord } from "@/lib/api/memory";
import { db } from "@/lib/api/memory";
import { ensureDemoFamily, syncCatalog } from "@/lib/api/catalog-sync";
import { isPinHash } from "@/lib/api/pin-hash";
import { databaseEnabled, getPrisma } from "@/lib/api/prisma";
import { isProduction } from "@/lib/api/secrets";
import type { ErrorCause, LearningEventRecord, LearningEventType } from "@/lib/learning/events";
import { mergeQuotaRows, parseDayKey } from "@/lib/learning/dates";
import type { KnowledgeMasteryRecord, ReviewPlanRecord } from "@/lib/learning/records";
import type { MasteryStatus } from "@/lib/learning/mastery";
import type { ReviewStatus } from "@/lib/learning/review";
import type { TodayTaskRef } from "@/lib/learning/today-tasks";
import { selectTodayPlans, todayPlanLoadArgs, utcDayKey } from "@/lib/learning/today-plan";

const globalStore = globalThis as typeof globalThis & { __qimengReady?: Promise<void> };

export function resetPersistenceForTests() {
  globalStore.__qimengReady = undefined;
}

export function ensureReady() {
  if (!databaseEnabled()) return Promise.resolve();
  globalStore.__qimengReady ??= loadFromDatabase()
    .then(async () => {
      const { reconcileLearningState } = await import("@/lib/api/modules/learning-state");
      await reconcileLearningState();
    })
    .catch((error: unknown) => {
      globalStore.__qimengReady = undefined;
      throw error;
    });
  return globalStore.__qimengReady;
}

async function loadFromDatabase() {
  const prisma = getPrisma();
  await syncCatalog(prisma);
  await ensureDemoFamily(prisma);
  const state = db();
  const user = await prisma.user.findUnique({ where: { id: "user-demo" } });
  if (user) {
    state.user.phone = user.phone;
    state.user.guardianConsentAt = user.guardianConsentAt ? user.guardianConsentAt.toISOString() : null;
  }
  const lock = await prisma.parentLock.findUnique({ where: { userId: "user-demo" } });
  if (lock && isPinHash(lock.pinHash)) {
    state.parentLock.pinHash = lock.pinHash;
    if (isProduction()) state.parentLock.pin = "";
  }
  const children = await prisma.child.findMany({ where: { userId: "user-demo" }, orderBy: { createdAt: "asc" } });
  state.children = children.map(
    (child): ChildRecord => ({
      id: child.id,
      userId: child.userId,
      nickname: child.nickname,
      ageBand: child.ageBand === "B" || child.ageBand === "C" ? child.ageBand : "A",
      avatar: child.avatar,
      isCurrent: child.isCurrent,
    }),
  );
  const progress = await prisma.progress.findMany({ where: { child: { userId: "user-demo" } } });
  state.progress = progress.map(
    (row): ProgressRecord => ({
      id: row.id,
      childId: row.childId,
      levelId: row.levelId,
      status: row.status === "completed" ? "completed" : "started",
      stars: row.stars,
      score: row.score,
      durationSec: row.durationSec,
      clientEventId: row.clientEventId,
      completedAt: row.completedAt ? row.completedAt.toISOString() : null,
    }),
  );
  const today = utcDayKey();
  const plans = await prisma.todayPlan.findMany(todayPlanLoadArgs(today));
  state.todayPlans = {};
  for (const plan of selectTodayPlans(plans, today)) {
    const ageBand = plan.ageBand === "B" || plan.ageBand === "C" ? plan.ageBand : "A";
    state.todayPlans[plan.childId] = {
      day: parseDayKey(plan.day) ?? plan.day,
      ageBand,
      levelIds: plan.levelIds,
      tasks: parseTodayTasks(plan.tasks),
    };
  }
  const quotas = await prisma.gameQuota.findMany({ where: { child: { userId: "user-demo" } } });
  state.gameQuotas = {};
  for (const quota of mergeQuotaRows(quotas)) {
    state.gameQuotas[quotaKey(quota.childId, quota.gameId, quota.day)] = {
      childId: quota.childId,
      gameId: quota.gameId,
      day: quota.day,
      used: quota.used,
      bonus: quota.bonus,
    };
  }
  await rewriteLegacyQuotaDays(quotas);
  const events = await prisma.learningEvent.findMany({
    where: { child: { userId: "user-demo" } },
    orderBy: { createdAt: "asc" },
  });
  state.learningEvents = events.map(mapLearningEvent);
  const mastery = await prisma.knowledgeMastery.findMany({ where: { child: { userId: "user-demo" } } });
  state.knowledgeMastery = mastery.map(mapMastery);
  const reviews = await prisma.reviewPlan.findMany({ where: { child: { userId: "user-demo" } }, orderBy: { dueOn: "asc" } });
  state.reviewPlans = reviews.map(mapReview);
  const charges = await prisma.gameQuotaCharge.findMany({ where: { child: { userId: "user-demo" } } });
  state.quotaCharges = {};
  for (const charge of charges) {
    state.quotaCharges[charge.clientEventId] = { childId: charge.childId, gameId: charge.gameId, day: charge.day };
  }
}

async function rewriteLegacyQuotaDays(quotas: Array<{ id: string; childId: string; gameId: string; day: string; used: number; bonus: number }>) {
  const counts = new Map<string, number>();
  let dirty = false;
  for (const quota of quotas) {
    const day = parseDayKey(quota.day);
    if (!day || day !== quota.day) dirty = true;
    const key = `${quota.childId}:${quota.gameId}:${day ?? quota.day}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  if (!dirty && [...counts.values()].every((count) => count === 1)) return;
  const prisma = getPrisma();
  for (const quota of quotas) {
    const day = parseDayKey(quota.day);
    if (day && quota.day !== day) await prisma.gameQuota.delete({ where: { id: quota.id } });
  }
  for (const row of mergeQuotaRows(quotas)) {
    await prisma.gameQuota.upsert({
      where: { childId_gameId_day: { childId: row.childId, gameId: row.gameId, day: row.day } },
      create: { childId: row.childId, gameId: row.gameId, day: row.day, used: row.used, bonus: row.bonus },
      update: { used: row.used, bonus: row.bonus },
    });
  }
}

export function quotaKey(childId: string, gameId: string, day: string) {
  return `${childId}:${gameId}:${day}`;
}

export async function persistProgress(row: ProgressRecord) {
  if (!databaseEnabled()) return;
  const prisma = getPrisma();
  const data = {
    status: row.status,
    stars: row.stars,
    score: row.score,
    durationSec: row.durationSec,
    clientEventId: row.clientEventId,
    completedAt: row.completedAt ? new Date(row.completedAt) : null,
  };
  await prisma.progress.upsert({
    where: { childId_levelId: { childId: row.childId, levelId: row.levelId } },
    create: { id: row.id, childId: row.childId, levelId: row.levelId, ...data },
    update: data,
  });
}

export async function persistTodayPlan(childId: string) {
  if (!databaseEnabled()) return;
  const plan = db().todayPlans[childId];
  if (!plan) return;
  await getPrisma().todayPlan.upsert({
    where: { childId_day: { childId, day: plan.day } },
    create: { childId, day: plan.day, ageBand: plan.ageBand, levelIds: plan.levelIds, tasks: todayTasksJson(plan.tasks) },
    update: { ageBand: plan.ageBand, levelIds: plan.levelIds, tasks: todayTasksJson(plan.tasks) },
  });
}

export async function persistChild(child: ChildRecord) {
  if (!databaseEnabled()) return;
  await getPrisma().child.upsert({
    where: { id: child.id },
    create: {
      id: child.id,
      userId: child.userId,
      nickname: child.nickname,
      ageBand: child.ageBand,
      avatar: child.avatar,
      isCurrent: child.isCurrent,
    },
    update: {
      nickname: child.nickname,
      ageBand: child.ageBand,
      avatar: child.avatar,
      isCurrent: child.isCurrent,
    },
  });
}

export async function persistCurrentChild(userId: string, childId: string) {
  if (!databaseEnabled()) return;
  const prisma = getPrisma();
  await prisma.child.updateMany({ where: { userId }, data: { isCurrent: false } });
  await prisma.child.update({ where: { id: childId }, data: { isCurrent: true } });
}

export async function persistGuardianConsent(at: string) {
  if (!databaseEnabled()) return;
  await getPrisma().user.update({
    where: { id: "user-demo" },
    data: { guardianConsentAt: new Date(at) },
  });
}

export async function persistParentPinHash(pinHash: string) {
  if (!databaseEnabled()) return;
  await getPrisma().parentLock.upsert({
    where: { userId: "user-demo" },
    create: { userId: "user-demo", pinHash },
    update: { pinHash },
  });
}

export async function persistPhone(phone: string) {
  if (!databaseEnabled()) return;
  await getPrisma().user.update({ where: { id: "user-demo" }, data: { phone } });
}

export async function persistMastery(row: KnowledgeMasteryRecord) {
  if (!databaseEnabled()) return;
  const data = { score: row.score, status: row.status };
  await getPrisma().knowledgeMastery.upsert({
    where: { childId_knowledgePointId: { childId: row.childId, knowledgePointId: row.knowledgePointId } },
    create: { id: row.id, childId: row.childId, knowledgePointId: row.knowledgePointId, ...data },
    update: data,
  });
}

export async function persistReviewPlan(row: ReviewPlanRecord) {
  if (!databaseEnabled()) return;
  const data = { status: row.status };
  await getPrisma().reviewPlan.upsert({
    where: {
      childId_knowledgePointId_dueOn: {
        childId: row.childId,
        knowledgePointId: row.knowledgePointId,
        dueOn: row.dueOn,
      },
    },
    create: {
      id: row.id,
      childId: row.childId,
      knowledgePointId: row.knowledgePointId,
      dueOn: row.dueOn,
      ...data,
    },
    update: data,
  });
}

export async function persistQuota(row: { childId: string; gameId: string; day: string; used: number; bonus: number }) {
  if (!databaseEnabled()) return;
  await getPrisma().gameQuota.upsert({
    where: { childId_gameId_day: { childId: row.childId, gameId: row.gameId, day: row.day } },
    create: row,
    update: { used: row.used, bonus: row.bonus },
  });
}

export function isUniqueConflict(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && (error as { code: unknown }).code === "P2002";
}

export async function persistLearningEvent(row: LearningEventRecord) {
  if (!databaseEnabled()) return;
  await getPrisma().learningEvent.create({
    data: {
      id: row.id,
      childId: row.childId,
      sessionId: row.sessionId,
      type: row.type,
      knowledgePointId: row.knowledgePointId,
      levelId: row.levelId,
      gameId: row.gameId,
      stepId: row.stepId,
      correct: row.correct,
      durationMs: row.durationMs,
      errorCause: row.errorCause,
      source: row.source,
      clientEventId: row.clientEventId,
      createdAt: new Date(row.createdAt),
    },
  });
}

export async function persistQuotaCharge(row: { id: string; clientEventId: string; childId: string; gameId: string; day: string }) {
  if (!databaseEnabled()) return;
  await getPrisma().gameQuotaCharge.create({ data: row });
}

function todayTasksJson(tasks: TodayTaskRef[] | null): Prisma.InputJsonValue | typeof Prisma.DbNull {
  if (!tasks) return Prisma.DbNull;
  return tasks as unknown as Prisma.InputJsonValue;
}

function parseTodayTasks(value: unknown): TodayTaskRef[] | null {
  if (!Array.isArray(value)) return null;
  const tasks: TodayTaskRef[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") return null;
    const row = item as Record<string, unknown>;
    if (row.kind !== "review" && row.kind !== "level" && row.kind !== "game") return null;
    if (row.slot !== "review" && row.slot !== "weak" && row.slot !== "new" && row.slot !== "game") return null;
    if (typeof row.id !== "string") return null;
    tasks.push({
      kind: row.kind,
      slot: row.slot,
      id: row.id,
      knowledgePointId: typeof row.knowledgePointId === "string" ? row.knowledgePointId : null,
    });
  }
  return tasks;
}

function mapMastery(row: {
  id: string;
  childId: string;
  knowledgePointId: string;
  score: number | null;
  status: string;
  updatedAt: Date;
}): KnowledgeMasteryRecord {
  const status: MasteryStatus =
    row.status === "not_yet" || row.status === "learning" || row.status === "basic" || row.status === "fluent" ? row.status : "insufficient";
  return {
    id: row.id,
    childId: row.childId,
    knowledgePointId: row.knowledgePointId,
    score: status === "insufficient" ? null : row.score,
    status,
    updatedAt: row.updatedAt.toISOString(),
  };
}

function mapReview(row: {
  id: string;
  childId: string;
  knowledgePointId: string;
  dueOn: string;
  status: string;
  updatedAt: Date;
}): ReviewPlanRecord {
  const status: ReviewStatus = row.status === "completed" || row.status === "cancelled" ? row.status : "pending";
  return {
    id: row.id,
    childId: row.childId,
    knowledgePointId: row.knowledgePointId,
    dueOn: parseDayKey(row.dueOn) ?? row.dueOn,
    status,
    updatedAt: row.updatedAt.toISOString(),
  };
}

function mapLearningEvent(row: {
  id: string;
  childId: string;
  sessionId: string;
  type: string;
  knowledgePointId: string | null;
  levelId: string | null;
  gameId: string | null;
  stepId: string | null;
  correct: boolean | null;
  durationMs: number;
  errorCause: string | null;
  source: string;
  clientEventId: string;
  createdAt: Date;
}): LearningEventRecord {
  return {
    id: row.id,
    childId: row.childId,
    sessionId: row.sessionId,
    type: row.type as LearningEventType,
    knowledgePointId: row.knowledgePointId,
    levelId: row.levelId,
    gameId: row.gameId,
    stepId: row.stepId,
    correct: row.correct,
    durationMs: row.durationMs,
    errorCause: row.errorCause as ErrorCause | null,
    source: row.source === "server" ? "server" : "device",
    clientEventId: row.clientEventId,
    createdAt: row.createdAt.toISOString(),
  };
}
