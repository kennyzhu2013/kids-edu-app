import { HttpError, jsonOk, asNumber, asString } from "@/lib/api/http";
import { currentChild, db, uid, type ProgressRecord } from "@/lib/api/memory";
import { requireUser } from "@/lib/api/modules/auth";
import { recordServerMathEvents } from "@/lib/api/modules/events";
import { settleLevelReview } from "@/lib/api/modules/learning-state";
import { persistProgress, persistTodayPlan } from "@/lib/api/persist";
import { scoreMathStarter, stepAttemptListSchema } from "@/lib/content/score-math";
import type { AgeBand } from "@/lib/age";
import { isProduction } from "@/lib/api/secrets";
import { sameDayKey, shiftUtcDay, utcDayKey } from "@/lib/learning/dates";
import { buildProgressReport } from "@/lib/learning/report";
import { reviewPassed } from "@/lib/learning/review";
import { buildTodayTasks, describeTodayTasks, frozenTasks } from "@/lib/learning/today-tasks";

export async function getToday(request: Request, url: URL, now = new Date()) {
  requireUser(request);
  if (isProduction() && !db().user.guardianConsentAt) {
    throw new HttpError(403, "CONSENT_REQUIRED", "请先由监护人同意隐私说明");
  }
  const child = currentChild(db(), url.searchParams.get("childId"));
  if (!child) throw new HttpError(403, "FORBIDDEN", "还没有孩子档案");
  const state = db();
  const tasks = tasksForToday(child.id, child.ageBand, now);
  await persistTodayPlan(child.id);
  const finished = tasks.filter((task) => task.status === "done").length;
  const continueTask = tasks.find((task) => task.status !== "done") ?? tasks[0];
  const childRows = state.progress.filter((item) => item.childId === child.id);
  return jsonOk({
    child,
    streakDays: streakDaysFor(childRows, now),
    continueLevel: continueTask
      ? {
          id: continueTask.id,
          title: continueTask.title,
          minutes: continueTask.minutes,
          status: continueTask.status,
          subject: continueTask.subject,
          subjectId: continueTask.subjectId,
          progress: tasks.length === 0 ? 0 : finished / tasks.length,
        }
      : null,
    tasks,
  });
}

function tasksForToday(childId: string, age: "A" | "B" | "C", now: Date) {
  const state = db();
  if (!state.todayPlans) state.todayPlans = {};
  const day = utcDayKey(now);
  let plan = state.todayPlans[childId];
  if (!plan || !sameDayKey(plan.day, day)) {
    const tasks = buildTodayTasks({ state, childId, age, day });
    plan = {
      day,
      ageBand: age,
      levelIds: tasks.filter((task) => task.kind !== "game").map((task) => task.id),
      tasks,
    };
    state.todayPlans[childId] = plan;
  } else if (plan.day !== day) {
    plan.day = day;
  }
  return describeTodayTasks({ state, childId, day, tasks: frozenTasks(plan) });
}

function childForCompletion(childId: string) {
  if (childId) {
    const found = db().children.find((item) => item.id === childId && item.userId === db().user.id);
    if (!found) throw new HttpError(404, "NOT_FOUND", "找不到这个孩子");
    return found;
  }
  const child = currentChild(db(), null);
  if (!child) throw new HttpError(403, "FORBIDDEN", "还没有孩子档案");
  return child;
}

export async function completeLevel(request: Request, levelId: string, body: Record<string, unknown>) {
  requireUser(request);
  const child = childForCompletion(asString(body.childId));
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
        nextHint: "可以去课程馆接着玩",
        idempotent: true,
      });
    }
  }

  const scored = scoreForLevel(level.packId, levelId, child.ageBand, body);
  const score = scored.score;
  const stars = scored.stars;
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
    await persistProgress(previous);
    const attemptId = clientEventId ?? uid("math");
    if (scored.detail) {
      await recordServerMathEvents({
        childId: child.id,
        levelId,
        attemptId,
        durationMs: duration * 1000,
        objective: scored.detail.objective,
      });
    }
    await settleLevelReview({
      childId: child.id,
      levelId,
      attemptId,
      passed: reviewPassed(scored.detail?.objective ?? null, scored.stars),
      durationMs: duration * 1000,
    });
    return jsonOk({
      progress: previous,
      rewards: { stars: previous.stars, copy: "Great job!" },
      nextHint: "可以去课程馆接着玩",
      ...(scored.detail ? { scoring: scored.detail } : {}),
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
  await persistProgress(created);
  const attemptId = clientEventId ?? uid("math");
  if (scored.detail) {
    await recordServerMathEvents({
      childId: child.id,
      levelId,
      attemptId,
      durationMs: duration * 1000,
      objective: scored.detail.objective,
    });
  }
  await settleLevelReview({
    childId: child.id,
    levelId,
    attemptId,
      passed: reviewPassed(scored.detail?.objective ?? null, scored.stars),
    durationMs: duration * 1000,
  });
  return jsonOk({
    progress: created,
    rewards: { stars, copy: "Great job!" },
    nextHint: "可以去课程馆接着玩",
    ...(scored.detail ? { scoring: scored.detail } : {}),
  });
}

function scoreForLevel(packId: string, levelId: string, age: AgeBand, body: Record<string, unknown>) {
  if (packId !== "math-starter") {
    return {
      score: clamp(asNumber(body.score), 0, 100),
      stars: clamp(asNumber(body.stars), 1, 3),
      detail: undefined,
    };
  }
  const full = db().playableLevels[levelId];
  if (!full) throw new HttpError(404, "NOT_FOUND", "找不到这一关");
  const parsed = stepAttemptListSchema.safeParse(body.steps);
  if (!parsed.success) {
    throw new HttpError(400, "STEPS_REQUIRED", "math-starter 需要带上每道客观题的作答");
  }
  const result = scoreMathStarter(full, age, parsed.data);
  if (!result.ok) throw new HttpError(400, "STEPS_REQUIRED", result.message);
  return {
    score: result.score,
    stars: result.stars,
    detail: {
      packId: "math-starter",
      source: "server",
      stars: result.stars,
      score: result.score,
      objective: result.objective,
      speak: result.speak,
    },
  };
}

export function progressSummary(request: Request, url: URL, now = new Date()) {
  requireUser(request);
  const state = db();
  const child = currentChild(state, url.searchParams.get("childId"));
  if (!child) throw new HttpError(403, "FORBIDDEN", "还没有孩子档案");
  const report = buildProgressReport(state, child.id, now);
  return jsonOk({
    childId: child.id,
    nickname: child.nickname,
    ...report,
  });
}

function clamp(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.round(value)));
}

function streakDaysFor(rows: Array<{ status: string; completedAt: string | null }>, now = new Date()) {
  const days = new Set(
    rows
      .filter((item) => item.status === "completed" && item.completedAt)
      .map((item) => utcDayKey(new Date(item.completedAt!))),
  );
  const today = utcDayKey(now);
  let cursor = days.has(today) ? today : days.has(shiftUtcDay(today, -1)) ? shiftUtcDay(today, -1) : null;
  if (!cursor) return 0;
  let count = 0;
  while (days.has(cursor)) {
    count += 1;
    cursor = shiftUtcDay(cursor, -1);
  }
  return count;
}
