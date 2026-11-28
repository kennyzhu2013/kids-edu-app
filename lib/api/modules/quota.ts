import { HttpError, jsonOk, asString } from "@/lib/api/http";
import { currentChild, db, uid } from "@/lib/api/memory";
import { requireUser } from "@/lib/api/modules/auth";
import { requireOwnedChild } from "@/lib/api/modules/events";
import { isUniqueConflict, persistQuota, persistQuotaCharge, quotaKey } from "@/lib/api/persist";
import { databaseEnabled } from "@/lib/api/prisma";

const END_REASONS = new Set(["win", "timeout", "exit", "aborted"]);

function dayFor(value: string | null) {
  if (value && /^\d{4}-\d{1,2}-\d{1,2}$/.test(value)) return value;
  return new Date().toISOString().slice(0, 10);
}

function rowFor(childId: string, gameId: string, day: string) {
  const state = db();
  const key = quotaKey(childId, gameId, day);
  const existing = state.gameQuotas[key];
  if (existing) return existing;
  const created = { childId, gameId, day, used: 0, bonus: 0 };
  state.gameQuotas[key] = created;
  return created;
}

function quotaBody(persisted: boolean, idempotent: boolean, day: string, gameId: string, used: number, bonus: number) {
  return jsonOk({ persisted, idempotent, day, gameId, used, bonus });
}

export function listQuota(request: Request, url: URL) {
  requireUser(request);
  const child = currentChild(db(), url.searchParams.get("childId"));
  if (!child) throw new HttpError(403, "FORBIDDEN", "还没有孩子档案");
  const day = dayFor(url.searchParams.get("day"));
  const quotas = Object.values(db().gameQuotas).filter((item) => item.childId === child.id && item.day === day);
  return jsonOk({
    persisted: databaseEnabled(),
    childId: child.id,
    day,
    quotas: quotas.map((item) => ({ gameId: item.gameId, used: item.used, bonus: item.bonus })),
  });
}

export async function changeQuota(request: Request, gameId: string, body: Record<string, unknown>, field: "used" | "bonus") {
  const user = requireUser(request);
  const clientEventId = asString(body.clientEventId);
  const reason = asString(body.reason);
  if (reason && !END_REASONS.has(reason)) {
    throw new HttpError(400, "BAD_REQUEST", "reason 不在允许的范围内");
  }
  const requestedChild = asString(body.childId);
  // 带幂等键的消耗必须点名自己的孩子。不带键的旧调用仍回落到当前孩子。
  const child = clientEventId ? requireOwnedChild(user.id, requestedChild) : currentChild(db(), requestedChild || null);
  if (!child) throw new HttpError(403, "FORBIDDEN", "还没有孩子档案");
  if (!db().games.some((game) => game.gameId === gameId)) {
    throw new HttpError(404, "NOT_FOUND", "找不到这个游戏");
  }
  const day = dayFor(asString(body.day) || null);
  if (!databaseEnabled()) {
    if (clientEventId) {
      if (db().quotaCharges[clientEventId]) return quotaBody(false, true, day, gameId, 0, 0);
      db().quotaCharges[clientEventId] = { childId: child.id, gameId, day };
    }
    return quotaBody(false, false, day, gameId, 0, 0);
  }
  if (clientEventId && db().quotaCharges[clientEventId]) {
    const current = rowFor(child.id, gameId, day);
    return quotaBody(true, true, current.day, gameId, current.used, current.bonus);
  }
  if (clientEventId) {
    db().quotaCharges[clientEventId] = { childId: child.id, gameId, day };
    try {
      await persistQuotaCharge({ id: uid("chg"), clientEventId, childId: child.id, gameId, day });
    } catch (error) {
      if (!isUniqueConflict(error)) {
        delete db().quotaCharges[clientEventId];
        throw error;
      }
      const current = rowFor(child.id, gameId, day);
      return quotaBody(true, true, current.day, gameId, current.used, current.bonus);
    }
  }
  const row = rowFor(child.id, gameId, day);
  row[field] += 1;
  await persistQuota(row);
  return quotaBody(true, false, row.day, gameId, row.used, row.bonus);
}
