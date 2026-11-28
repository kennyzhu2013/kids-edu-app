"use client";

import { useSyncExternalStore } from "react";
import type { AgeBand } from "@/lib/age";
import { parseDayKey, playsFromStorage, sameDayKey, utcDayKey } from "@/lib/learning/dates";

const KEY = "qimeng:v1";

export type LocalChild = {
  id: string;
  nickname: string;
  ageBand: AgeBand;
};

type Store = {
  child: LocalChild | null;
  token: string;
  sound: boolean;
  pendingAge: AgeBand | null;
  parentToken: string | null;
  parentUntil: number;
  vip: boolean;
  noAds: boolean;
};

const EMPTY: Store = {
  child: null,
  token: "stub-parent-token",
  sound: true,
  pendingAge: null,
  parentToken: null,
  parentUntil: 0,
  vip: false,
  noAds: false,
};

function read(): Store {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    return { ...EMPTY, ...(JSON.parse(raw) as Partial<Store>) };
  } catch {
    return EMPTY;
  }
}

function write(next: Store) {
  localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new Event("qimeng-store"));
}

function patch(partial: Partial<Store>) {
  write({ ...read(), ...partial });
}

export function readStore() {
  return read();
}

const SERVER_STORE: Store = EMPTY;
let cacheRaw = "";
let cacheStore: Store = EMPTY;

function subscribe(onStoreChange: () => void) {
  window.addEventListener("qimeng-store", onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener("qimeng-store", onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function clientStore(): Store {
  const raw = localStorage.getItem(KEY) ?? "";
  if (raw === cacheRaw) return cacheStore;
  cacheRaw = raw;
  if (!raw) {
    cacheStore = EMPTY;
    return cacheStore;
  }
  try {
    cacheStore = { ...EMPTY, ...(JSON.parse(raw) as Partial<Store>) };
  } catch {
    cacheStore = EMPTY;
  }
  return cacheStore;
}

function useStored() {
  return useSyncExternalStore(subscribe, clientStore, () => SERVER_STORE);
}

export function useChild() {
  return useStored().child;
}

export function useSoundPreference() {
  return useStored().sound;
}

export function useVip() {
  return useStored().vip;
}

export function useParentUnlocked() {
  return Boolean(useStored().parentToken);
}

const EMPTY_QUOTA: Quota = { date: "", used: {}, bonus: {} };
let quotaCache: { raw: string; today: string; quota: Quota } | null = null;

function clientQuota(): Quota {
  const raw = localStorage.getItem("qimeng:plays") ?? "";
  const today = localDayKey();
  if (quotaCache && quotaCache.raw === raw && quotaCache.today === today) return quotaCache.quota;
  const quota = readQuota();
  quotaCache = { raw, today, quota };
  return quota;
}

export function useRemainingPlays(gameId: string, dailyFree: number, vip: boolean) {
  const quota = useSyncExternalStore(subscribe, clientQuota, () => EMPTY_QUOTA);
  if (vip) return Number.POSITIVE_INFINITY;
  return Math.max(0, dailyFree + (quota.bonus[gameId] ?? 0) - (quota.used[gameId] ?? 0));
}

export function readChild() {
  return read().child;
}

export function saveChild(child: LocalChild) {
  patch({ child });
}

export function setPendingAge(pendingAge: AgeBand) {
  patch({ pendingAge });
}

export function readToken() {
  return read().token || "stub-parent-token";
}

export function saveToken(token: string) {
  patch({ token });
}

export function soundEnabled() {
  return read().sound;
}

export function setSound(sound: boolean) {
  patch({ sound });
}

export function saveParentSession(token: string, ttlSec: number) {
  patch({ parentToken: token, parentUntil: Date.now() + ttlSec * 1000 });
}

export function parentSessionToken() {
  const store = read();
  if (!store.parentToken || store.parentUntil < Date.now()) return null;
  return store.parentToken;
}

export function saveEntitlementFlags(flags: { vip: boolean; noAds: boolean }) {
  patch(flags);
}

export function clearLocalProfile() {
  write(EMPTY);
}

type Quota = { date: string; used: Record<string, number>; bonus: Record<string, number> };

/** 配额按补零的 UTC 日存储。旧的不补零 qimeng:plays 会在读取时写回。 */
export function localDayKey(now = new Date()) {
  return utcDayKey(now);
}

function readQuota(): Quota {
  if (typeof window === "undefined") return { date: localDayKey(), used: {}, bonus: {} };
  try {
    const loaded = playsFromStorage(localStorage.getItem("qimeng:plays"), new Date());
    if (loaded.rewritten) writeQuota(loaded.quota);
    return loaded.quota;
  } catch {
    return { date: localDayKey(), used: {}, bonus: {} };
  }
}

function writeQuota(quota: Quota) {
  localStorage.setItem("qimeng:plays", JSON.stringify(quota));
  window.dispatchEvent(new Event("qimeng-store"));
}

export function remainingPlays(gameId: string, dailyFree: number, vip: boolean) {
  if (vip) return Number.POSITIVE_INFINITY;
  const quota = readQuota();
  return Math.max(0, dailyFree + (quota.bonus[gameId] ?? 0) - (quota.used[gameId] ?? 0));
}

export function consumePlay(gameId: string) {
  const quota = readQuota();
  quota.used[gameId] = (quota.used[gameId] ?? 0) + 1;
  writeQuota(quota);
}

export function grantBonusPlay(gameId: string) {
  const quota = readQuota();
  quota.bonus[gameId] = (quota.bonus[gameId] ?? 0) + 1;
  writeQuota(quota);
}

export function applyServerQuotas(day: string, rows: Array<{ gameId: string; used: number; bonus: number }>) {
  const quota: Quota = { date: day, used: {}, bonus: {} };
  for (const row of rows) {
    quota.used[row.gameId] = row.used;
    quota.bonus[row.gameId] = row.bonus;
  }
  writeQuota(quota);
}

export function mergeServerQuota(day: string, row: { gameId: string; used: number; bonus: number }) {
  const quota = readQuota();
  const canonical = parseDayKey(day) ?? localDayKey();
  if (!sameDayKey(quota.date, canonical)) {
    quota.used = {};
    quota.bonus = {};
  }
  quota.date = canonical;
  quota.used[row.gameId] = row.used;
  quota.bonus[row.gameId] = row.bonus;
  writeQuota(quota);
}
