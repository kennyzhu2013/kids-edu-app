import { HttpError, jsonOk, asString, pageOf } from "@/lib/api/http";
import { db, uid } from "@/lib/api/memory";
import { requireAdmin } from "@/lib/api/modules/auth";

type Kind = "packs" | "levels" | "games" | "assets";

function collection(kind: Kind) {
  const state = db();
  if (kind === "packs") return state.packs as unknown as Array<Record<string, unknown>>;
  if (kind === "levels") return state.levels as unknown as Array<Record<string, unknown>>;
  if (kind === "games") return state.games as unknown as Array<Record<string, unknown>>;
  return state.assets as unknown as Array<Record<string, unknown>>;
}

function idOf(kind: Kind, item: Record<string, unknown>) {
  if (kind === "games") return String(item.gameId ?? "");
  return String(item.id ?? "");
}

export function adminList(request: Request, kind: Kind, url: URL) {
  requireAdmin(request);
  let items = collection(kind).filter((item) => !item.deletedAt);
  const packId = url.searchParams.get("packId");
  const status = url.searchParams.get("status");
  const type = url.searchParams.get("type");
  if (packId) items = items.filter((item) => item.packId === packId);
  if (status) items = items.filter((item) => item.status === status || item.access === status);
  if (type) items = items.filter((item) => item.kind === type || item.types === type);
  const page = pageOf(items, url);
  const key = kind;
  return jsonOk({ [key]: page.items, page: page.page, pageSize: page.pageSize, total: page.total });
}

export function adminCreate(request: Request, kind: Kind, body: Record<string, unknown>) {
  requireAdmin(request);
  const items = collection(kind);
  const id = asString(body.id) || asString(body.gameId) || uid(kind.slice(0, 3));
  if (items.some((item) => idOf(kind, item) === id && !item.deletedAt)) {
    throw new HttpError(409, "CONFLICT", "编码已存在");
  }
  const record: Record<string, unknown> = {
    ...body,
    status: asString(body.status) || "draft",
    deletedAt: null,
  };
  if (kind === "games") record.gameId = id;
  else record.id = id;
  if (kind === "assets") {
    record.kind = asString(body.kind) || "image";
    record.cdnUrl = asString(body.cdnUrl) || null;
    record.tags = Array.isArray(body.tags) ? body.tags : [];
  }
  items.push(record);
  const key = kind.endsWith("s") ? kind.slice(0, -1) : kind;
  return jsonOk({ [key]: record, todo: "CMS_PERSIST" }, 201);
}

export function adminUpdate(request: Request, kind: Kind, id: string, body: Record<string, unknown>) {
  requireAdmin(request);
  const item = collection(kind).find((entry) => idOf(kind, entry) === id && !entry.deletedAt);
  if (!item) throw new HttpError(404, "NOT_FOUND", "找不到要改的内容");
  const nextId = asString(body.id) || asString(body.gameId);
  if (nextId && nextId !== id) throw new HttpError(409, "CONFLICT", "不能改主键");
  Object.assign(item, body, { deletedAt: item.deletedAt ?? null });
  const key = kind.endsWith("s") ? kind.slice(0, -1) : kind;
  return jsonOk({ [key]: item });
}

export function adminRemove(request: Request, kind: Kind, id: string, url: URL) {
  requireAdmin(request);
  const items = collection(kind);
  const index = items.findIndex((entry) => idOf(kind, entry) === id && !entry.deletedAt);
  if (index < 0) throw new HttpError(404, "NOT_FOUND", "找不到要下架的内容");
  if (kind === "packs") {
    const linked = db().levels.some((level) => level.packId === id);
    if (linked && url.searchParams.get("force") !== "true") {
      throw new HttpError(409, "IN_USE", "课包下还有关卡");
    }
  }
  if (kind === "assets") {
    const used = JSON.stringify(db().playableLevels).includes(id) || JSON.stringify(db().gameConfigs).includes(id);
    if (used && url.searchParams.get("force") !== "true") {
      throw new HttpError(409, "IN_USE", "素材仍被引用");
    }
  }
  const force = url.searchParams.get("force") === "true";
  if (force) items.splice(index, 1);
  else items[index].deletedAt = new Date().toISOString();
  return jsonOk({ success: true });
}
