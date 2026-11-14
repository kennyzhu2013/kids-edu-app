import { HttpError, jsonOk, asString } from "@/lib/api/http";
import { currentChild, db } from "@/lib/api/memory";
import { requireUser } from "@/lib/api/modules/auth";
import { persistQuota, quotaKey } from "@/lib/api/persist";
import { databaseEnabled } from "@/lib/api/prisma";

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
  requireUser(request);
  const child = currentChild(db(), asString(body.childId) || null);
  if (!child) throw new HttpError(403, "FORBIDDEN", "还没有孩子档案");
  if (!db().games.some((game) => game.gameId === gameId)) {
    throw new HttpError(404, "NOT_FOUND", "找不到这个游戏");
  }
  const day = dayFor(asString(body.day) || null);
  if (!databaseEnabled()) {
    return jsonOk({ persisted: false, day, gameId, used: 0, bonus: 0 });
  }
  const row = rowFor(child.id, gameId, day);
  row[field] += 1;
  await persistQuota(row);
  return jsonOk({ persisted: true, day: row.day, gameId, used: row.used, bonus: row.bonus });
}
