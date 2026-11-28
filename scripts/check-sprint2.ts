import { GAME_VIEWS } from "../components/games/registry";
import { createGamePlugin, gameResult, recordsGameCompleted } from "../components/games/plugin";
import { HttpError } from "../lib/api/http";
import { db, resetMemoryForTests } from "../lib/api/memory";
import { listEvents, postEvents } from "../lib/api/modules/events";
import { changeQuota } from "../lib/api/modules/quota";
import { completeLevel } from "../lib/api/modules/progress";
import { dispatch } from "../lib/api/dispatch";
import { stepsForAge } from "../lib/content/level-steps";
import type { StepAttempt } from "../lib/content/score-math";
import type { LevelDocument } from "../lib/content/schemas";
import {
  EVENT_QUEUE_CAP,
  classifyListen,
  errorCauseForStep,
  mergeEventQueue,
  parseIncomingEvents,
  toDeviceEvent,
} from "../lib/learning/events";
import { selectTodayPlans, todayPlanLoadArgs } from "../lib/learning/today-plan";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function setEnv(key: string, value: string | undefined) {
  if (value === undefined) delete process.env[key];
  else process.env[key] = value;
}

function request() {
  return new Request("http://local.test/api", {
    headers: { authorization: "Bearer stub-parent-token", "content-type": "application/json" },
  });
}

async function call(run: () => Promise<Response> | Response) {
  try {
    const response = await run();
    return { status: response.status, body: (await response.json()) as Record<string, unknown> };
  } catch (error) {
    if (error instanceof HttpError) return { status: error.status, body: { code: error.code, message: error.message } };
    throw error;
  }
}

function deviceEvent(overrides: Record<string, unknown> = {}) {
  return {
    clientEventId: "evt-1",
    childId: "child-demo",
    sessionId: "session-1",
    type: "no_hearing",
    levelId: "math-starter-06",
    stepId: "q3",
    durationMs: 0,
    source: "device",
    correct: null,
    ...overrides,
  };
}

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
  if (step.type === "sort") return { id: step.id, order: Array.isArray(step.answer) ? [...step.answer] : [] };
  return { id: step.id, speak: "said_wrong" };
}

function starsOf(body: Record<string, unknown>) {
  const progress = body.progress as { stars?: number } | undefined;
  return progress?.stars;
}

