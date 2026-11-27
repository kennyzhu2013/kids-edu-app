import { loadCatalog, loadColorMatch, loadGameConfigs, loadPlayableLevels } from "../lib/content/load";
import { assertSprint1Content } from "../lib/content/sprint1-checks";

async function main() {
  const catalog = loadCatalog();
  const levels = loadPlayableLevels();
  const level = levels[0];
  const game = loadColorMatch();

  const fixtures = new Map(levels.map((item) => [item.id, item]));
  const playableOutlines = catalog.levels.filter((item) => item.playable);
  if (playableOutlines.length < 20) {
    throw new Error("四科启蒙至少要有 20 关可玩大纲");
  }
  for (const outline of playableOutlines) {
    const item = fixtures.get(outline.id);
    if (!item) throw new Error(`${outline.id} 标了可玩，但没有夹具`);
    if (item.steps.filter((step) => step.type !== "speak").length < 2) {
      throw new Error(`${item.id} 至少要有两道可点的题`);
    }
  }
  for (const item of levels) {
    if (!catalog.levels.some((row) => row.id === item.id)) throw new Error(`目录里没有 ${item.id}`);
  }
  const gameConfigs = loadGameConfigs();
  const gamesById = new Map(gameConfigs.map((item) => [item.gameId, item]));
  const playableGames = catalog.games.filter((item) => item.playable);
  if (playableGames.length < 5) throw new Error("游戏乐园需要 5 个可玩游戏");
  for (const outline of playableGames) {
    const config = gamesById.get(outline.gameId);
    if (!config) throw new Error(`${outline.gameId} 标了可玩，但没有夹具`);
    if (config.dailyFree !== outline.dailyFree || config.dailyFree < 1) {
      throw new Error(`${outline.gameId} 的每日免费次数不一致`);
    }
  }
  if (!gamesById.has(game.gameId)) throw new Error("目录里没有可玩的颜色配对");
  const tapSteps = level.steps.filter((step) => step.type === "tap");
  if (tapSteps.length < 2 || !level.introScript.includes("Hello")) {
    throw new Error("英语第 1 关需要听讲稿和至少两道点选题");
  }
  const packCounts = new Map<string, number>();
  for (const item of catalog.levels) {
    packCounts.set(item.packId, (packCounts.get(item.packId) ?? 0) + 1);
  }
  for (const pack of catalog.packs) {
    if (packCounts.get(pack.id) !== pack.levelCount) {
      throw new Error(`${pack.id} 的关卡数和目录不一致`);
    }
  }

  assertSprint1Content();
  console.log("夹具校验通过");
  console.log(`学科 ${catalog.subjects.length} · 课包 ${catalog.packs.length} · 关卡大纲 ${catalog.levels.length} · 游戏 ${catalog.games.length}`);
  console.log(`可玩关卡 ${levels.map((item) => item.id).join(", ")}`);
  console.log(`可玩游戏 ${gameConfigs.map((item) => item.gameId).join(", ")}`);

  if (process.env.SEED_DATABASE !== "1") {
    console.log("未设置 SEED_DATABASE=1，跳过写入 PostgreSQL。");
    return;
  }

  const { PrismaClient } = await import("@prisma/client");
  const { ensureDemoFamily, syncCatalog } = await import("../lib/api/catalog-sync");
  const prisma = new PrismaClient();
  try {
    await prisma.$connect();
    await syncCatalog(prisma);
    await ensureDemoFamily(prisma);
    console.log("已写入 PostgreSQL（课程目录、占位或哈希家长锁，以及小芽档案）。");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
