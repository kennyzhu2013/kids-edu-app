import type { ChildRecord, ProgressRecord } from "@/lib/api/memory";
import { db } from "@/lib/api/memory";
import { ensureDemoFamily, syncCatalog } from "@/lib/api/catalog-sync";
import { databaseEnabled, getPrisma } from "@/lib/api/prisma";

const globalStore = globalThis as typeof globalThis & { __qimengReady?: Promise<void> };

export function resetPersistenceForTests() {
  globalStore.__qimengReady = undefined;
}

export function ensureReady() {
  if (!databaseEnabled()) return Promise.resolve();
  globalStore.__qimengReady ??= loadFromDatabase().catch((error: unknown) => {
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
  if (user) state.user.phone = user.phone;
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
  const plans = await prisma.todayPlan.findMany({ where: { child: { userId: "user-demo" } } });
  state.todayPlans = {};
  for (const plan of plans) {
    const ageBand = plan.ageBand === "B" || plan.ageBand === "C" ? plan.ageBand : "A";
    state.todayPlans[plan.childId] = { day: plan.day, ageBand, levelIds: plan.levelIds };
  }
  const quotas = await prisma.gameQuota.findMany({ where: { child: { userId: "user-demo" } } });
  state.gameQuotas = {};
  for (const quota of quotas) {
    state.gameQuotas[quotaKey(quota.childId, quota.gameId, quota.day)] = {
      childId: quota.childId,
      gameId: quota.gameId,
      day: quota.day,
      used: quota.used,
      bonus: quota.bonus,
    };
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
    create: { childId, day: plan.day, ageBand: plan.ageBand, levelIds: plan.levelIds },
    update: { ageBand: plan.ageBand, levelIds: plan.levelIds },
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

export async function persistPhone(phone: string) {
  if (!databaseEnabled()) return;
  await getPrisma().user.update({ where: { id: "user-demo" }, data: { phone } });
}

export async function persistQuota(row: { childId: string; gameId: string; day: string; used: number; bonus: number }) {
  if (!databaseEnabled()) return;
  await getPrisma().gameQuota.upsert({
    where: { childId_gameId_day: { childId: row.childId, gameId: row.gameId, day: row.day } },
    create: row,
    update: { used: row.used, bonus: row.bonus },
  });
}
