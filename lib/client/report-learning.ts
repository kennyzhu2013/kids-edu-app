"use client";

import { enqueueLearningEvents, flushEventQueue } from "@/lib/client/event-queue";
import { readChild } from "@/lib/client/store";
import { toDeviceEvent, type ErrorCause, type LearningEventType, type StoredDeviceEvent } from "@/lib/learning/events";

const SESSION_KEY = "qimeng:session";

export function learningSessionId() {
  if (typeof window === "undefined") return "server";
  try {
    const existing = sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const created = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, created);
    return created;
  } catch {
    return "session";
  }
}

function pointsOf(ids: string[]) {
  return ids.length > 0 ? ids : [null];
}

function send(events: StoredDeviceEvent[]) {
  enqueueLearningEvents(events);
  void flushEventQueue();
}

function deviceEvent(input: {
  clientEventId: string;
  type: LearningEventType;
  knowledgePointId: string | null;
  levelId: string | null;
  gameId: string | null;
  stepId: string | null;
  correct: boolean | null;
  durationMs: number;
  errorCause: ErrorCause | null;
}): StoredDeviceEvent | null {
  const childId = readChild()?.id;
  if (!childId) return null;
  return toDeviceEvent({
    ...input,
    childId,
    sessionId: learningSessionId(),
    source: "device",
  });
}

function fan(baseId: string, knowledgePointIds: string[], build: (point: string | null, clientEventId: string) => StoredDeviceEvent | null) {
  const points = pointsOf(knowledgePointIds);
  const events: StoredDeviceEvent[] = [];
  for (const point of points) {
    const clientEventId = point ? `${baseId}:${point}` : baseId;
    const event = build(point, clientEventId);
    if (event) events.push(event);
  }
  if (events.length > 0) send(events);
}

export function reportLevelEnter(level: { id: string; knowledgePointIds: string[] }, attemptId: string) {
  if (!attemptId) return;
  const sessionId = learningSessionId();
  const started = deviceEvent({
    clientEventId: `learning:${sessionId}`,
    type: "learning_started",
    knowledgePointId: null,
    levelId: level.id,
    gameId: null,
    stepId: null,
    correct: null,
    durationMs: 0,
    errorCause: null,
  });
  const events = started ? [started] : [];
  for (const point of pointsOf(level.knowledgePointIds)) {
    const event = deviceEvent({
      clientEventId: point ? `${attemptId}:enter:${point}` : `${attemptId}:enter`,
      type: "lesson_started",
      knowledgePointId: point,
      levelId: level.id,
      gameId: null,
      stepId: null,
      correct: null,
      durationMs: 0,
      errorCause: null,
    });
    if (event) events.push(event);
  }
  if (events.length > 0) send(events);
}

export function reportLevelPause(level: { id: string; knowledgePointIds: string[] }, attemptId: string) {
  fan(`${attemptId}:paused`, level.knowledgePointIds, (point, clientEventId) =>
    deviceEvent({
      clientEventId,
      type: "learning_paused",
      knowledgePointId: point,
      levelId: level.id,
      gameId: null,
      stepId: null,
      correct: null,
      durationMs: 0,
      errorCause: null,
    }),
  );
}

export function reportLevelComplete(level: { id: string; knowledgePointIds: string[] }, attemptId: string, durationMs: number) {
  fan(`${attemptId}:lesson`, level.knowledgePointIds, (point, clientEventId) =>
    deviceEvent({
      clientEventId,
      type: "lesson_completed",
      knowledgePointId: point,
      levelId: level.id,
      gameId: null,
      stepId: null,
      correct: null,
      durationMs,
      errorCause: null,
    }),
  );
}

export function reportStep(input: {
  attemptId: string;
  levelId: string;
  stepId: string;
  knowledgePointIds: string[];
  type: "question_answered" | "question_failed" | "hint_requested" | "no_hearing";
  correct: boolean | null;
  errorCause: ErrorCause | null;
  durationMs: number;
  nonce?: string;
}) {
  const nonce = input.nonce ? `:${input.nonce}` : "";
  fan(`${input.attemptId}:${input.type}:${input.stepId}${nonce}`, input.knowledgePointIds, (point, clientEventId) =>
    deviceEvent({
      clientEventId,
      type: input.type,
      knowledgePointId: point,
      levelId: input.levelId,
      gameId: null,
      stepId: input.stepId,
      correct: input.type === "no_hearing" ? null : input.correct,
      durationMs: input.durationMs,
      errorCause: input.type === "no_hearing" ? null : input.errorCause,
    }),
  );
}

export function reportGame(
  game: { gameId: string; knowledgePointIds: string[] },
  type: "game_started" | "game_completed",
  baseId: string,
  durationMs: number,
) {
  fan(baseId, game.knowledgePointIds, (point, clientEventId) =>
    deviceEvent({
      clientEventId,
      type,
      knowledgePointId: point,
      levelId: null,
      gameId: game.gameId,
      stepId: null,
      correct: type === "game_completed" ? true : null,
      durationMs,
      errorCause: null,
    }),
  );
}
