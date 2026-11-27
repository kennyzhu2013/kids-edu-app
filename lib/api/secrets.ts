export const DEMO_PIN = "2580";
export const DEMO_SMS_CODE = "000000";
export const DEMO_ADMIN_TOKEN = "dev-admin";

const logged = new Set<string>();

export function isProduction() {
  return process.env.NODE_ENV === "production";
}

export function logConfigOnce(key: string, message: string) {
  if (logged.has(key)) return;
  logged.add(key);
  console.error(message);
}

export class ProductionConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProductionConfigError";
  }
}

export function assertProductionDatabase() {
  if (!isProduction()) return;
  if (process.env.NEXT_PHASE === "phase-production-build") return;
  const url = process.env.DATABASE_URL?.trim() ?? "";
  if (url) return;
  const message = "生产环境需要 DATABASE_URL。没有数据库时不能启动，也不能用内存数据当作已经保存。";
  logConfigOnce("database", message);
  throw new ProductionConfigError(message);
}

/** 生产环境缺省或等于 2580 时返回 null。开发环境仍可用演示密码。 */
export function configuredParentPin() {
  const pin = (process.env.PARENT_LOCK_PIN ?? "").trim();
  if (!/^\d{4}$/.test(pin)) return null;
  if (isProduction() && pin === DEMO_PIN) return null;
  return pin;
}

export function initialParentPin() {
  if (isProduction()) return configuredParentPin() ?? "";
  return (process.env.PARENT_LOCK_PIN ?? "").trim() || DEMO_PIN;
}
