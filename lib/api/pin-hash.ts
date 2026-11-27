import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

/** 用 Node 自带的 scrypt。Sprint 1 不引入 bcrypt。 */
export function hashPin(pin: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(pin, salt, 32).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

export function isPinHash(value: string | null | undefined) {
  return Boolean(value?.startsWith("scrypt$"));
}

export function verifyPinHash(pin: string, stored: string) {
  const [kind, salt, hash] = stored.split("$");
  if (kind !== "scrypt" || !salt || !hash) return false;
  const actual = scryptSync(pin, salt, 32);
  const expected = Buffer.from(hash, "hex");
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(actual, expected);
}
