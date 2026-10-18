import { HttpError, jsonOk, asString } from "@/lib/api/http";
import { db, uid, type ChildRecord } from "@/lib/api/memory";
import { requireUser } from "@/lib/api/modules/auth";

const MAX_CHILDREN = 4;

function toPublic(child: ChildRecord) {
  return {
    id: child.id,
    nickname: child.nickname,
    ageBand: child.ageBand,
    avatar: child.avatar,
    isCurrent: child.isCurrent,
  };
}

function ownChild(id: string) {
  const child = db().children.find((item) => item.id === id);
  if (!child) throw new HttpError(404, "NOT_FOUND", "找不到这个孩子");
  if (child.userId !== db().user.id) throw new HttpError(403, "FORBIDDEN", "不能操作别人的档案");
  return child;
}

function parseAgeBand(value: unknown) {
  const ageBand = asString(value);
  if (ageBand !== "A" && ageBand !== "B" && ageBand !== "C") {
    throw new HttpError(400, "AGE_BAND_INVALID", "年龄段需要是 A、B 或 C");
  }
  return ageBand;
}

export function listChildren(request: Request) {
  requireUser(request);
  return jsonOk({ children: db().children.map(toPublic) });
}

export function createChild(request: Request, body: Record<string, unknown>) {
  requireUser(request);
  const state = db();
  if (state.children.length >= MAX_CHILDREN) {
    throw new HttpError(409, "CHILD_LIMIT", "孩子档案已达上限");
  }
  const nickname = asString(body.nickname);
  if (!nickname || nickname.length > 8) {
    throw new HttpError(400, "NICKNAME_INVALID", "小名需要 1 到 8 个字");
  }
  const ageBand = parseAgeBand(body.ageBand);
  const avatar = asString(body.avatar) || "sprout";
  for (const child of state.children) child.isCurrent = false;
  const child: ChildRecord = {
    id: uid("child"),
    userId: state.user.id,
    nickname,
    ageBand,
    avatar,
    isCurrent: true,
  };
  state.children.push(child);
  return jsonOk({ child: toPublic(child) }, 201);
}

export function updateChild(request: Request, id: string, body: Record<string, unknown>) {
  requireUser(request);
  const child = ownChild(id);
  if ("nickname" in body) {
    const nickname = asString(body.nickname);
    if (!nickname || nickname.length > 8) {
      throw new HttpError(400, "NICKNAME_INVALID", "小名需要 1 到 8 个字");
    }
    child.nickname = nickname;
  }
  if ("ageBand" in body) child.ageBand = parseAgeBand(body.ageBand);
  if ("avatar" in body) child.avatar = asString(body.avatar) || null;
  return jsonOk({ child: toPublic(child) });
}

export function switchChild(request: Request, id: string) {
  requireUser(request);
  const child = ownChild(id);
  for (const item of db().children) item.isCurrent = item.id === child.id;
  return jsonOk({ currentChildId: child.id });
}
