/** 今日任务按 UTC 日期取。和 tasksForToday 用的是同一天，避免昨天的行盖住今天。 */
export { utcDayKey } from "@/lib/learning/dates";

export function todayPlanLoadArgs(day: string) {
  return {
    where: { child: { userId: "user-demo" }, day },
    orderBy: { updatedAt: "desc" as const },
  };
}

type PlanRow = {
  childId: string;
  day: string;
  updatedAt?: Date | string | null;
};

/** 只留当天。同一孩子有多行时留更新时间最晚的一行。 */
export function selectTodayPlans<T extends PlanRow>(plans: T[], day: string) {
  const sorted = plans.filter((plan) => plan.day === day).sort((a, b) => timeOf(b.updatedAt) - timeOf(a.updatedAt));
  const seen = new Set<string>();
  const kept: T[] = [];
  for (const plan of sorted) {
    if (seen.has(plan.childId)) continue;
    seen.add(plan.childId);
    kept.push(plan);
  }
  return kept;
}

function timeOf(value: Date | string | null | undefined) {
  if (!value) return 0;
  const time = value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Number.isFinite(time) ? time : 0;
}
