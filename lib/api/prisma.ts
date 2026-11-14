import { PrismaClient } from "@prisma/client";

const globalStore = globalThis as typeof globalThis & { __qimengPrisma?: PrismaClient };

export function databaseEnabled() {
  return Boolean(process.env.DATABASE_URL);
}

export function getPrisma() {
  if (!databaseEnabled()) {
    throw new Error("DATABASE_URL 未设置");
  }
  globalStore.__qimengPrisma ??= new PrismaClient();
  return globalStore.__qimengPrisma;
}
