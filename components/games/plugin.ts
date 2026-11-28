export const GAME_END_REASONS = ["win", "timeout", "exit", "aborted"] as const;

export type GameEndReason = (typeof GAME_END_REASONS)[number];

/** completed 只在胜利条件达成时为 true。超时、关闭、卸载都是未完成。 */
export type GameResult = {
  completed: boolean;
  reason: GameEndReason;
  score?: number;
  durationMs?: number;
};

export type GamePlugin = {
  init: () => void;
  start: () => void;
  pause: () => void;
  resume: () => void;
  submit: (result: GameResult) => void;
  getResult: () => GameResult | null;
  destroy: () => void;
};

export function gameResult(success: boolean, extra?: { score?: number; durationMs?: number }): GameResult {
  return {
    completed: success,
    reason: success ? "win" : "timeout",
    score: extra?.score,
    durationMs: extra?.durationMs,
  };
}

/** 只有赢了才记 game_completed。超时仍然可以扣次，但不是完成。 */
export function recordsGameCompleted(result: GameResult) {
  return result.completed === true && result.reason === "win";
}

/**
 * 薄生命周期。规则留在原来的五个组件里。
 * 本程的暂停等于离开页面时 destroy，不把这一局记成完成。
 */
export function createGamePlugin(handlers: { onStart: () => void; onEnd: (result: GameResult) => void }): GamePlugin {
  let result: GameResult | null = null;
  let started = false;
  let destroyed = false;
  const plugin: GamePlugin = {
    init() {},
    start() {
      if (destroyed || started) return;
      started = true;
      handlers.onStart();
    },
    pause() {
      plugin.destroy();
    },
    resume() {},
    submit(next) {
      if (destroyed || result) return;
      result = next;
      handlers.onEnd(next);
    },
    getResult() {
      return result;
    },
    destroy() {
      destroyed = true;
    },
  };
  return plugin;
}
