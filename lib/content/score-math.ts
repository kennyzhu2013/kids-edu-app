import { z } from "zod";
import type { AgeBand } from "@/lib/age";
import { stepsForAge } from "@/lib/content/level-steps";
import type { LevelDocument } from "@/lib/content/schemas";

const OBJECTIVE = new Set(["tap", "drag", "sort"]);

export const speakMarkSchema = z.enum(["said_right", "said_wrong", "unanswered"]);

export const stepAttemptSchema = z.object({
  id: z.string().min(1),
  choice: z.string().optional(),
  placements: z.record(z.string(), z.string()).optional(),
  order: z.array(z.string()).optional(),
  speak: speakMarkSchema.optional(),
});

export const stepAttemptListSchema = z.array(stepAttemptSchema);

export type SpeakMark = z.infer<typeof speakMarkSchema>;
export type StepAttempt = z.infer<typeof stepAttemptSchema>;

const SPEAK_LABEL: Record<SpeakMark, "说对了" | "说错了" | "未作答"> = {
  said_right: "说对了",
  said_wrong: "说错了",
  unanswered: "未作答",
};

export type MathScore = {
  ok: true;
  stars: number;
  score: number;
  objective: Array<{ stepId: string; correct: boolean }>;
  speak: Array<{ stepId: string; result: "说对了" | "说错了" | "未作答" }>;
};

export type MathScoreResult = MathScore | { ok: false; message: string };

/**
 * 只看 tap / drag / sort 的作答。跟读结果会返回，但不进入星星和分数。
 * 不读取客户端传来的 stars。
 */
export function scoreMathStarter(level: LevelDocument, age: AgeBand, attempts: StepAttempt[]): MathScoreResult {
  if (level.packId !== "math-starter") {
    return { ok: false, message: "只有 math-starter 在服务端计分" };
  }
  const seen = new Set<string>();
  for (const attempt of attempts) {
    if (seen.has(attempt.id)) return { ok: false, message: "同一步交了两次" };
    seen.add(attempt.id);
  }
  const byId = new Map(attempts.map((attempt) => [attempt.id, attempt]));
  const steps = stepsForAge(level, age);
  const known = new Set(level.steps.map((step) => step.id));
  for (const attempt of attempts) {
    if (!known.has(attempt.id)) return { ok: false, message: "有一步不属于这一关" };
  }

  const objective: MathScore["objective"] = [];
  const speak: MathScore["speak"] = [];
  for (const step of steps) {
    const attempt = byId.get(step.id);
    if (step.type === "speak") {
      speak.push({ stepId: step.id, result: SPEAK_LABEL[attempt?.speak ?? "unanswered"] });
      continue;
    }
    if (!OBJECTIVE.has(step.type)) {
      return { ok: false, message: "这一步暂时不能在服务端计分" };
    }
    if (!attempt) return { ok: false, message: "math-starter 需要带上每道客观题的作答" };
    objective.push({ stepId: step.id, correct: objectiveCorrect(step, attempt) });
  }

  const total = objective.length;
  const correct = objective.filter((item) => item.correct).length;
  const ratio = total === 0 ? 0 : correct / total;
  const stars = total === 0 ? 0 : ratio === 1 ? 3 : ratio >= 2 / 3 ? 2 : ratio > 0 ? 1 : 0;
  return {
    ok: true,
    stars,
    score: Math.round(ratio * 100),
    objective,
    speak,
  };
}

function objectiveCorrect(step: LevelDocument["steps"][number], attempt: StepAttempt) {
  if (step.type === "tap") {
    if (!attempt.choice) return false;
    return Array.isArray(step.answer) ? step.answer.includes(attempt.choice) : step.answer === attempt.choice;
  }
  if (step.type === "drag") {
    const placements = attempt.placements ?? {};
    const choices = step.choices ?? [];
    if (choices.length === 0) return false;
    return choices.every((choice) => Boolean(choice.basket) && placements[choice.id] === choice.basket);
  }
  if (step.type === "sort") {
    if (!Array.isArray(step.answer) || !attempt.order) return false;
    return step.answer.length === attempt.order.length && step.answer.every((id, index) => id === attempt.order?.[index]);
  }
  return false;
}
