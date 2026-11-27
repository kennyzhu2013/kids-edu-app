import type { AgeBand } from "@/lib/age";
import type { LevelDocument } from "@/lib/content/schemas";

/** 和播放器同一条规则：有年龄标记时只留当前年龄段，一段都没有就用全部步骤。 */
export function stepsForAge(level: LevelDocument, age: AgeBand) {
  const matched = level.steps.filter((step) => !step.ages || step.ages.includes(age));
  return matched.length > 0 ? matched : level.steps;
}
