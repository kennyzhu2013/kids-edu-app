import { assertSprint1Content } from "../lib/content/sprint1-checks";
import { loadPlayableLevels } from "../lib/content/load";
import { stepsForAge } from "../lib/content/level-steps";
import { scoreMathStarter, type StepAttempt } from "../lib/content/score-math";
import { assertProductionDatabase, configuredParentPin, DEMO_PIN } from "../lib/api/secrets";
import type { LevelDocument } from "../lib/content/schemas";

function correctAttempt(step: LevelDocument["steps"][number]): StepAttempt {
  if (step.type === "tap" || step.type === "count-tap") {
    const choice = Array.isArray(step.answer) ? step.answer[0] : step.answer;
    return { id: step.id, choice: choice ?? "" };
  }
  if (step.type === "drag") {
    const placements: Record<string, string> = {};
    for (const choice of step.choices ?? []) {
      if (choice.basket) placements[choice.id] = choice.basket;
    }
    return { id: step.id, placements };
  }
  if (step.type === "sort") {
    return { id: step.id, order: Array.isArray(step.answer) ? [...step.answer] : [] };
  }
  return { id: step.id, speak: "said_right" };
}

function wrongAttempt(step: LevelDocument["steps"][number]): StepAttempt {
  if (step.type === "speak") return { id: step.id, speak: "said_right" };
  if (step.type === "drag") return { id: step.id, placements: {} };
  if (step.type === "sort") return { id: step.id, order: [] };
  return { id: step.id, choice: "not-the-answer" };
}

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

function withEnv(values: Record<string, string | undefined>, run: () => void) {
  const previous = new Map<string, string | undefined>();
  for (const [key, value] of Object.entries(values)) {
    previous.set(key, process.env[key]);
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  try {
    run();
  } finally {
    for (const [key, value] of previous) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

function main() {
  assertSprint1Content();
  const levels = loadPlayableLevels().filter((level) => level.packId === "math-starter");
  assert(levels.length === 10, "math-starter 应有 10 关");

  for (const level of levels) {
    for (const age of ["A", "B", "C"] as const) {
      const steps = stepsForAge(level, age);
      const correct = scoreMathStarter(level, age, steps.map(correctAttempt));
      assert(correct.ok, `${level.id} ${age} 正确答案应能计分`);
      if (!correct.ok) continue;
      const objective = steps.filter((step) => step.type === "tap" || step.type === "drag" || step.type === "sort");
      if (objective.length > 0) {
        assert(correct.stars === 3, `${level.id} ${age} 客观题全对应得 3 星，实际 ${correct.stars}`);
      } else {
        assert(correct.stars === 0, `${level.id} ${age} 没有客观题时不能靠跟读得到星星`);
      }
      const wrong = scoreMathStarter(
        level,
        age,
        steps.map((step) => (step.type === "speak" ? { id: step.id, speak: "said_right" as const } : wrongAttempt(step))),
      );
      assert(wrong.ok, `${level.id} ${age} 错误答案仍应返回计分结果`);
      if (!wrong.ok) continue;
      if (objective.length > 0) {
        assert(wrong.stars === 0, `${level.id} ${age} 客观题全错不能得到星星，实际 ${wrong.stars}`);
      }
      assert(
        wrong.speak.every((item) => item.result === "说对了" || item.result === "未作答" || item.result === "说错了"),
        "跟读结果要用中文记录",
      );
      const missing = scoreMathStarter(
        level,
        age,
        steps.filter((step) => step.type === "speak").map(correctAttempt),
      );
      if (objective.length > 0) {
        assert(!missing.ok, `${level.id} ${age} 缺客观题作答必须拒绝`);
      }
    }
  }

  const shapes = levels.find((level) => level.id === "math-starter-03");
  assert(shapes, "缺少 math-starter-03");
  if (shapes) {
    const ageA = stepsForAge(shapes, "A").map(correctAttempt);
    const withoutLater = scoreMathStarter(shapes, "A", ageA);
    assert(withoutLater.ok && withoutLater.stars === 3, "年龄段 A 不必交只给 C 的步骤");
    const ageC = scoreMathStarter(shapes, "C", stepsForAge(shapes, "A").map(correctAttempt));
    assert(!ageC.ok, "年龄段 C 缺了自己的客观题不能通过");
  }

  const countToTen = levels.find((level) => level.id === "math-starter-06");
  assert(countToTen, "缺少 math-starter-06");
  if (countToTen) {
    const objective = stepsForAge(countToTen, "B").filter((step) => step.type !== "speak");
    const speakOnly = scoreMathStarter(countToTen, "B", [
      ...objective.map(wrongAttempt),
      { id: "q3", speak: "said_right" },
    ]);
    assert(speakOnly.ok && speakOnly.stars === 0, "跟读说对了也不能把错误的客观题抬到有星星");
    const saidWrong = scoreMathStarter(countToTen, "B", [
      ...objective.map(correctAttempt),
      { id: "q3", speak: "said_wrong" },
    ]);
    assert(saidWrong.ok && saidWrong.stars === 3, "跟读说错了不能压低客观题已经得到的星星");
    assert(saidWrong.ok && saidWrong.speak.some((item) => item.result === "说错了"), "要记下说错了");
    const unanswered = scoreMathStarter(countToTen, "B", objective.map(correctAttempt));
    assert(unanswered.ok && unanswered.speak.some((item) => item.result === "未作答"), "没交的跟读记为未作答");
    assert(unanswered.ok && unanswered.stars === 3, "未作答的跟读不改变客观题星星");
  }

  withEnv({ NODE_ENV: "production", DATABASE_URL: undefined, NEXT_PHASE: undefined }, () => {
    let threw = false;
    try {
      assertProductionDatabase();
    } catch (error) {
      threw = error instanceof Error && error.message.includes("DATABASE_URL");
    }
    assert(threw, "生产环境没有 DATABASE_URL 时必须失败");
    assert(configuredParentPin() === null, "生产环境不能接受演示 PIN");
  });
  withEnv({ NODE_ENV: "production", DATABASE_URL: "postgresql://example", PARENT_LOCK_PIN: DEMO_PIN }, () => {
    assertProductionDatabase();
    assert(configuredParentPin() === null, "生产环境把 2580 当成未配置");
  });
  withEnv({ NODE_ENV: "development", DATABASE_URL: undefined, PARENT_LOCK_PIN: undefined }, () => {
    assertProductionDatabase();
    assert(configuredParentPin() === null, "开发环境未设置 PIN 时不假装有生产密码");
  });

  console.log("Sprint 1 检查通过");
}

main();
