import { HttpError, jsonOk, asNumber, asString } from "@/lib/api/http";
import { currentChild, db, uid, type ProgressRecord } from "@/lib/api/memory";
import { requireUser } from "@/lib/api/modules/auth";

function suggestionFor() {
  // TODO: 按薄弱项推荐。文案先用原型里的「颜色词」。
  return "颜色词";
}

export function getToday(request: Request, url: URL) {
  requireUser(request);
  const child = currentChild(db(), url.searchParams.get("childId"));
  if (!child) throw new HttpError(403, "FORBIDDEN", "还没有孩子档案");
  const done = new Set(
    db()
      .progress.filter((item) => item.childId === child.id && item.status === "completed")
      .map((item) => item.levelId),
  );
  const hello = db().levels.find((level) => level.id === "eng-starter-01");
  const tasks = [
    {
      id: "eng-starter-01",
      kind: "level" as const,
      title: hello?.title ?? "Hello & Bye",
      minutes: 2,
      status: done.has("eng-starter-01") ? "done" : "todo",
      href: "/play/eng-starter-01",
    },
    {
      id: "game-color-match",
      kind: "game" as const,
      title: "颜色配对",
      minutes: 1,
      status: "todo",
      href: "/games/game-color-match",
    },
    {
      id: "math-starter-01",
      kind: "level" as const,
      title: "数数1-5",
      minutes: 2,
      status: "locked",
      href: "/courses/math-starter",
    },
  ];
  const helloDone = done.has("eng-starter-01");
  const streakDays = db().progress.some(
    (item) => item.childId === child.id && item.completedAt && isSameDay(item.completedAt),
  )
    ? 1
    : 0;
  return jsonOk({
    child,
    streakDays,
    continueLevel: {
      id: "eng-starter-01",
      title: hello?.title ?? "Hello & Bye",
      minutes: 2,
      status: helloDone ? "done" : "todo",
      progress: helloDone ? 1 : 0,
    },
    tasks,
  });
}

export function completeLevel(request: Request, levelId: string, body: Record<string, unknown>) {
  requireUser(request);
  const urlChild = asString(body.childId);
  const child = currentChild(db(), urlChild || null);
  if (!child) throw new HttpError(403, "FORBIDDEN", "还没有孩子档案");
  const level = db().levels.find((item) => item.id === levelId);
  if (!level) throw new HttpError(404, "NOT_FOUND", "找不到这一关");
  if (!level.playable) throw new HttpError(403, "LOCKED", "未解锁", { lockReason: "AD_OR_VIP" });

  const clientEventId = asString(body.clientEventId) || null;
  if (clientEventId) {
    const existing = db().progress.find((item) => item.clientEventId === clientEventId);
    if (existing) {
      return jsonOk({
        progress: existing,
        rewards: { stars: existing.stars },
        nextHint: "下一关需要广告或会员，内容仍在制作",
        idempotent: true,
      });
    }
  }

  const score = clamp(asNumber(body.score), 0, 100);
  const stars = clamp(asNumber(body.stars), 1, 3);
  const duration = clamp(asNumber(body.duration), 0, 60 * 30);
  const previous = db().progress.find((item) => item.childId === child.id && item.levelId === levelId);
  const now = new Date().toISOString();
  if (previous) {
    previous.status = "completed";
    previous.stars = Math.max(previous.stars, stars);
    previous.score = Math.max(previous.score, score);
    previous.durationSec += duration;
    previous.completedAt = now;
    previous.clientEventId = clientEventId ?? previous.clientEventId;
    return jsonOk({
      progress: previous,
      rewards: { stars: previous.stars, copy: "Great job!" },
      nextHint: "下一关需要广告或会员，内容仍在制作",
    });
  }

  const created: ProgressRecord = {
    id: uid("prog"),
    childId: child.id,
    levelId,
    status: "completed",
    stars,
    score,
    durationSec: duration,
    clientEventId,
    completedAt: now,
  };
  db().progress.push(created);
  return jsonOk({
    progress: created,
    rewards: { stars, copy: "Great job!" },
    nextHint: "下一关需要广告或会员，内容仍在制作",
  });
}

export function progressSummary(request: Request, url: URL) {
  requireUser(request);
  const child = currentChild(db(), url.searchParams.get("childId"));
  if (!child) throw new HttpError(403, "FORBIDDEN", "还没有孩子档案");
  const rows = db().progress.filter((item) => item.childId === child.id && item.status === "completed");
  const weekRows = rows.filter((item) => item.completedAt && isSameWeek(item.completedAt));
  const minutes = Math.round(weekRows.reduce((sum, item) => sum + item.durationSec, 0) / 60);
  return jsonOk({
    childId: child.id,
    minutes,
    completedLevels: weekRows.length,
    streakDays: rows.some((item) => item.completedAt && isSameDay(item.completedAt)) ? 1 : 0,
    suggestion: suggestionFor(),
    todo: "REPORT_AGGREGATION",
  });
}

function clamp(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.round(value)));
}

function isSameDay(iso: string, now = new Date()) {
  const date = new Date(iso);
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
}

function isSameWeek(iso: string, now = new Date()) {
  const date = new Date(iso);
  const start = new Date(now);
  start.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  start.setHours(0, 0, 0, 0);
  return date >= start;
}
