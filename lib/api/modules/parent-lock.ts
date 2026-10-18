import { HttpError, jsonOk, asString } from "@/lib/api/http";
import { db, uid } from "@/lib/api/memory";
import { requireUser } from "@/lib/api/modules/auth";

const SESSION_TTL_MS = 10 * 60_000;
const LOCK_MS = 60_000;

export function verifyParentLock(request: Request, body: Record<string, unknown>) {
  requireUser(request);
  const lock = db().parentLock;
  const now = Date.now();
  if (lock.lockedUntil && lock.lockedUntil > now) {
    throw new HttpError(409, "LOCKED_COOLDOWN", "试错太多，请稍后再试", {
      retryAfterSec: Math.ceil((lock.lockedUntil - now) / 1000),
    });
  }
  const pin = asString(body.pin);
  if (!/^\d{4}$/.test(pin) || pin !== lock.pin) {
    lock.failCount += 1;
    if (lock.failCount >= 5) {
      lock.lockedUntil = now + LOCK_MS;
      lock.failCount = 0;
      throw new HttpError(409, "LOCKED_COOLDOWN", "试错太多，请稍后再试", { retryAfterSec: 60 });
    }
    throw new HttpError(403, "PIN_INVALID", "密码不对");
  }
  lock.failCount = 0;
  lock.lockedUntil = null;
  lock.sessionToken = uid("plock");
  lock.sessionExpireAt = now + SESSION_TTL_MS;
  return jsonOk({
    ok: true,
    token: lock.sessionToken,
    ttlSec: SESSION_TTL_MS / 1000,
  });
}

export function updateParentLock(request: Request, body: Record<string, unknown>) {
  requireUser(request);
  const lock = db().parentLock;
  const oldPin = asString(body.oldPin);
  const header = request.headers.get("x-parent-lock") ?? "";
  const sessionOk = header && header === lock.sessionToken && (lock.sessionExpireAt ?? 0) > Date.now();
  if (oldPin !== lock.pin && !sessionOk) {
    throw new HttpError(403, "PIN_INVALID", "需要原来的密码或刚通过的家长锁");
  }
  const newPin = asString(body.newPin);
  if (!/^\d{4}$/.test(newPin)) {
    throw new HttpError(400, "PIN_INVALID", "新密码需要 4 位数字");
  }
  if (newPin === lock.pin) {
    throw new HttpError(409, "PIN_UNCHANGED", "新密码和原来一样");
  }
  // TODO: 正式环境写入 pinHash（bcrypt / argon2），响应绝不回明文。
  lock.pin = newPin;
  lock.sessionToken = null;
  return jsonOk({
    parentLock: {
      enabled: true,
      pinLength: 4,
    },
  });
}
