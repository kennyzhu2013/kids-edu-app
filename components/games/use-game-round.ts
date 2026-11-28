"use client";

import { useEffect, useRef } from "react";
import { createGamePlugin, recordsGameCompleted, type GamePlugin, type GameResult } from "@/components/games/plugin";
import { api } from "@/lib/client/api";
import { reportGame } from "@/lib/client/report-learning";
import { consumePlay, localDayKey, mergeServerQuota, readChild, readStore } from "@/lib/client/store";
import type { GameDocument } from "@/lib/content/schemas";

type QuotaResponse = {
  persisted: boolean;
  idempotent?: boolean;
  day: string;
  gameId: string;
  used: number;
  bonus: number;
};

function consumeRound(gameId: string, clientEventId: string, reason: GameResult["reason"]) {
  const childId = readChild()?.id;
  const body: Record<string, unknown> = { day: localDayKey(), reason, clientEventId };
  if (childId) body.childId = childId;
  void api<QuotaResponse>(`/api/games/${gameId}/consume`, {
    method: "POST",
    body: JSON.stringify(body),
  })
    .then((quota) => {
      if (quota.idempotent) {
        if (quota.persisted) mergeServerQuota(quota.day, quota);
        return;
      }
      if (quota.persisted) mergeServerQuota(quota.day, quota);
      else consumePlay(gameId);
    })
    .catch(() => consumePlay(gameId));
}

/** 进入 play 记 game_started。只有赢了记 game_completed。关闭和卸载不走 submit。 */
export function useGameRound(game: GameDocument) {
  const pluginRef = useRef<GamePlugin | null>(null);
  const gameRef = useRef(game);

  useEffect(() => {
    gameRef.current = game;
  }, [game]);

  useEffect(() => {
    const roundId = crypto.randomUUID();
    const plugin = createGamePlugin({
      onStart() {
        reportGame(gameRef.current, "game_started", `${roundId}:start`, 0);
      },
      onEnd(result) {
        const current = gameRef.current;
        if (!readStore().vip) consumeRound(current.gameId, `${roundId}:quota`, result.reason);
        if (recordsGameCompleted(result)) {
          reportGame(current, "game_completed", `${roundId}:done`, result.durationMs ?? 0);
        }
      },
    });
    plugin.init();
    pluginRef.current = plugin;
    return () => {
      plugin.pause();
      if (pluginRef.current === plugin) pluginRef.current = null;
    };
  }, [game.gameId]);

  return {
    onPlay() {
      pluginRef.current?.start();
    },
    onEnd(result: GameResult) {
      pluginRef.current?.submit(result);
    },
    onExit(leave: () => void) {
      pluginRef.current?.pause();
      leave();
    },
  };
}
