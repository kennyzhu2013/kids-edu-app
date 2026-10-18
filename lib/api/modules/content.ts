import { HttpError, jsonOk, pageOf } from "@/lib/api/http";
import { db, hasVip } from "@/lib/api/memory";

function visible<T extends { deletedAt?: string | null; status?: string }>(items: T[]) {
  return items.filter((item) => !item.deletedAt && item.status !== "archived");
}

export function listSubjects() {
  return jsonOk({ subjects: db().subjects });
}

export function listPacks(url: URL) {
  const subjectId = url.searchParams.get("subjectId");
  const access = url.searchParams.get("access");
  let packs = visible(db().packs.map((pack) => ({ ...pack, deletedAt: null, status: "published" })));
  if (subjectId) packs = packs.filter((pack) => pack.subjectId === subjectId);
  if (access) packs = packs.filter((pack) => pack.access === access);
  const page = pageOf(packs, url);
  return jsonOk({
    packs: page.items.map((pack) => ({
      ...pack,
      coverUrl: null,
    })),
    page: page.page,
    pageSize: page.pageSize,
    total: page.total,
  });
}

export function getPack(id: string, url: URL) {
  const pack = db().packs.find((item) => item.id === id);
  if (!pack) throw new HttpError(404, "NOT_FOUND", "找不到这个课包");
  const childId = url.searchParams.get("childId");
  const done = new Set(
    db()
      .progress.filter((item) => item.childId === childId && item.status === "completed")
      .map((item) => item.levelId),
  );
  const levels = db()
    .levels.filter((level) => level.packId === id)
    .sort((a, b) => a.order - b.order)
    .map((level) => ({
      id: level.id,
      order: level.order,
      title: level.title,
      minutes: level.minutes,
      playable: level.playable,
      locked: !level.playable && !hasVip(db()),
      status: done.has(level.id) ? "done" : "todo",
      rewardCopy: level.rewardCopy,
    }));
  return jsonOk({
    pack: { ...pack, coverUrl: null },
    levels,
    unlockRule: "四科启蒙课包都可以直接玩。未购买的课包以后仍会锁着，广告和会员还是桩。",
  });
}

export function getLevel(id: string) {
  const outline = db().levels.find((level) => level.id === id);
  if (!outline) throw new HttpError(404, "NOT_FOUND", "找不到这一关");
  const full = db().playableLevels[id];
  if (!outline.playable || !full) {
    throw new HttpError(403, "LOCKED", "未解锁", {
      lockReason: hasVip(db()) ? "CONTENT_UNPUBLISHED" : "AD_OR_VIP",
      level: {
        id: outline.id,
        title: outline.title,
        packId: outline.packId,
        playable: false,
      },
    });
  }
  return jsonOk({
    level: full,
    assetResolution: "stub",
    todo: "CDN_AUDIO",
  });
}

export function listGames(url: URL) {
  const page = pageOf(db().games, url);
  return jsonOk({
    games: page.items,
    page: page.page,
    pageSize: page.pageSize,
    total: page.total,
  });
}

export function getGame(id: string) {
  const outline = db().games.find((game) => game.gameId === id);
  if (!outline) throw new HttpError(404, "NOT_FOUND", "找不到这个游戏");
  const config = db().gameConfigs[id];
  if (!outline.playable || !config) {
    throw new HttpError(403, "LOCKED", "这款游戏还在制作", {
      lockReason: "CONTENT_UNPUBLISHED",
      game: outline,
    });
  }
  return jsonOk({
    game: config,
    assetResolution: "stub",
  });
}
