import type { GameDocument, LevelDocument } from "@/lib/content/schemas";
import type { Memory, ProgressRecord } from "@/lib/api/memory";
import { utcDayKey } from "@/lib/learning/dates";

export const DEFAULT_TODAY_TASK_CAP = 4;

const SUBJECT_ORDER = ["lang", "math", "eng", "life"] as const;
const PACKS_BY_SUBJECT: Record<(typeof SUBJECT_ORDER)[number], string[]> = {
  lang: ["lang-starter"],
  math: ["math-starter", "math-life"],
  eng: ["eng-starter"],
  life: ["life-starter"],
};
const START_ORDER = { A: 1, B: 2, C: 3 } as const;

export type TodaySlot = "review" | "weak" | "new" | "game";
export type TodayKind = "review" | "level" | "game";

export type TodayTaskRef = {
  kind: TodayKind;
  slot: TodaySlot;
  id: string;
  knowledgePointId: string | null;
};

export type TodayTaskView = TodayTaskRef & {
  label: "复习" | "新课" | "再练" | "游戏";
  title: string;
  minutes: number;
  status: "todo" | "done";
  href: string;
  subject: string;
  subjectId: string;
  packId: string | null;
};

type Age = "A" | "B" | "C";

export function todayTaskLabel(slot: TodaySlot): TodayTaskView["label"] {
  if (slot === "review") return "复习";
  if (slot === "new") return "新课";
  if (slot === "weak") return "再练";
  return "游戏";
}

export function buildTodayTasks(input: {
  state: Memory;
  childId: string;
  age: Age;
  day: string;
  maxTasks?: number;
}) {
  const max = input.maxTasks ?? DEFAULT_TODAY_TASK_CAP;
  const done = completedLevels(input.state.progress, input.childId);
  const tasks: TodayTaskRef[] = [];
  const usedLevels = new Set<string>();

  const due = input.state.reviewPlans
    .filter((plan) => plan.childId === input.childId && plan.status === "pending" && plan.dueOn <= input.day)
    .sort((a, b) => a.dueOn.localeCompare(b.dueOn) || a.knowledgePointId.localeCompare(b.knowledgePointId));
  for (const plan of due) {
    if (tasks.length >= max) break;
    if (tasks.some((task) => task.knowledgePointId === plan.knowledgePointId)) continue;
    const level = levelForPoint(input.state, plan.knowledgePointId, done, true);
    if (!level) continue;
    tasks.push({ kind: "review", slot: "review", id: level.id, knowledgePointId: plan.knowledgePointId });
    usedLevels.add(level.id);
  }

  const weak = input.state.knowledgeMastery
    .filter(
      (row) =>
        row.childId === input.childId &&
        (row.status === "not_yet" || row.status === "learning") &&
        !tasks.some((task) => task.knowledgePointId === row.knowledgePointId),
    )
    .sort((a, b) => (a.score ?? 0) - (b.score ?? 0) || a.knowledgePointId.localeCompare(b.knowledgePointId));
  for (const row of weak) {
    if (tasks.length >= max) break;
    const level = levelForPoint(input.state, row.knowledgePointId, done, false);
    if (!level || usedLevels.has(level.id)) continue;
    tasks.push({ kind: "level", slot: "weak", id: level.id, knowledgePointId: row.knowledgePointId });
    usedLevels.add(level.id);
  }

  for (const subjectId of SUBJECT_ORDER) {
    if (tasks.length >= max) break;
    const chosen = pickNewLevel(input.state, subjectId, input.age, done, usedLevels);
    if (!chosen) continue;
    tasks.push({
      kind: "level",
      slot: "new",
      id: chosen.id,
      knowledgePointId: primaryPoint(input.state.playableLevels[chosen.id]),
    });
    usedLevels.add(chosen.id);
  }

  if (tasks.length < max) {
    const game = pickGame(input.state, tasks.map((task) => task.knowledgePointId).filter((id): id is string => Boolean(id)));
    if (game) tasks.push({ kind: "game", slot: "game", id: game.gameId, knowledgePointId: null });
  }

  return tasks;
}

export function describeTodayTasks(input: {
  state: Memory;
  childId: string;
  day: string;
  tasks: TodayTaskRef[];
}) {
  return input.tasks
    .map((task) => describeOne(input.state, input.childId, input.day, task))
    .filter((task): task is TodayTaskView => task !== null);
}

function describeOne(state: Memory, childId: string, day: string, task: TodayTaskRef): TodayTaskView | null {
  if (task.kind === "game") {
    const game = state.games.find((item) => item.gameId === task.id);
    if (!game) return null;
    return {
      ...task,
      label: todayTaskLabel(task.slot),
      title: game.title,
      minutes: Math.max(1, Math.round(game.durationSec / 60)),
      status: "todo",
      href: `/games/${game.gameId}`,
      subject: "游戏",
      subjectId: "game",
      packId: null,
    };
  }
  const level = state.levels.find((item) => item.id === task.id);
  if (!level) return null;
  const subjectId = state.packs.find((pack) => pack.id === level.packId)?.subjectId ?? "";
  const subject = state.subjects.find((item) => item.id === subjectId)?.name ?? subjectId;
  return {
    ...task,
    label: todayTaskLabel(task.slot),
    title: level.title,
    minutes: level.minutes,
    status: taskStatus(state, childId, day, task),
    href: `/play/${level.id}`,
    subject,
    subjectId,
    packId: level.packId,
  };
}

