import { readFileSync } from "node:fs";
import { HttpError } from "../lib/api/http";
import { db, resetMemoryForTests, type ProgressRecord } from "../lib/api/memory";
import { listMastery, listReviews } from "../lib/api/modules/mastery";
import { appendLearningEvent, postEvents } from "../lib/api/modules/events";
import { reconcileLearningState } from "../lib/api/modules/learning-state";
import { listQuota, changeQuota } from "../lib/api/modules/quota";
import { completeLevel, getToday, progressSummary } from "../lib/api/modules/progress";
import { localDayKey } from "../lib/client/store";
import {
  displayUtcDay,
  isInUtcWeek,
  mergeQuotaRows,
  playsFromStorage,
  shiftUtcDay,
  utcDayKey,
} from "../lib/learning/dates";
import {
  MASTERY_WEIGHT,
  MIN_OBJECTIVE_SAMPLES,
  STABILITY_ZERO_DAYS,
  accuracyScore,
  combineMastery,
  consecutiveScore,
  scoreKnowledgePoint,
  stabilityScore,
  type MasteryInputEvent,
} from "../lib/learning/mastery";
import { REVIEW_INTERVALS, nextDueOn, planNextReview } from "../lib/learning/review";
import { DEFAULT_TODAY_TASK_CAP, buildTodayTasks } from "../lib/learning/today-tasks";

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

function event(partial: Partial<MasteryInputEvent> & Pick<MasteryInputEvent, "clientEventId" | "createdAt">): MasteryInputEvent {
  return {
    type: "question_answered",
    source: "server",
    correct: true,
    knowledgePointId: "MA01-001",
    levelId: "math-starter-01",
    stepId: "q1",
    stepType: null,
    ...partial,
  };
}

function correctSteps() {
  return [
    { id: "q1", choice: "three" },
    { id: "q2", choice: "s4" },
    { id: "q3", choice: "n5" },
    { id: "q-drag", placements: { apple: "fruit", star: "sky" } },
  ];
}

