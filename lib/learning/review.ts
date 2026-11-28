import { shiftUtcDay, utcDayKey } from "@/lib/learning/dates";
import type { MasteryStatus } from "@/lib/learning/mastery";

/** 间隔写在代码里，不写进迁移。 */
export const REVIEW_INTERVALS = [1, 3, 7, 14] as const;

export const REVIEW_STATUSES = ["pending", "completed", "cancelled"] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

/** 过半客观题正确，且至少对一题，才算这次复习通过。没有客观题时，完成关卡即通过。 */
export const REVIEW_PASS_RATIO = 0.5;

const REVIEW_BANDS = new Set<MasteryStatus>(["not_yet", "learning", "basic", "fluent"]);

export type ReviewDraft = {
  knowledgePointId: string;
  dueOn: string;
  status: ReviewStatus;
};

export function nextDueOn(anchorDay: string, completedCount: number) {
  const index = Math.min(Math.max(completedCount, 0), REVIEW_INTERVALS.length - 1);
  return shiftUtcDay(anchorDay, REVIEW_INTERVALS[index]);
}

export function needsSpacedReview(input: { status: MasteryStatus; failed: boolean; reviewCompletions: number }) {
  if (input.reviewCompletions > 0) return true;
  if (input.failed) return true;
  return REVIEW_BANDS.has(input.status);
}

/**
 * 已有待完成的复习就不再插第二条。
 * 同一个孩子、知识点、dueOn 已有任意状态的行，也不再插。
 */
export function planNextReview(plans: ReviewDraft[], anchorDay: string, completedCount: number, trigger: boolean) {
  if (!trigger) return null;
  if (plans.some((plan) => plan.status === "pending")) return null;
  const dueOn = nextDueOn(anchorDay, completedCount);
  if (plans.some((plan) => plan.dueOn === dueOn)) return null;
  return { dueOn, status: "pending" as const };
}

export function reviewPassed(objective: Array<{ correct: boolean }> | null, stars: number) {
  if (objective && objective.length > 0) {
    const correct = objective.filter((item) => item.correct).length;
    return correct >= 1 && correct / objective.length >= REVIEW_PASS_RATIO;
  }
  return stars >= 1;
}

export function isDue(dueOn: string, day = utcDayKey()) {
  return dueOn <= day;
}
