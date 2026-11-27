import type { PrismaClient } from "@prisma/client";
import { hashPin, isPinHash } from "@/lib/api/pin-hash";
import { configuredParentPin, isProduction } from "@/lib/api/secrets";
import { loadCurriculum } from "@/lib/content/curriculum";
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
  await syncCurriculum(prisma);
}

export async function syncCurriculum(prisma: PrismaClient) {
  const curriculum = loadCurriculum();
  const levels = loadPlayableLevels();
  for (const subject of curriculum.subjects) {
    await prisma.curriculumSubject.upsert({
      where: { id: subject.id },
      update: { name: subject.name, sort: subject.sort, status: subject.status },
      create: subject,
    });
  }
  for (const course of curriculum.courses) {
    await prisma.curriculumCourse.upsert({
      where: { id: course.id },
      update: {
        subjectId: course.subjectId,
        title: course.title,
        sort: course.sort,
        status: course.status,
      },
      create: course,
    });
  }
  for (const point of curriculum.points) {
    await prisma.knowledgePoint.upsert({
      where: { id: point.id },
      update: {
        code: point.code,
        courseId: point.courseId,
        title: point.title,
        difficulty: point.difficulty,
        status: point.status,
        sort: point.sort,
        version: point.version,
        ageTargets: point.ageTargets,
      },
      create: {
        ...point,
        ageTargets: point.ageTargets,
      },
    });
  }
  for (const link of curriculum.dependencies) {
    await prisma.knowledgeDependency.upsert({
      where: { fromId_toId_relation: { fromId: link.fromId, toId: link.toId, relation: link.relation } },
      update: {},
      create: link,
    });
  }
  const rows = levels.flatMap((level) => {
    const levelRows = level.knowledgePointIds.map((knowledgePointId) => ({
      levelId: level.id,
      knowledgePointId,
      stepId: "",
    }));
    const stepRows = level.steps.flatMap((step) =>
      step.knowledgePointIds.map((knowledgePointId) => ({
        levelId: level.id,
        knowledgePointId,
        stepId: step.id,
      })),
    );
    return [...levelRows, ...stepRows];
  });
  await prisma.levelKnowledgePoint.deleteMany({});
  if (rows.length > 0) {
    await prisma.levelKnowledgePoint.createMany({ data: rows });
  }
}

export async function ensureDemoFamily(prisma: PrismaClient) {
  await prisma.user.upsert({
    where: { id: "user-demo" },
    update: {},
    create: { id: "user-demo", nickname: "家长" },
  });
  const existingLock = await prisma.parentLock.findUnique({ where: { userId: "user-demo" } });
  const pin = configuredParentPin();
  if (!existingLock) {
    await prisma.parentLock.create({
      data: {
        userId: "user-demo",
        pinHash: isProduction() && pin ? hashPin(pin) : "stub-not-a-real-hash",
      },
    });
  } else if (isProduction() && pin && !isPinHash(existingLock.pinHash)) {
    // 只替换占位哈希。已经是 scrypt 的记录保持不动。
    await prisma.parentLock.update({
      where: { userId: "user-demo" },
      data: { pinHash: hashPin(pin) },
    });
  }
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