async function main() {
  setEnv("DATABASE_URL", undefined);
  setEnv("NODE_ENV", "development");

  assert(MASTERY_WEIGHT.accuracy === 0.4 && MASTERY_WEIGHT.consecutive === 0.25 && MASTERY_WEIGHT.review === 0.2 && MASTERY_WEIGHT.stability === 0.15, "掌握度权重被改掉了");
  assert(MIN_OBJECTIVE_SAMPLES === 3, "客观题样本阈值应是 3");
  assert(STABILITY_ZERO_DAYS === 14, "稳定性衰减天数应是 14");
  assert(REVIEW_INTERVALS.join(",") === "1,3,7,14", "复习间隔应是 1/3/7/14");
  assert(DEFAULT_TODAY_TASK_CAP === 4, "今日默认最多 4 条");
  assert(nextDueOn("2026-01-01", 0) === "2026-01-02", "第一次复习是 1 天后");
  assert(nextDueOn("2026-01-02", 1) === "2026-01-05", "第二次复习是 3 天后");
  assert(nextDueOn("2026-01-05", 2) === "2026-01-12", "第三次复习是 7 天后");
  assert(nextDueOn("2026-01-12", 3) === "2026-01-26", "第四次复习是 14 天后");
  assert(nextDueOn("2026-01-26", 4) === "2026-02-09", "之后仍按 14 天");
  const once = planNextReview([], "2026-01-01", 0, true);
  assert(once?.dueOn === "2026-01-02", "应生成一条复习");
  assert(planNextReview([{ knowledgePointId: "P", dueOn: once.dueOn, status: "pending" }], "2026-01-01", 0, true) === null, "同一天不能再插一条待复习");

  assert(accuracyScore([true, true, true, false]) === 75, "正确率");
  assert(consecutiveScore([true, true, true]) === 100, "连续三次正确是 100");
  assert(consecutiveScore([true, true, false]) === 0, "最近一次答错连续正确归零");
  assert(stabilityScore(new Date("2026-01-15T00:00:00.000Z"), new Date("2026-01-15T12:00:00.000Z")) === 100, "当天成功稳定性是 100");
  assert(stabilityScore(new Date("2026-01-08T00:00:00.000Z"), new Date("2026-01-15T00:00:00.000Z")) === 50, "7 天前成功稳定性是 50");
  assert(stabilityScore(new Date("2026-01-01T00:00:00.000Z"), new Date("2026-01-15T00:00:00.000Z")) === 0, "14 天前成功稳定性是 0");
  assert(combineMastery({ A: 100, C: 100, D: 0, R: 0 }) === 65, "把 R 当成 0 会得到 65");
  assert(combineMastery({ A: 100, C: 100, D: 0, R: null }) === 81, "没有复习事件时要重新归一，不是 65");

  const aged = ["s1", "s2", "s3"].map((step, index) =>
    event({
      clientEventId: `old-${index}:server:${step}:MA01-001`,
      createdAt: "2026-01-01T12:00:00.000Z",
      stepId: step,
    }),
  );
  const agedScore = scoreKnowledgePoint(aged, [{ knowledgePointId: "MA01-001", dueOn: "2026-01-02", status: "pending" }], "MA01-001", new Date("2026-01-15T12:00:00.000Z"));
  assert(agedScore.parts?.R === null, "还没有 review_completed 时 R 不能是 0");
  assert(agedScore.score === 81 && agedScore.status === "fluent", `时间衰减后应是 81 分熟练，实际 ${agedScore.score} ${agedScore.status}`);
  assert(agedScore.score !== combineMastery({ A: 100, C: 100, D: 0, R: 0 }), "R 为空和 R 为 0 不是同一档算法");

  const two = scoreKnowledgePoint(aged.slice(0, 2), [], "MA01-001", new Date("2026-01-01T12:00:00.000Z"));
  assert(two.status === "insufficient" && two.score === null, "样本不够时分数必须是空，不能是 0");

  const recentNow = new Date("2026-01-15T12:00:00.000Z");
  const recent = ["s1", "s2", "s3"].map((step, index) =>
    event({
      clientEventId: `now-${index}:server:${step}:MA04-001`,
      createdAt: "2026-01-15T08:00:00.000Z",
      stepId: step,
      knowledgePointId: "MA04-001",
    }),
  );
  const missed = scoreKnowledgePoint(
    [
      ...recent,
      event({
        clientEventId: "now-miss:server:s4:MA04-001",
        createdAt: "2026-01-15T09:00:00.000Z",
        type: "question_failed",
        correct: false,
        stepId: "s4",
        knowledgePointId: "MA04-001",
      }),
    ],
    [],
    "MA04-001",
    recentNow,
  );
  assert(missed.status === "basic" && missed.score === 60, `单次答错最多掉一档，实际 ${missed.status} ${missed.score}`);

  const heard = scoreKnowledgePoint(
    [
      ...recent,
      event({
        clientEventId: "hear",
        createdAt: "2026-01-15T10:00:00.000Z",
        type: "no_hearing",
        correct: null,
        knowledgePointId: "MA04-001",
      }),
    ],
    [],
    "MA04-001",
    recentNow,
  );
  const clean = scoreKnowledgePoint(recent, [], "MA04-001", recentNow);
  assert(clean.status === "fluent" && heard.score === clean.score && heard.status === clean.status, "no_hearing 不能降档");

  const spoken = scoreKnowledgePoint(
    Array.from({ length: 8 }, (_, index) =>
      event({
        clientEventId: `speak-${index}:question_answered:q3:MA04-001`,
        createdAt: "2026-01-15T08:00:00.000Z",
        type: "question_answered",
        source: "device",
        stepType: "speak",
        knowledgePointId: "MA04-001",
      }),
    ),
    [],
    "MA04-001",
    recentNow,
  );
  assert(spoken.status === "insufficient" && spoken.score === null && spoken.speak?.total === 8, "跟读不能单独到熟练，也不计入样本");

  const doubled = scoreKnowledgePoint(
    ["s1", "s2", "s3"].flatMap((step, index) => [
      event({
        clientEventId: `try:server:${step}:MA06-001`,
        createdAt: `2026-01-15T08:00:0${index}.000Z`,
        stepId: step,
        knowledgePointId: "MA06-001",
        correct: true,
      }),
      event({
        clientEventId: `try:question_failed:${step}:miss:MA06-001`,
        createdAt: `2026-01-15T08:00:0${index}.000Z`,
        type: "question_failed",
        source: "device",
        stepType: "tap",
        correct: false,
        stepId: step,
        knowledgePointId: "MA06-001",
      }),
    ]),
    [],
    "MA06-001",
    recentNow,
  );
  assert(doubled.objectiveCount === 3 && doubled.status === "fluent", "同一作答的设备行不能和服务端行重复计分");

  const edge = new Date("2026-01-05T16:30:00.000Z");
  assert(utcDayKey(edge) === "2026-01-05", "UTC 日不跟着时区跨天");
  assert(localDayKey(edge) === "2026-01-05", "配额日也用补零的 UTC 日");
  const shanghai = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit" }).format(edge);
  assert(shanghai === "2026-01-06" && shanghai !== utcDayKey(edge), "展示时区可以是下一天，库存不能跟着变");
  assert(isInUtcWeek("2026-01-04T23:30:00.000Z", new Date("2026-01-05T12:00:00.000Z")) === false, "UTC 周一之前仍算上一周");
  assert(isInUtcWeek("2026-01-05T00:30:00.000Z", new Date("2026-01-05T12:00:00.000Z")) === true, "UTC 周一凌晨算本周");
  assert(displayUtcDay("2026-01-05", "Asia/Shanghai") === "2026-01-05", "存好的 UTC 日用正午换算，不再被时区推走");

  const legacy = playsFromStorage(
    JSON.stringify({ date: "2026-1-5", used: { "game-color-match": 2 }, bonus: { "game-color-match": 1 } }),
    new Date("2026-01-05T03:00:00.000Z"),
  );
  assert(legacy.quota.used["game-color-match"] === 2 && legacy.quota.bonus["game-color-match"] === 1, "不补零的旧次数不能被清零");
  assert(legacy.quota.date === "2026-01-05" && legacy.rewritten?.includes("2026-01-05"), "读到旧日期后要写回补零形式");
  const nextDay = playsFromStorage(
    JSON.stringify({ date: "2026-1-5", used: { "game-color-match": 2 }, bonus: {} }),
    new Date("2026-01-06T00:00:00.000Z"),
  );
  assert(!nextDay.quota.used["game-color-match"], "不是同一天才重新计数");
  const merged = mergeQuotaRows([
    { childId: "c", gameId: "game-color-match", day: "2026-1-5", used: 2, bonus: 0 },
    { childId: "c", gameId: "game-color-match", day: "2026-01-05", used: 1, bonus: 1 },
  ]);
  assert(merged.length === 1 && merged[0]?.day === "2026-01-05" && merged[0]?.used === 3 && merged[0]?.bonus === 1, "服务端配额要把两种写法合成一天");

  resetMemoryForTests();
  db();
  const summaryUrl = new URL("http://local.test/api/progress/summary?childId=child-demo");
  const emptyReport = await call(() => progressSummary(request(), summaryUrl));
  const emptyText = JSON.stringify(emptyReport.body);
  assert(emptyReport.status === 200 && emptyText.includes("数据不足"), "没有数据时报告要写数据不足");
  assert(!emptyText.includes("未掌握"), "新孩子的报告不能写未掌握");
  const emptyMastery = emptyReport.body.mastery as { ready?: boolean; emptyCopy?: string } | undefined;
  const emptySuggestions = emptyReport.body.suggestions as unknown[] | undefined;
  assert(emptyMastery?.ready === false && emptyMastery.emptyCopy === "数据不足", "掌握块在样本不够时是数据不足");
  assert(Array.isArray(emptySuggestions) && emptySuggestions.length === 0, "没有掌握数据时不生成建议");

  const weekRows: ProgressRecord[] = [
    {
      id: "week-old",
      childId: "child-demo",
      levelId: "lang-starter-09",
      status: "completed",
      stars: 1,
      score: 80,
      durationSec: 120,
      clientEventId: "week-old",
      completedAt: "2026-01-04T23:30:00.000Z",
    },
    {
      id: "week-new",
      childId: "child-demo",
      levelId: "lang-starter-10",
      status: "completed",
      stars: 1,
      score: 80,
      durationSec: 120,
      clientEventId: "week-new",
      completedAt: "2026-01-05T00:30:00.000Z",
    },
  ];
  db().progress.push(...weekRows);
  const weekReport = await call(() => progressSummary(request(), summaryUrl, new Date("2026-01-05T12:00:00.000Z")));
  assert(weekReport.body.completedLevels === 1, `UTC 周界不能把周日晚上算进新的一周，实际 ${String(weekReport.body.completedLevels)}`);
  db().progress = db().progress.filter((item) => item.id !== "week-old" && item.id !== "week-new");

  db().gameQuotas["child-demo:game-color-match:2026-1-5"] = {
    childId: "child-demo",
    gameId: "game-color-match",
    day: "2026-1-5",
    used: 2,
    bonus: 0,
  };
  const quota = await call(() => listQuota(request(), new URL("http://local.test/api/games/quota?childId=child-demo&day=2026-01-05")));
  const quotaRows = (quota.body.quotas as Array<{ gameId?: string; used?: number }> | undefined) ?? [];
  assert(quota.status === 200 && quotaRows.some((item) => item.gameId === "game-color-match" && item.used === 2), "查询补零日期要读到旧的不补零次数");
  assert(db().gameQuotas["child-demo:game-color-match:2026-01-05"]?.used === 2, "读过之后内存里改成补零日期");
  const padded = await call(() => changeQuota(request(), "game-color-match", { childId: "child-demo", day: "2026-1-5" }, "used"));
  assert(padded.body.day === "2026-01-05", "服务端收到不补零日期后要存成补零");

  db().reviewPlans.push({
    id: "rev-life",
    childId: "child-demo",
    knowledgePointId: "MA09-001",
    dueOn: utcDayKey(),
    status: "pending",
    updatedAt: new Date().toISOString(),
  });
  db().knowledgeMastery.push({
    id: "mst-weak",
    childId: "child-demo",
    knowledgePointId: "MA02-002",
    score: 45,
    status: "learning",
    updatedAt: new Date().toISOString(),
  });
  const todayUrl = new URL("http://local.test/api/today?childId=child-demo");
  const today = await call(() => getToday(request(), todayUrl));
  const todayTasks = (today.body.tasks as Array<{ id: string; kind?: string; slot?: string; label?: string; packId?: string | null; knowledgePointId?: string | null }> | undefined) ?? [];
  assert(today.status === 200 && todayTasks.length > 0 && todayTasks.length <= 4, `今日默认不超过 4 条，实际 ${todayTasks.length}`);
  const ranks = { review: 0, weak: 1, new: 2, game: 3 };
  for (let index = 1; index < todayTasks.length; index += 1) {
    const previous = ranks[todayTasks[index - 1]?.slot as keyof typeof ranks] ?? 9;
    const current = ranks[todayTasks[index]?.slot as keyof typeof ranks] ?? 9;
    assert(current >= previous, `今日顺序应是复习、薄弱、新课，实际 ${todayTasks.map((item) => item.slot).join(",")}`);
  }
  assert(todayTasks[0]?.slot === "review" && todayTasks[0]?.label === "复习" && todayTasks[0]?.packId === "math-life", "到期复习要排在最前，并标成复习");
  assert(todayTasks.some((item) => item.slot === "weak" && item.id === "math-starter-02"), "薄弱点要出现在新课前面");
  assert(todayTasks.filter((item) => item.slot === "new").every((item) => item.packId !== "math-life" && item.label === "新课"), "年龄段 A 的新课不能排进生活数学");
  const todayText = JSON.stringify(today.body);
  assert(!todayText.includes("未掌握") && !todayText.includes("还要再练"), "孩子今日页不能使用家长报告里的未掌握或还要再练");

  const wide = buildTodayTasks({ state: db(), childId: "child-demo", age: "A", day: utcDayKey(), maxTasks: 8 });
  assert(wide.at(-1)?.slot === "game", "还有空位时兴趣游戏放在最后");
  assert(wide.filter((item) => item.slot === "new").every((item) => db().levels.find((level) => level.id === item.id)?.packId !== "math-life"), "放宽条数后新课仍排除生活数学");

  db().reviewPlans.push({
    id: "rev-extra",
    childId: "child-demo",
    knowledgePointId: "MA04-001",
    dueOn: utcDayKey(),
    status: "pending",
    updatedAt: new Date().toISOString(),
  });
  const stable = await call(() => getToday(request(), todayUrl));
  const stableTasks = (stable.body.tasks as Array<{ id: string; knowledgePointId?: string | null }> | undefined) ?? [];
  assert(
    stableTasks.map((item) => `${item.id}:${item.knowledgePointId ?? ""}`).join("|") ===
      todayTasks.map((item) => `${item.id}:${item.knowledgePointId ?? ""}`).join("|"),
    "今天已经生成的计划不能因为新的复习被重排",
  );

  const learned = await call(() =>
    completeLevel(request(), "math-starter-01", {
      childId: "child-demo",
      stars: 3,
      score: 100,
      duration: 30,
      clientEventId: "sprint3-pass-1",
      steps: correctSteps(),
    }),
  );
  assert(learned.status === 200, `客观题完成失败 ${learned.status}`);
  const learnedAgain = await call(() =>
    completeLevel(request(), "math-starter-01", {
      childId: "child-demo",
      stars: 3,
      score: 100,
      duration: 20,
      clientEventId: "sprint3-pass-2",
      steps: correctSteps(),
    }),
  );
  assert(learnedAgain.status === 200, "第二次完成也应成功");
  const counted = db().knowledgeMastery.find((item) => item.knowledgePointId === "MA02-001");
  assert(counted && counted.status !== "insufficient" && counted.score !== null && counted.score !== 0, `足够的服务端客观题不能停在待评估，实际 ${counted?.status} ${counted?.score}`);
  const countedReport = await call(() => progressSummary(request(), summaryUrl));
  const countedPoint = ((countedReport.body.mastery as { points?: Array<{ knowledgePointId: string; assessment: string; label: string }> }).points ?? []).find(
    (item) => item.knowledgePointId === "MA02-001",
  );
  assert(countedPoint && countedPoint.assessment !== "待评估" && countedPoint.label !== "未掌握" && countedPoint.label !== "数据不足", "报告档位不能再写待评估或未掌握");
  const suggestions = countedReport.body.suggestions as string[] | undefined;
  assert(suggestions && suggestions.length > 0 && suggestions.every((line) => !line.includes("未掌握")), "有掌握数据时才给建议，而且不用未掌握");
  assert(db().reviewPlans.some((plan) => plan.childId === "child-demo" && plan.knowledgePointId === "MA02-001" && plan.status === "pending"), "熟练或需要复习的点要生成复习");

  const tomorrow = new Date(`${shiftUtcDay(utcDayKey(), 1)}T12:00:00.000Z`);
  const nextToday = await call(() => getToday(request(), todayUrl, tomorrow));
  const nextTasks = (nextToday.body.tasks as Array<{ kind?: string; label?: string; slot?: string }> | undefined) ?? [];
  assert(nextTasks.some((item) => item.kind === "review" && item.label === "复习"), "第二天的今日页要看得到复习");
  assert(!JSON.stringify(nextToday.body).includes("未掌握"), "孩子页第二天也不写未掌握");
  const parentText = JSON.stringify(countedReport.body);
  assert(parentText.includes("学习习惯") === false, "习惯是页面标题，接口用 habit 字段");
  assert(parentText !== JSON.stringify(nextToday.body), "家长报告和孩子今日不是同一份文案");

  db().knowledgeMastery.push({
    id: "mst-not-yet",
    childId: "child-demo",
    knowledgePointId: "MA08-001",
    score: 20,
    status: "not_yet",
    updatedAt: new Date().toISOString(),
  });
  const parent = await call(() => progressSummary(request(), summaryUrl));
  const notYet = ((parent.body.mastery as { points?: Array<{ knowledgePointId: string; label: string }> }).points ?? []).find((item) => item.knowledgePointId === "MA08-001");
  assert(notYet?.label === "还要再练", "样本够了但还低时，家长看到的是还要再练");
  assert(!JSON.stringify(parent.body).includes("未掌握"), "整份报告都不要未掌握");

  for (let index = 0; index < 3; index += 1) {
    await appendLearningEvent({
      childId: "child-demo",
      sessionId: "miss",
      type: "question_answered",
      knowledgePointId: "MA04-001",
      levelId: "math-starter-01",
      gameId: null,
      stepId: "q1",
      correct: true,
      durationMs: 0,
      errorCause: null,
      source: "server",
      clientEventId: `live-ok-${index}:server:q1:MA04-001`,
    });
  }
  const fluent = db().knowledgeMastery.find((item) => item.knowledgePointId === "MA04-001");
  assert(fluent?.status === "fluent", `三次答对应离开待评估，实际 ${fluent?.status}`);
  const reviewsBefore = db().reviewPlans.filter((plan) => plan.knowledgePointId === "MA04-001").length;
  await appendLearningEvent({
    childId: "child-demo",
    sessionId: "miss",
    type: "question_failed",
    knowledgePointId: "MA04-001",
    levelId: "math-starter-01",
    gameId: null,
    stepId: "q1",
    correct: false,
    durationMs: 0,
    errorCause: "unknown_error",
    source: "server",
    clientEventId: "live-miss:server:q1:MA04-001",
  });
  const afterMiss = db().knowledgeMastery.find((item) => item.knowledgePointId === "MA04-001");
  assert(afterMiss?.status === "basic" || afterMiss?.status === "fluent", `单次答错不能连掉两档，实际 ${afterMiss?.status}`);
  await appendLearningEvent({
    childId: "child-demo",
    sessionId: "miss",
    type: "no_hearing",
    knowledgePointId: "MA04-001",
    levelId: "math-starter-06",
    gameId: null,
    stepId: "q3",
    correct: null,
    durationMs: 0,
    errorCause: null,
    source: "device",
    clientEventId: "live-hear",
  });
  const afterHear = db().knowledgeMastery.find((item) => item.knowledgePointId === "MA04-001");
  assert(afterHear?.status === afterMiss?.status && afterHear?.score === afterMiss?.score, "no_hearing 不能改变档位");
  assert(db().reviewPlans.filter((plan) => plan.knowledgePointId === "MA04-001").length === reviewsBefore, "no_hearing 不能新增复习");
  const reviewCount = db().reviewPlans.filter((plan) => plan.knowledgePointId === "MA04-001" && plan.status === "pending").length;
  await appendLearningEvent({
    childId: "child-demo",
    sessionId: "miss",
    type: "question_failed",
    knowledgePointId: "MA04-001",
    levelId: "math-starter-01",
    gameId: null,
    stepId: "q1",
    correct: false,
    durationMs: 0,
    errorCause: "unknown_error",
    source: "server",
    clientEventId: "live-miss-2:server:q1:MA04-001",
  });
  assert(db().reviewPlans.filter((plan) => plan.knowledgePointId === "MA04-001" && plan.status === "pending").length === reviewCount, "同一知识点已有待复习时不能同日再插一条");

  for (let index = 0; index < 5; index += 1) {
    await appendLearningEvent({
      childId: "child-demo",
      sessionId: "speak",
      type: "question_answered",
      knowledgePointId: "MA05-002",
      levelId: "math-starter-06",
      gameId: null,
      stepId: "q3",
      correct: true,
      durationMs: 0,
      errorCause: null,
      source: "device",
      clientEventId: `speak-only-${index}:question_answered:q3:MA05-002`,
    });
  }
  const speakRow = db().knowledgeMastery.find((item) => item.knowledgePointId === "MA05-002");
  assert(!speakRow || (speakRow.status === "insufficient" && speakRow.score === null), "只有跟读时不能写成熟练");

  const blocked = await call(() =>
    postEvents(request(), {
      clientEventId: "client-review",
      childId: "child-demo",
      sessionId: "s",
      type: "review_completed",
      knowledgePointId: "MA09-001",
      levelId: "math-life-01",
      durationMs: 0,
      source: "device",
      correct: true,
    }),
  );
  assert(blocked.status === 400, "客户端不能直接上报 review_completed");
  assert(!db().learningEvents.some((item) => item.clientEventId === "client-review"), "被拒绝的复习完成不能入库");

  const dueBefore = db().reviewPlans.find((plan) => plan.knowledgePointId === "MA09-001");
  assert(dueBefore?.status === "pending", "生活数学复习还没完成");
  const passedReview = await call(() =>
    completeLevel(request(), "math-life-01", {
      childId: "child-demo",
      stars: 3,
      score: 100,
      duration: 15,
      clientEventId: "sprint3-review-pass",
    }),
  );
  assert(passedReview.status === 200, "完成复习关卡应成功");
  assert(db().reviewPlans.find((plan) => plan.id === "rev-life")?.status === "completed", "通过复习后要勾掉当天的计划");
  assert(
    db().learningEvents.some((item) => item.type === "review_completed" && item.source === "server" && item.knowledgePointId === "MA09-001"),
    "复习完成只能由服务端写下 review_completed",
  );
  assert(db().reviewPlans.some((plan) => plan.knowledgePointId === "MA09-001" && plan.status === "pending" && plan.dueOn !== dueBefore?.dueOn), "完成后要排下一次间隔");

  const plansBefore = db().reviewPlans.length;
  const scoresBefore = db().knowledgeMastery.map((item) => `${item.knowledgePointId}:${item.status}:${item.score}`).sort();
  await reconcileLearningState();
  await reconcileLearningState();
  assert(db().reviewPlans.length === plansBefore, "重算两次不能多出复习");
  assert(db().knowledgeMastery.map((item) => `${item.knowledgePointId}:${item.status}:${item.score}`).sort().join("|") === scoresBefore.join("|"), "重算两次掌握度应保持不变");

  db().children.push({
    id: "child-foreign",
    userId: "user-other",
    nickname: "别人",
    ageBand: "A",
    avatar: null,
    isCurrent: false,
  });
  const missing = await call(() => listMastery(request(), new URL("http://local.test/api/mastery?childId=missing-child")));
  const foreign = await call(() => listReviews(request(), new URL("http://local.test/api/reviews?childId=child-foreign&day=2026-01-05")));
  const blank = await call(() => listMastery(request(), new URL("http://local.test/api/mastery?childId=%20")));
  assert(missing.status === 404 && foreign.status === 404 && blank.status === 404, "新的掌握和复习接口找不到孩子时要 404");
  assert(!JSON.stringify(missing.body).includes("child-demo") && !JSON.stringify(foreign.body).includes("MA09-001"), "404 不能退回当前孩子的数据");

  const todaySource = readFileSync(new URL("../components/screens/today-screen.tsx", import.meta.url), "utf8");
  const reportSource = readFileSync(new URL("../components/screens/account-screens.tsx", import.meta.url), "utf8");
  assert(todaySource.includes("复习") && todaySource.includes("新课"), "今日页要标出复习和新课");
  assert(!todaySource.includes("未掌握") && !todaySource.includes("还要再练"), "今日页不要用家长的掌握用词");
  assert(reportSource.includes("学习习惯") && reportSource.includes("知识掌握") && reportSource.includes("成长趋势") && reportSource.includes("学习建议"), "报告要有四块");
  assert(reportSource.includes("数据不足") && !reportSource.includes("未掌握"), "报告空状态是数据不足，不是未掌握");

  console.log("Sprint 3 检查通过");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.stack ?? error.message : error);
  process.exit(1);
});
