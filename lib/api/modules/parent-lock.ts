import { HttpError, jsonOk, asString } from "@/lib/api/http";
import { db, uid } from "@/lib/api/memory";
import { hashPin, isPinHash, verifyPinHash } from "@/lib/api/pin-hash";
import { persistParentPinHash } from "@/lib/api/persist";
import { DEMO_PIN, configuredParentPin, isProduction, logConfigOnce } from "@/lib/api/secrets";
import { requireUser } from "@/lib/api/modules/auth";

const SESSION_TTL_MS = 10 * 60_000;
const LOCK_MS = 60_000;

function lockReady() {
  const lock = db().parentLock;
  if (!isProduction()) return true;
  if (isPinHash(lock.pinHash)) return true;
  return Boolean(configuredParentPin());
}

function pinMatches(pin: string) {
  if (!/^\d{4}$/.test(pin)) return false;
  if (isProduction() && pin === DEMO_PIN) return false;
  const lock = db().parentLock;
  if (isPinHash(lock.pinHash)) return verifyPinHash(pin, lock.pinHash ?? "");
  return pin !== "" && pin === lock.pin;
}

function rejectUnconfiguredLock() {
  logConfigOnce("pin", "生产环境的 PARENT_LOCK_PIN 未设置，或仍是演示值 2580。家长锁已拒绝。");
  throw new HttpError(503, "PIN_UNAVAILABLE", "家长锁在生产环境还没有可用的密码");
}

export async function verifyParentLock(request: Request, body: Record<string, unknown>) {
  requireUser(request);
  if (!lockReady()) rejectUnconfiguredLock();
  const lock = db().parentLock;
  const now = Date.now();
  if (lock.lockedUntil && lock.lockedUntil > now) {
    throw new HttpError(409, "LOCKED_COOLDOWN", "试错太多，请稍后再试", {
      retryAfterSec: Math.ceil((lock.lockedUntil - now) / 1000),
    });
  }
  const pin = asString(body.pin);
  if (isProduction() && pin === DEMO_PIN) {
    logConfigOnce("pin-demo", "生产环境拒绝演示家长锁密码 2580。");
  }
  if (!pinMatches(pin)) {
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

export async function updateParentLock(request: Request, body: Record<string, unknown>) {
  requireUser(request);
  if (!lockReady()) rejectUnconfiguredLock();
  const lock = db().parentLock;
  const oldPin = asString(body.oldPin);
  const header = request.headers.get("x-parent-lock") ?? "";
  const sessionOk = header && header === lock.sessionToken && (lock.sessionExpireAt ?? 0) > Date.now();
  if (!pinMatches(oldPin) && !sessionOk) {
    throw new HttpError(403, "PIN_INVALID", "需要原来的密码或刚通过的家长锁");
  }
  const newPin = asString(body.newPin);
  if (!/^\d{4}$/.test(newPin) || (isProduction() && newPin === DEMO_PIN)) {
    throw new HttpError(400, "PIN_INVALID", "新密码需要 4 位数字");
  }
  if (pinMatches(newPin)) {
    throw new HttpError(409, "PIN_UNCHANGED", "新密码和原来一样");
  }
  if (isProduction()) {
    const pinHash = hashPin(newPin);
    lock.pinHash = pinHash;
    lock.pin = "";
    await persistParentPinHash(pinHash);
  } else {
    lock.pin = newPin;
  }
  lock.sessionToken = null;
  return jsonOk({
    parentLock: {
      enabled: true,
      pinLength: 4,
    },
  });
}
