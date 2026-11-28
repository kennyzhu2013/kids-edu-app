import { HttpError, jsonOk, asString } from "@/lib/api/http";
import { db, uid } from "@/lib/api/memory";
import { requireUser } from "@/lib/api/modules/auth";
import { isUniqueConflict, persistLearningEvent } from "@/lib/api/persist";
import { databaseEnabled, getPrisma } from "@/lib/api/prisma";
import {
  isErrorCause,
  isLearningEventType,
  parseIncomingEvents,
  type ErrorCause,
  type EventSource,
  type LearningEventRecord,
  type LearningEventType,
} from "@/lib/learning/events";

export function requireOwnedChild(userId: string, childId: string) {
  const id = childId.trim();
  const child = id ? db().children.find((item) => item.id === id && item.userId === userId) : undefined;
  if (!child) throw new HttpError(404, "NOT_FOUND", "找不到这个孩子");
  return child;
}

type NewLearningEvent = {
  childId: string;
  sessionId: string;
  type: LearningEventType;
  knowledgePointId: string | null;
  levelId: string | null;
  gameId: string | null;
  stepId: string | null;
  correct: boolean | null;
  durationMs: number;
  errorCause: ErrorCause | null;
  source: EventSource;
  clientEventId: string;
};

/**
 * 写入一条学习事件。同一个 clientEventId 再来一次就返回已有行。
 * 无库时只查内存，重启后这张表会空，和进度一样。有库时靠唯一约束，内存只是缓存。
 */
export async function appendLearningEvent(input: NewLearningEvent) {
  const state = db();
  const existing = state.learningEvents.find((item) => item.clientEventId === input.clientEventId);
  if (existing) return { event: existing, idempotent: true };
  const row: LearningEventRecord = {
    id: uid("evt"),
    createdAt: new Date().toISOString(),
    ...input,
  };
  state.learningEvents.push(row);
  if (!databaseEnabled()) return { event: row, idempotent: false };
  try {
    await persistLearningEvent(row);
    return { event: row, idempotent: false };
  } catch (error) {
    if (!isUniqueConflict(error)) {
      state.learningEvents = state.learningEvents.filter((item) => item.id !== row.id);
      throw error;
    }
    const saved = await getPrisma().learningEvent.findUnique({ where: { clientEventId: input.clientEventId } });
    state.learningEvents = state.learningEvents.filter((item) => item.clientEventId !== input.clientEventId);
    if (!saved) return { event: row, idempotent: true };
    const loaded: LearningEventRecord = {
      id: saved.id,
      childId: saved.childId,
      sessionId: saved.sessionId,
      type: isLearningEventType(saved.type) ? saved.type : "learning_paused",
      knowledgePointId: saved.knowledgePointId,
      levelId: saved.levelId,
      gameId: saved.gameId,
      stepId: saved.stepId,
      correct: saved.correct,
      durationMs: saved.durationMs,
      errorCause: saved.errorCause && isErrorCause(saved.errorCause) ? saved.errorCause : null,
      source: saved.source === "server" ? "server" : "device",
      clientEventId: saved.clientEventId,
      createdAt: saved.createdAt.toISOString(),
    };
    state.learningEvents.push(loaded);
    return { event: loaded, idempotent: true };
  }
}

export async function postEvents(request: Request, body: Record<string, unknown>) {
  const user = requireUser(request);
  const parsed = parseIncomingEvents(body);
  if (!parsed.ok) throw new HttpError(400, "BAD_EVENT", parsed.message);
  for (const event of parsed.events) requireOwnedChild(user.id, event.childId);
  const saved = [];
  for (const event of parsed.events) {
    const result = await appendLearningEvent(event);
    saved.push({
      id: result.event.id,
      clientEventId: result.event.clientEventId,
      type: result.event.type,
      correct: result.event.correct,
      source: result.event.source,
      idempotent: result.idempotent,
      createdAt: result.event.createdAt,
    });
  }
  return jsonOk({ events: saved });
}

export function listEvents(request: Request, url: URL) {
  const user = requireUser(request);
  const child = requireOwnedChild(user.id, url.searchParams.get("childId") ?? "");
  const type = asString(url.searchParams.get("type"));
  const gameId = asString(url.searchParams.get("gameId"));
  const levelId = asString(url.searchParams.get("levelId"));
  const limit = Math.min(200, Math.max(1, Number(url.searchParams.get("limit") ?? 100) || 100));
  const events = db()
    .learningEvents.filter((item) => item.childId === child.id)
    .filter((item) => (type ? item.type === type : true))
    .filter((item) => (gameId ? item.gameId === gameId : true))
    .filter((item) => (levelId ? item.levelId === levelId : true))
    .slice(-limit);
  return jsonOk({ childId: child.id, events });
}

/** math-starter 客观题的权威记录。跟读不写这里，所以不会把星星抬高。 */
export async function recordServerMathEvents(input: {
  childId: string;
  levelId: string;
  attemptId: string;
  durationMs: number;
  objective: Array<{ stepId: string; correct: boolean }>;
}) {
  const level = db().playableLevels[input.levelId];
  const sessionId = `server:${input.attemptId}`;
  for (const item of input.objective) {
    const step = level?.steps.find((candidate) => candidate.id === item.stepId);
    if (step?.type === "speak") continue;
    const points = step && step.knowledgePointIds.length > 0 ? step.knowledgePointIds : [null];
    for (const point of points) {
      await appendLearningEvent({
        childId: input.childId,
        sessionId,
        type: item.correct ? "question_answered" : "question_failed",
        knowledgePointId: point,
        levelId: input.levelId,
        gameId: null,
        stepId: item.stepId,
        correct: item.correct,
        durationMs: 0,
        errorCause: item.correct ? null : "unknown_error",
        source: "server",
        clientEventId: point ? `${input.attemptId}:server:${item.stepId}:${point}` : `${input.attemptId}:server:${item.stepId}`,
      });
    }
  }
  const levelPoints = level && level.knowledgePointIds.length > 0 ? level.knowledgePointIds : [null];
  for (const point of levelPoints) {
    await appendLearningEvent({
      childId: input.childId,
      sessionId,
      type: "lesson_completed",
      knowledgePointId: point,
      levelId: input.levelId,
      gameId: null,
      stepId: null,
      correct: null,
      durationMs: input.durationMs,
      errorCause: null,
      source: "server",
      clientEventId: point ? `${input.attemptId}:server:lesson:${point}` : `${input.attemptId}:server:lesson`,
    });
  }
}