async function main() {
  setEnv("DATABASE_URL", undefined);
  setEnv("NODE_ENV", "development");
  resetMemoryForTests();
  db();

  const todayArgs = todayPlanLoadArgs("2026-11-28");
  assert(todayArgs.where.day === "2026-11-28", "今日计划要按 day 过滤");
  assert(todayArgs.orderBy.updatedAt === "desc", "今日计划要稳定排序");
  const kept = selectTodayPlans(
    [
      { childId: "c1", day: "2026-11-27", levelIds: ["old"], updatedAt: "2026-11-27T00:00:00.000Z" },
      { childId: "c1", day: "2026-11-28", levelIds: ["early"], updatedAt: "2026-11-28T01:00:00.000Z" },
      { childId: "c1", day: "2026-11-28", levelIds: ["late"], updatedAt: "2026-11-28T05:00:00.000Z" },
      { childId: "c2", day: "2026-11-27", levelIds: ["other-day"], updatedAt: "2026-11-28T09:00:00.000Z" },
    ],
    "2026-11-28",
  );
  assert(kept.length === 1 && kept[0]?.levelIds[0] === "late", "昨天的今日计划不能盖住今天");

  const kinds = Object.keys(GAME_VIEWS).sort();
  assert(kinds.join(",") === "color-match,count-dash,habit-order,shape-fit,spot-animal", `游戏表缺少种类：${kinds.join(",")}`);

  assert(classifyListen("empty") === "no_hearing", "空听是 no_hearing");
  assert(classifyListen("denied") === "blocked", "没开麦克风不是空听");
  assert(errorCauseForStep("tap") === "recognition_error", "点选错因");
  assert(errorCauseForStep("mystery") === "unknown_error", "判断不了用 unknown_error");
  assert(errorCauseForStep("tap") !== "attention_error", "不能把答错记成注意力");

  const win = gameResult(true, { score: 5, durationMs: 1000 });
  const timeout = gameResult(false, { durationMs: 45000 });
  assert(win.completed && win.reason === "win" && recordsGameCompleted(win), "赢了才是 game_completed");
  assert(!timeout.completed && timeout.reason === "timeout" && !recordsGameCompleted(timeout), "超时不是 game_completed");

  const calls = { started: 0, ended: 0 };
  const abandoned = createGamePlugin({
    onStart() {
      calls.started += 1;
    },
    onEnd() {
      calls.ended += 1;
    },
  });
  abandoned.init();
  abandoned.start();
  abandoned.start();
  abandoned.pause();
  abandoned.submit(gameResult(true));
  const startedCount: number = calls.started;
  const endedAfterClose: number = calls.ended;
  assert(startedCount === 1 && endedAfterClose === 0 && abandoned.getResult() === null, "中途关闭或卸载不是完成");

  const timed = createGamePlugin({
    onStart() {},
    onEnd() {
      calls.ended += 1;
    },
  });
  timed.init();
  timed.start();
  timed.submit(timeout);
  timed.submit(gameResult(true));
  const endedAfterTimeout: number = calls.ended;
  assert(endedAfterTimeout === 1 && timed.getResult()?.reason === "timeout", "超时只结算一次，不能再补成赢");

  const capped = mergeEventQueue(
    Array.from({ length: 101 }, (_, index) => ({ clientEventId: `n${index}` })),
    [{ clientEventId: "n0" }, { clientEventId: "n101" }],
    EVENT_QUEUE_CAP,
  );
  assert(capped.length === EVENT_QUEUE_CAP, "队列要有上限");
  assert(capped[0]?.clientEventId === "n2" && capped.at(-1)?.clientEventId === "n101", "超出上限时丢掉最旧的，重复 id 不追加");
  const withAudio = toDeviceEvent({
    ...deviceEvent(),
    audio: "do-not-upload",
  } as never);
  assert(!("audio" in withAudio) && withAudio.correct === null, "事件队列不能带上音频，空听的 correct 为空");

  const badSource = parseIncomingEvents(deviceEvent({ type: "question_answered", source: "server", correct: true }));
  assert(!badSource.ok, "客户端不能把作答标成 server");
  const badHearing = parseIncomingEvents(deviceEvent({ correct: false }));
  assert(!badHearing.ok && badHearing.message.includes("correct"), "no_hearing 不能带 correct");
  const badCause = parseIncomingEvents(deviceEvent({ type: "question_failed", errorCause: "" }));
  assert(!badCause.ok, "错因不能是空字符串");

  const wrong = await call(() =>
    completeLevel(request(), "math-starter-01", {
      childId: "child-demo",
      stars: 3,
      score: 100,
      duration: 12,
      clientEventId: "evt-wrong-stars",
      steps: [
        { id: "q1", choice: "two" },
        { id: "q2", choice: "s3" },
        { id: "q3", choice: "n3" },
        { id: "q-drag", placements: { apple: "sky", star: "fruit" } },
      ],
    }),
  );
  assert(wrong.status === 200 && starsOf(wrong.body) === 0, `伪造星星应被服务端打回 0，实际 ${wrong.status} ${starsOf(wrong.body)}`);
  const serverRows = db().learningEvents.filter((item) => item.source === "server" && item.levelId === "math-starter-01");
  const objective = stepsForAge(db().playableLevels["math-starter-01"]!, "A").filter(
    (step) => step.type === "tap" || step.type === "drag" || step.type === "sort",
  );
  for (const step of objective) {
    const row = serverRows.find((item) => item.stepId === step.id && item.type === "question_failed");
    assert(row?.correct === false && row.source === "server", `${step.id} 应由服务端记为答错`);
    assert(step.knowledgePointIds.includes(row.knowledgePointId ?? ""), `${step.id} 的知识点要来自夹具`);
  }
  assert(
    serverRows.some((item) => item.type === "lesson_completed" && item.source === "server"),
    "math-starter 完成要有服务端 lesson_completed",
  );
  const beforeRetry = db().learningEvents.length;
  const retry = await call(() =>
    completeLevel(request(), "math-starter-01", {
      childId: "child-demo",
      stars: 3,
      score: 100,
      duration: 12,
      clientEventId: "evt-wrong-stars",
      steps: [
        { id: "q1", choice: "two" },
        { id: "q2", choice: "s3" },
        { id: "q3", choice: "n3" },
        { id: "q-drag", placements: { apple: "sky", star: "fruit" } },
      ],
    }),
  );
  assert(retry.status === 200 && retry.body.idempotent === true, "同一完成 id 第二次应幂等");
  assert(db().learningEvents.length === beforeRetry, "重复完成不能再追加服务端事件");

  const child = db().children.find((item) => item.id === "child-demo");
  assert(child, "缺少演示孩子");
  child.ageBand = "B";
  const counted = db().playableLevels["math-starter-06"];
  assert(counted, "缺少 math-starter-06");
  const countedSteps = stepsForAge(counted, "B").map((step) =>
    step.type === "speak" ? { id: step.id, speak: "said_wrong" as const } : correctAttempt(step),
  );
  const spoken = await call(() =>
    completeLevel(request(), "math-starter-06", {
      childId: "child-demo",
      stars: 1,
      score: 10,
      duration: 9,
      clientEventId: "evt-speak",
      steps: countedSteps,
    }),
  );
  assert(spoken.status === 200 && starsOf(spoken.body) === 3, `跟读说错不能压低客观题星星，实际 ${starsOf(spoken.body)}`);
  assert(
    !db().learningEvents.some((item) => item.source === "server" && item.levelId === "math-starter-06" && item.stepId === "q3"),
    "跟读不能写成服务端权威作答",
  );
  const starsBeforeHearing = db().progress.find((item) => item.levelId === "math-starter-06")?.stars;
  const heard = await call(() => postEvents(request(), deviceEvent({ clientEventId: "hear-1" })));
  assert(heard.status === 200, `空听应写入，实际 ${heard.status} ${JSON.stringify(heard.body)}`);
  const heardAgain = await call(() => postEvents(request(), deviceEvent({ clientEventId: "hear-1" })));
  assert(heardAgain.status === 200, "重复空听请求应成功返回已有行");
  const heardRows = (heardAgain.body.events as Array<{ idempotent?: boolean; id?: string }> | undefined) ?? [];
  assert(heardRows[0]?.idempotent === true, "同一 clientEventId 第二次不追加");
  assert(db().learningEvents.filter((item) => item.clientEventId === "hear-1").length === 1, "空听只有一行");
  assert(db().progress.find((item) => item.levelId === "math-starter-06")?.stars === starsBeforeHearing, "空听不改变星星");
  const listed = await call(() => listEvents(request(), new URL("http://local.test/api/events?childId=child-demo&type=no_hearing")));
  const listedEvents = (listed.body.events as Array<{ type?: string; correct?: boolean | null; clientEventId?: string }> | undefined) ?? [];
  assert(
    listed.status === 200 && listedEvents.some((item) => item.clientEventId === "hear-1" && item.type === "no_hearing" && item.correct == null),
    "no_hearing 要能查到，且 correct 为空",
  );
  const rejected = await call(() => postEvents(request(), deviceEvent({ clientEventId: "hear-bad", correct: false })));
  assert(rejected.status === 400, "带 correct 的空听要拒绝");
  assert(!db().learningEvents.some((item) => item.clientEventId === "hear-bad"), "被拒绝的空听不能入库");

  const failed = await call(() =>
    postEvents(request(), deviceEvent({ clientEventId: "fail-1", type: "question_failed", levelId: "lang-starter-01", stepId: "q1", correct: false })),
  );
  assert(failed.status === 200, "漏写错因时要记成 unknown_error 而不是失败");
  assert(
    db().learningEvents.find((item) => item.clientEventId === "fail-1")?.errorCause === "unknown_error",
    "判断不了的错因是 unknown_error",
  );

  db().children.push({
    id: "child-foreign",
    userId: "user-other",
    nickname: "别人",
    ageBand: "A",
    avatar: null,
    isCurrent: false,
  });
  const foreign = await call(() => postEvents(request(), deviceEvent({ clientEventId: "foreign", childId: "child-foreign" })));
  const missingChild = await call(() => postEvents(request(), deviceEvent({ clientEventId: "missing-child", childId: "child-missing" })));
  const blankChild = await call(() => postEvents(request(), deviceEvent({ clientEventId: "blank-child", childId: " " })));
  assert(foreign.status === 404 && missingChild.status === 404, `不属于当前用户的孩子要 404，实际 ${foreign.status}/${missingChild.status}`);
  assert(blankChild.status === 400 || blankChild.status === 404, "空孩子 id 不能静默记到当前孩子");
  assert(!db().learningEvents.some((item) => item.childId === "child-foreign" || item.clientEventId === "missing-child"), "404 不能写入事件");

  const firstCharge = await call(() =>
    changeQuota(request(), "game-color-match", { childId: "child-demo", day: "2026-11-28", clientEventId: "charge-1", reason: "win" }, "used"),
  );
  const secondCharge = await call(() =>
    changeQuota(request(), "game-color-match", { childId: "child-demo", day: "2026-11-28", clientEventId: "charge-1", reason: "win" }, "used"),
  );
  assert(firstCharge.status === 200 && firstCharge.body.idempotent === false, "第一次消耗要记下来");
  assert(secondCharge.status === 200 && secondCharge.body.idempotent === true, "同一消耗键不能扣第二次");
  assert(Object.keys(db().quotaCharges).filter((id) => id === "charge-1").length === 1, "消耗幂等键只有一条");
  let localPlays = 0;
  for (const result of [firstCharge, secondCharge]) {
    if (result.body.idempotent) continue;
    if (!result.body.persisted) localPlays += 1;
  }
  assert(localPlays === 1, "无库时客户端也只能按这个键扣一次本地次数");
  const otherCharge = await call(() =>
    changeQuota(request(), "game-color-match", { childId: "child-demo", day: "2026-11-28", clientEventId: "charge-2", reason: "timeout" }, "used"),
  );
  assert(otherCharge.status === 200 && otherCharge.body.idempotent === false, "超时仍然消耗一次，但是另一次");
  const foreignCharge = await call(() =>
    changeQuota(request(), "game-color-match", { childId: "child-foreign", day: "2026-11-28", clientEventId: "charge-foreign", reason: "timeout" }, "used"),
  );
  assert(foreignCharge.status === 404 && !db().quotaCharges["charge-foreign"], "幂等消耗不能记到别人的孩子");
  const legacy = await call(() => changeQuota(request(), "game-color-match", { day: "2026-11-28" }, "used"));
  assert(legacy.status === 200 && legacy.body.persisted === false, "不带幂等键的旧消耗仍然可用");

  const previousNodeEnv = process.env.NODE_ENV;
  const previousDatabase = process.env.DATABASE_URL;
  try {
    setEnv("NODE_ENV", "production");
    setEnv("DATABASE_URL", undefined);
    const blocked = await dispatch(
      new Request("http://local.test/api/events", {
        method: "POST",
        headers: { authorization: "Bearer stub-parent-token", "content-type": "application/json" },
        body: "{}",
      }),
      "POST",
      "/events",
      {},
    );
    const blockedBody = (await blocked.json()) as { message?: string };
    assert(blocked.status === 503 && String(blockedBody.message).includes("DATABASE_URL"), "生产环境没有数据库要 503");
    let memoryBlocked = false;
    try {
      db();
    } catch (error) {
      memoryBlocked = error instanceof Error && error.message.includes("DATABASE_URL");
    }
    assert(memoryBlocked, "生产环境没有数据库不能建立内存账本");
  } finally {
    setEnv("NODE_ENV", previousNodeEnv);
    setEnv("DATABASE_URL", previousDatabase);
  }

  console.log("Sprint 2 检查通过");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.stack ?? error.message : error);
  process.exit(1);
});
