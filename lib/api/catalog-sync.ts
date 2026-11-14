import type { PrismaClient } from "@prisma/client";
import { loadCatalog, loadGameConfigs, loadPlayableLevels } from "@/lib/content/load";

export async function syncCatalog(prisma: PrismaClient) {
  const catalog = loadCatalog();
  const levels = loadPlayableLevels();
  const gamesById = new Map(loadGameConfigs().map((game) => [game.gameId, game]));
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
    const full = levels.find((level) => level.id === item.id);
    const config = full ?? { outline: true, goal: item.goal, vocab: item.vocab };
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
    const config = gamesById.get(item.gameId) ?? { outline: true, howTo: item.howTo };
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
}

export async function ensureDemoFamily(prisma: PrismaClient) {
  await prisma.user.upsert({
    where: { id: "user-demo" },
    update: {},
    create: { id: "user-demo", nickname: "家长" },
  });
  await prisma.parentLock.upsert({
    where: { userId: "user-demo" },
    update: {},
    create: { userId: "user-demo", pinHash: "stub-not-a-real-hash" },
  });
  const count = await prisma.child.count({ where: { userId: "user-demo" } });
  if (count === 0) {
    await prisma.child.create({
      data: {
        id: "child-demo",
        userId: "user-demo",
        nickname: "小芽",
        ageBand: "A",
        avatar: "sprout",
        isCurrent: true,
      },
    });
  }
}
