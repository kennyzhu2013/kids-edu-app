/**
 * 库存的「哪一天」一律是 UTC、并且补零。
 * 展示才换时区。进程本地时区不能把同一瞬间挪到另一天。
 */

export type PlayQuota = {
  date: string;
  used: Record<string, number>;
  bonus: Record<string, number>;
};

export function utcDayKey(date = new Date()) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** 2026-1-5 和 2026-01-05 是同一天。非法日期返回 null。 */
export function parseDayKey(value: string) {
  const match = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(value.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const probe = new Date(Date.UTC(year, month - 1, day));
  if (probe.getUTCFullYear() !== year || probe.getUTCMonth() !== month - 1 || probe.getUTCDate() !== day) return null;
  return utcDayKey(probe);
}

export function sameDayKey(left: string, right: string) {
  const a = parseDayKey(left);
  const b = parseDayKey(right);
  return a !== null && a === b;
}

export function shiftUtcDay(key: string, delta: number) {
  const parsed = parseDayKey(key);
  if (!parsed) return key;
  const [year, month, day] = parsed.split("-").map(Number);
  return utcDayKey(new Date(Date.UTC(year, month - 1, day + delta)));
}

export function utcDayDiff(laterKey: string, earlierKey: string) {
  const later = parseDayKey(laterKey);
  const earlier = parseDayKey(earlierKey);
  if (!later || !earlier) return 0;
  const [y1, m1, d1] = later.split("-").map(Number);
  const [y2, m2, d2] = earlier.split("-").map(Number);
  return Math.round((Date.UTC(y1, m1 - 1, d1) - Date.UTC(y2, m2 - 1, d2)) / 86_400_000);
}

/** 把存好的 UTC 日显示成某个时区里的日历日。正午取值，避免时区把日期再推一天。 */
export function displayUtcDay(dayKey: string, timeZone = "UTC") {
  const parsed = parseDayKey(dayKey);
  if (!parsed) return dayKey;
  const [year, month, day] = parsed.split("-").map(Number);
  const instant = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(instant);
}

/** 周一 00:00 UTC 起到下周一，不看进程本地时区。 */
export function utcWeekBounds(now = new Date()) {
  const key = utcDayKey(now);
  const [year, month, day] = key.split("-").map(Number);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  const fromMonday = (weekday + 6) % 7;
  const start = new Date(Date.UTC(year, month - 1, day - fromMonday));
  const end = new Date(Date.UTC(year, month - 1, day - fromMonday + 7));
  return {
    start,
    end,
    startKey: utcDayKey(start),
    endKey: shiftUtcDay(utcDayKey(start), 6),
  };
}

export function isInUtcWeek(iso: string, now = new Date()) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return false;
  const { start, end } = utcWeekBounds(now);
  return date.getTime() >= start.getTime() && date.getTime() < end.getTime();
}

function countMap(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const counts: Record<string, number> = {};
  for (const [key, count] of Object.entries(value)) {
    if (typeof count === "number" && Number.isFinite(count) && count > 0) counts[key] = count;
  }
  return counts;
}

/**
 * 旧的 qimeng:plays 不补零。同一天就保留次数，并写回补零的日期。
 * 不是同一天则从 0 开始，不把旧次数清进今天。
 */
export function resolvePlayQuota(stored: PlayQuota | null, todayKey: string) {
  const today = parseDayKey(todayKey) ?? todayKey;
  if (!stored || typeof stored.date !== "string" || !sameDayKey(stored.date, today)) {
    return { quota: { date: today, used: {}, bonus: {} } satisfies PlayQuota, rewrite: false };
  }
  const quota: PlayQuota = {
    date: today,
    used: countMap(stored.used),
    bonus: countMap(stored.bonus),
  };
  return { quota, rewrite: stored.date !== today };
}

export function playsFromStorage(raw: string | null, now = new Date()) {
  let parsed: PlayQuota | null = null;
  if (raw) {
    try {
      parsed = JSON.parse(raw) as PlayQuota;
    } catch {
      parsed = null;
    }
  }
  const resolved = resolvePlayQuota(parsed, utcDayKey(now));
  return {
    quota: resolved.quota,
    rewritten: resolved.rewrite ? JSON.stringify(resolved.quota) : null,
  };
}

export type QuotaDayRow = {
  childId: string;
  gameId: string;
  day: string;
  used: number;
  bonus: number;
};

/** 不补零的配额行和补零行算同一天，次数相加，只留补零的 key。 */
export function mergeQuotaRows<T extends QuotaDayRow>(rows: T[]) {
  const merged = new Map<string, T>();
  for (const row of rows) {
    const day = parseDayKey(row.day);
    if (!day) continue;
    const key = `${row.childId}:${row.gameId}:${day}`;
    const existing = merged.get(key);
    if (!existing) {
      merged.set(key, { ...row, day });
      continue;
    }
    existing.used += row.used;
    existing.bonus += row.bonus;
  }
  return [...merged.values()];
}
