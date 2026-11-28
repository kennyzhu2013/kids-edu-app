import { z } from "zod";

/** 关页补发队列的上限。超出时丢掉最旧的。 */
export const EVENT_QUEUE_CAP = 100;

export const LEARNING_EVENT_TYPES = [
  "learning_started",
  "lesson_started",
  "lesson_completed",
  "question_answered",
  "question_failed",
  "hint_requested",
  "game_started",
  "game_completed",
  "review_completed",
  "learning_paused",
  "no_hearing",
] as const;

export const ERROR_CAUSES = [
  "concept_error",
  "recognition_error",
  "operation_error",
  "listening_error",
  "attention_error",
  "unknown_error",
] as const;

export type LearningEventType = (typeof LEARNING_EVENT_TYPES)[number];
export type ErrorCause = (typeof ERROR_CAUSES)[number];
export type EventSource = "server" | "device";

export type LearningEventRecord = {
  id: string;
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
  createdAt: string;
};

const eventSchema = z.object({
  clientEventId: z.string().trim().min(1).max(180),
  childId: z.string().trim().min(1).max(80),
  sessionId: z.string().trim().min(1).max(80),
  type: z.enum(LEARNING_EVENT_TYPES),
  knowledgePointId: z.string().trim().min(1).max(80).nullable().optional(),
  levelId: z.string().trim().min(1).max(80).nullable().optional(),
  gameId: z.string().trim().min(1).max(80).nullable().optional(),
  stepId: z.string().trim().min(1).max(80).nullable().optional(),
  correct: z.boolean().nullable().optional(),
  durationMs: z.number().int().min(0).max(86_400_000),
  errorCause: z.enum(ERROR_CAUSES).nullable().optional(),
  source: z.enum(["server", "device"]),
});

export type DeviceEventInput = z.infer<typeof eventSchema>;

export type StoredDeviceEvent = {
  clientEventId: string;
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
  source: "device";
};

/**
 * 客户端上报一律记成 device。source=server 只由 math-starter 完成时的服务端计分写入。
 * 不读取、不保存音频字段。
 */
export function parseIncomingEvents(body: unknown): { ok: true; events: StoredDeviceEvent[] } | { ok: false; message: string } {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, message: "学习事件需要是 JSON 对象" };
  }
  const record = body as Record<string, unknown>;
  if ("events" in record && !Array.isArray(record.events)) {
    return { ok: false, message: "events 需要是数组" };
  }
  const rawList = "events" in record ? record.events : [record];
  const parsed = z.array(eventSchema).min(1).max(40).safeParse(rawList);
  if (!parsed.success) {
    return { ok: false, message: "学习事件字段不正确" };
  }
  const events: StoredDeviceEvent[] = [];
  for (const item of parsed.data) {
    if (item.type === "review_completed") {
      return { ok: false, message: "review_completed 只能在复习完成时由服务端写入" };
    }
    if (item.source !== "device") {
      return { ok: false, message: "source=server 只由服务端计分写入" };
    }
    if (item.type === "no_hearing" && item.correct != null) {
      return { ok: false, message: "no_hearing 的 correct 必须为空" };
    }
    if (item.type === "no_hearing" && item.errorCause) {
      return { ok: false, message: "no_hearing 不能带错因" };
    }
    events.push(toDeviceEvent(item));
  }
  return { ok: true, events };
}

/** 只复制允许的字段。音频或其他附加字段不会进队列、也不会入库。 */
export function toDeviceEvent(input: DeviceEventInput): StoredDeviceEvent {
  const errorCause = input.type === "no_hearing" ? null : input.type === "question_failed" ? (input.errorCause ?? "unknown_error") : (input.errorCause ?? null);
  return {
    clientEventId: input.clientEventId,
    childId: input.childId,
    sessionId: input.sessionId,
    type: input.type,
    knowledgePointId: input.knowledgePointId ?? null,
    levelId: input.levelId ?? null,
    gameId: input.gameId ?? null,
    stepId: input.stepId ?? null,
    correct: input.type === "no_hearing" ? null : (input.correct ?? null),
    durationMs: input.durationMs,
    errorCause,
    source: "device",
  };
}

export function mergeEventQueue<T extends { clientEventId: string }>(existing: T[], incoming: T[], cap = EVENT_QUEUE_CAP) {
  const seen = new Set(existing.map((item) => item.clientEventId));
  const next = existing.slice();
  for (const item of incoming) {
    if (seen.has(item.clientEventId)) continue;
    seen.add(item.clientEventId);
    next.push(item);
  }
  return next.length > cap ? next.slice(next.length - cap) : next;
}

/** 空听不是答错。麦克风没开或浏览器听不了，走原来的「我说完了」，不算 no_hearing。 */
export function classifyListen(reason: "empty" | "denied" | "unavailable") {
  return reason === "empty" ? "no_hearing" : "blocked";
}

/** 答错时尽量按操作归类。判断不了用 unknown_error，不用答错去推断注意力。 */
export function errorCauseForStep(stepType: string): ErrorCause {
  if (stepType === "tap" || stepType === "count-tap") return "recognition_error";
  if (stepType === "drag" || stepType === "sort") return "operation_error";
  if (stepType === "speak") return "listening_error";
  return "unknown_error";
}

export function isLearningEventType(value: string): value is LearningEventType {
  return (LEARNING_EVENT_TYPES as readonly string[]).includes(value);
}

export function isErrorCause(value: string): value is ErrorCause {
  return (ERROR_CAUSES as readonly string[]).includes(value);
}