function taskStatus(state: Memory, childId: string, day: string, task: TodayTaskRef): "todo" | "done" {
  if (task.slot === "review") {
    const pending = state.reviewPlans.some(
      (plan) =>
        plan.childId === childId &&
        plan.knowledgePointId === task.knowledgePointId &&
        plan.status === "pending" &&
        plan.dueOn <= day,
    );
    if (pending) return "todo";
    const finishedToday = state.learningEvents.some(
      (event) =>
        event.childId === childId &&
        event.type === "review_completed" &&
        event.knowledgePointId === task.knowledgePointId &&
        utcDayKey(new Date(event.createdAt)) === day,
    );
    return finishedToday ? "done" : "todo";
  }
  if (task.slot === "weak") return completedOnDay(state.progress, childId, task.id, day) ? "done" : "todo";
  return everCompleted(state.progress, childId, task.id) ? "done" : "todo";
}

function completedLevels(rows: ProgressRecord[], childId: string) {
  return new Set(rows.filter((item) => item.childId === childId && item.status === "completed").map((item) => item.levelId));
}

function everCompleted(rows: ProgressRecord[], childId: string, levelId: string) {
  return rows.some((item) => item.childId === childId && item.levelId === levelId && item.status === "completed");
}

function completedOnDay(rows: ProgressRecord[], childId: string, levelId: string, day: string) {
  return rows.some(
    (item) =>
      item.childId === childId &&
      item.levelId === levelId &&
      item.status === "completed" &&
      item.completedAt != null &&
      utcDayKey(new Date(item.completedAt)) === day,
  );
}

function levelForPoint(state: Memory, pointId: string, done: Set<string>, preferCompleted: boolean) {
  const matches = state.levels
    .filter((level) => level.playable && levelHasPoint(state.playableLevels[level.id], pointId))
    .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
  if (matches.length === 0) return null;
  if (preferCompleted) return matches.find((level) => done.has(level.id)) ?? matches[0];
  return matches.find((level) => !done.has(level.id)) ?? matches[0];
}

function levelHasPoint(level: LevelDocument | undefined, pointId: string) {
  if (!level) return false;
  if (level.knowledgePointIds.includes(pointId)) return true;
  return level.steps.some((step) => step.knowledgePointIds.includes(pointId));
}

function primaryPoint(level: LevelDocument | undefined) {
  if (!level) return null;
  return level.knowledgePointIds[0] ?? level.steps.find((step) => step.knowledgePointIds.length > 0)?.knowledgePointIds[0] ?? null;
}

function pickNewLevel(state: Memory, subjectId: (typeof SUBJECT_ORDER)[number], age: Age, done: Set<string>, used: Set<string>) {
  const packIds = PACKS_BY_SUBJECT[subjectId].filter((packId) => !(age === "A" && packId === "math-life"));
  const levels = packIds
    .flatMap((packId) => state.levels.filter((level) => level.packId === packId && level.playable))
    .filter((level) => !used.has(level.id))
    .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
  if (levels.length === 0) return null;
  const start = START_ORDER[age];
  const incomplete = levels.filter((level) => !done.has(level.id));
  return incomplete.find((level) => level.order >= start) ?? incomplete[0] ?? levels[0];
}

function pickGame(state: Memory, pointIds: string[]) {
  const games = state.games.filter((game) => game.playable).sort((a, b) => a.gameId.localeCompare(b.gameId));
  const matched = games.find((game) => gameSharesPoint(state.gameConfigs[game.gameId], pointIds));
  return matched ?? games[0] ?? null;
}

function gameSharesPoint(game: GameDocument | undefined, pointIds: string[]) {
  if (!game || pointIds.length === 0) return false;
  return game.knowledgePointIds.some((id) => pointIds.includes(id));
}

export function legacyTasks(levelIds: string[]): TodayTaskRef[] {
  return levelIds.map((id) => ({ kind: "level", slot: "new", id, knowledgePointId: null }));
}

export function pointsOnLevel(level: LevelDocument | undefined) {
  if (!level) return [];
  const ids = new Set(level.knowledgePointIds);
  for (const step of level.steps) {
    for (const id of step.knowledgePointIds) ids.add(id);
  }
  return [...ids];
}

export type TodayPlanSnapshot = {
  day: string;
  ageBand: Age;
  levelIds: string[];
  tasks: TodayTaskRef[] | null;
};

export function frozenTasks(plan: TodayPlanSnapshot) {
  if (plan.tasks && plan.tasks.length > 0) return plan.tasks;
  return legacyTasks(plan.levelIds);
}
