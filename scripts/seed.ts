import { loadCatalog, loadColorMatch, loadPlayableLevel } from "../lib/content/load";

async function main() {
  const catalog = loadCatalog();
  const level = loadPlayableLevel();
  const game = loadColorMatch();

  const levelIds = new Set(catalog.levels.map((item) => item.id));
  if (!levelIds.has(level.id)) {
    throw new Error("目录里没有 eng-starter-01");
  }
  if (!catalog.games.some((item) => item.gameId === game.gameId && item.playable)) {
    throw new Error("目录里没有可玩的颜色配对");
  }
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

  console.log("夹具校验通过");
  console.log(`学科 ${catalog.subjects.length} · 课包 ${catalog.packs.length} · 关卡大纲 ${catalog.levels.length} · 游戏 ${catalog.games.length}`);
  console.log(`可玩关卡 ${level.id}（${level.steps.length} 题）· 可玩游戏 ${game.gameId}`);

  if (process.env.SEED_DATABASE !== "1") {
    console.log("未设置 SEED_DATABASE=1，跳过写入 PostgreSQL。");
    return;
  }

  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();
  try {
    await prisma.$connect();
    await prisma.subject.createMany({
      data: catalog.subjects.map((subject) => ({
        id: subject.id,
        name: subject.name,
        tab: subject.tab,
      })),
      skipDuplicates: true,
    });
    for (const pack of catalog.packs) {
      await prisma.pack.upsert({
        where: { id: pack.id },
        update: {
          title: pack.title,
          summary: pack.summary,
          levelCount: pack.levelCount,
          ageRange: pack.ageRange,
          access: pack.access,
          accent: pack.accent,
        },
        create: {
          id: pack.id,
          subjectId: pack.subjectId,
          title: pack.title,
          summary: pack.summary,
          levelCount: pack.levelCount,
          ageRange: pack.ageRange,
          access: pack.access,
          accent: pack.accent,
        },
      });
    }
    for (const item of catalog.levels) {
      const config = item.id === level.id ? level : { outline: true, goal: item.goal, vocab: item.vocab };
      await prisma.level.upsert({
        where: { id: item.id },
        update: {
          title: item.title,
          goal: item.goal,
          playable: item.playable,
          rewardCopy: item.rewardCopy,
          config,
        },
        create: {
          id: item.id,
          packId: item.packId,
          order: item.order,
          title: item.title,
          goal: item.goal,
          ageBand: ["A", "B", "C"],
          vocab: item.vocab,
          types: item.types,
          minutes: item.minutes,
          playable: item.playable,
          rewardCopy: item.rewardCopy,
          schemaVersion: 1,
          config,
          status: item.playable ? "published" : "draft",
        },
      });
    }
    for (const item of catalog.games) {
      const config = item.gameId === game.gameId ? game : { outline: true, howTo: item.howTo };
      await prisma.game.upsert({
        where: { id: item.gameId },
        update: {
          title: item.title,
          playable: item.playable,
          config,
        },
        create: {
          id: item.gameId,
          title: item.title,
          titleEn: item.titleEn,
          knowledgeTags: item.knowledgeTags,
          dailyFree: item.dailyFree,
          durationSec: item.durationSec,
          rounds: item.rounds,
          winCondition: item.winCondition,
          howTo: item.howTo,
          playable: item.playable,
          schemaVersion: 1,
          config,
          status: item.playable ? "published" : "draft",
        },
      });
    }
    const user = await prisma.user.upsert({
      where: { id: "user-demo" },
      update: {},
      create: { id: "user-demo", nickname: "家长" },
    });
    await prisma.parentLock.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id, pinHash: "stub-not-a-real-hash" },
    });
    console.log("已写入 PostgreSQL（家长锁只存占位哈希）。");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
