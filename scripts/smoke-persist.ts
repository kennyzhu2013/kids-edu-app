import { completeLevel, getToday, progressSummary } from "../lib/api/modules/progress";
import { changeQuota, listQuota } from "../lib/api/modules/quota";
import { resetMemoryForTests } from "../lib/api/memory";
import { ensureReady, resetPersistenceForTests } from "../lib/api/persist";

function request() {
  return new Request("http://127.0.0.1/api/today", {
    headers: { authorization: "Bearer stub-parent-token" },
  });
}

async function restart() {
  resetMemoryForTests();
  resetPersistenceForTests();
  await ensureReady();
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("需要 DATABASE_URL");
  await restart();
  const todayUrl = new URL("http://127.0.0.1/api/today?childId=child-demo");
  await getToday(request(), todayUrl);
  const eventId = `smoke-${Date.now()}`;
  await completeLevel(request(), "lang-starter-01", {
    childId: "child-demo",
    stars: 2,
    score: 80,
    duration: 15,
    clientEventId: eventId,
  });
  await changeQuota(request(), "game-color-match", { childId: "child-demo", day: "2026-11-14" }, "used");

  await restart();
  const summaryResponse = await progressSummary(request(), new URL("http://127.0.0.1/api/progress/summary?childId=child-demo"));
  const summary = (await summaryResponse.json()) as { completedLevels: number; minutes: number };
  if (summary.completedLevels < 1) throw new Error(`完成后关卡数不对：${summary.completedLevels}`);
  if (summary.minutes < 1) throw new Error(`分钟数不对：${summary.minutes}`);
  const todayResponse = await getToday(request(), todayUrl);
  const today = (await todayResponse.json()) as { tasks: Array<{ id: string; status: string }> };
  const task = today.tasks.find((item) => item.id === "lang-starter-01");
  if (!task || task.status !== "done") throw new Error("今日任务勾选没有留下来");
  const quotaResponse = listQuota(request(), new URL("http://127.0.0.1/api/games/quota?childId=child-demo&day=2026-11-14"));
  const quota = (await quotaResponse.json()) as { quotas: Array<{ gameId: string; used: number }> };
  const color = quota.quotas.find((item) => item.gameId === "game-color-match");
  if (!color || color.used < 1) throw new Error("游戏次数没有留下来");
  console.log("进度在重启后仍在");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
