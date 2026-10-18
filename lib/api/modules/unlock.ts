import { HttpError, jsonOk, asString } from "@/lib/api/http";
import { activeEntitlements, db, uid, type EntitlementRecord } from "@/lib/api/memory";
import { requireUser } from "@/lib/api/modules/auth";

export function unlockWithAd(request: Request, body: Record<string, unknown>) {
  requireUser(request);
  const levelId = asString(body.levelId);
  const packId = asString(body.packId);
  const gameId = asString(body.gameId);
  const adToken = asString(body.adToken);
  if (!levelId && !packId && !gameId) {
    throw new HttpError(400, "TARGET_REQUIRED", "需要 levelId、packId 或 gameId");
  }
  if (!adToken) {
    throw new HttpError(403, "AD_REJECTED", "广告校验失败");
  }
  // TODO: 用广告平台回执校验 adToken。任何非空 token 目前都当作看完。
  const scope = levelId || packId || gameId;
  const existing = db().entitlements.find((item) => item.type === "ad_unlock" && item.scope === scope);
  if (existing && existing.expireAt && new Date(existing.expireAt).getTime() > Date.now()) {
    throw new HttpError(409, "ALREADY_UNLOCKED", "已经解锁或额度用尽", {
      unlockUntil: existing.expireAt,
    });
  }
  const expireAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const entitlement: EntitlementRecord = {
    id: uid("ent"),
    userId: db().user.id,
    childId: null,
    type: "ad_unlock",
    scope,
    expireAt,
    source: "ad",
    createdAt: new Date().toISOString(),
  };
  db().entitlements.push(entitlement);
  return jsonOk({
    entitlement,
    unlockUntil: expireAt,
    todo: "AD_SDK",
  });
}

export function listEntitlements(request: Request) {
  requireUser(request);
  return jsonOk({
    entitlements: activeEntitlements(db()).map((item) => ({
      id: item.id,
      type: item.type,
      scope: item.scope,
      expireAt: item.expireAt,
      source: item.source,
    })),
  });
}
