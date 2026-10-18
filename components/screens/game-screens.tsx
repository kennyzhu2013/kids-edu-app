"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ColorMatch } from "@/components/color-match";
import { BigButton } from "@/components/big-button";
import { LoadingScreen } from "@/components/loading-screen";
import { OfflineState } from "@/components/offline-state";
import { Screen } from "@/components/screen";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { ApiError, api } from "@/lib/client/api";
import {
  consumePlay,
  grantBonusPlay,
  readStore,
  remainingPlays,
  saveEntitlementFlags,
  useRemainingPlays,
  useVip,
} from "@/lib/client/store";
import type { GameDocument } from "@/lib/content/schemas";

type GameCard = {
  gameId: string;
  title: string;
  titleEn: string;
  dailyFree: number;
  howTo: string;
  playable: boolean;
  durationSec: number;
};

export function GamesScreen() {
  const router = useRouter();
  const [games, setGames] = useState<GameCard[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [blocked, setBlocked] = useState<GameCard | null>(null);
  const [attempt, setAttempt] = useState(0);
  const vip = useVip();

  useEffect(() => {
    let ignore = false;
    Promise.all([
      api<{ games: GameCard[] }>("/api/games"),
      api<{ entitlements: Array<{ type: string }> }>("/api/entitlements"),
    ])
      .then(([gameData, rights]) => {
        if (ignore) return;
        const nextVip = rights.entitlements.some((item) => item.type === "vip_year");
        const noAds = nextVip || rights.entitlements.some((item) => item.type === "no_ads");
        saveEntitlementFlags({ vip: nextVip, noAds });
        setGames(gameData.games);
      })
      .catch(() => {
        if (!ignore) setFailed(true);
      });
    return () => {
      ignore = true;
    };
  }, [attempt]);

  if (failed) {
    return (
      <OfflineState
        onRetry={() => {
          setFailed(false);
          setAttempt((value) => value + 1);
        }}
      />
    );
  }
  if (!games) return <LoadingScreen />;

  return (
    <Screen tabs>
      <div className="px-5 pt-8">
        <h1 className="text-3xl font-black">游戏乐园</h1>
        <ul className="mt-5 grid gap-3">
          {games.map((game) => (
            <GameCard
              key={game.gameId}
              game={game}
              vip={vip}
              onOpen={() => {
                if (!game.playable) {
                  router.push(`/games/${game.gameId}`);
                  return;
                }
                const left = remainingPlays(game.gameId, game.dailyFree, vip);
                if (left <= 0) setBlocked(game);
                else router.push(`/games/${game.gameId}`);
              }}
            />
          ))}
        </ul>
      </div>
      <Dialog open={Boolean(blocked)} onOpenChange={(open) => !open && setBlocked(null)}>
        <DialogContent>
          <DialogTitle>今日次数用完啦</DialogTitle>
          <DialogDescription>看广告可以再玩 1 次，会员不限次数。</DialogDescription>
          <div className="mt-5 grid gap-3">
            <BigButton
              onClick={() => {
                if (!blocked) return;
                void api("/api/unlock/ad", {
                  method: "POST",
                  body: JSON.stringify({ gameId: blocked.gameId, adToken: "stub" }),
                })
                  .catch(() => undefined)
                  .finally(() => {
                    grantBonusPlay(blocked.gameId);
                    setBlocked(null);
                    router.push(`/games/${blocked.gameId}`);
                  });
              }}
            >
              看广告再玩1次
            </BigButton>
            <BigButton variant="secondary" href="/membership?from=/games">
              会员无限玩
            </BigButton>
          </div>
        </DialogContent>
      </Dialog>
    </Screen>
  );
}

function GameCard({
  game,
  vip,
  onOpen,
}: {
  game: GameCard;
  vip: boolean;
  onOpen: () => void;
}) {
  const left = useRemainingPlays(game.gameId, game.dailyFree, vip);
  return (
    <li>
      <button type="button" className="w-full rounded-[24px] bg-white p-4 text-left shadow-sm" onClick={onOpen}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-black">{game.title}</h2>
            <p className="text-sm text-muted-foreground">{game.titleEn}</p>
          </div>
          <p className="text-sm font-black text-primary">
            {game.playable ? (Number.isFinite(left) ? `今日剩余 ${left} 次` : "会员无限玩") : "即将上线"}
          </p>
        </div>
        <p className="mt-2 text-sm font-bold">{game.howTo}</p>
      </button>
    </li>
  );
}

export function GameScreen() {
  const params = useParams<{ gameId: string }>();
  const router = useRouter();
  const [game, setGame] = useState<GameDocument | null>(null);
  const [outline, setOutline] = useState<GameCard | null>(null);
  const [failed, setFailed] = useState(false);
  const [started, setStarted] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let ignore = false;
    api<{ game: GameDocument }>(`/api/games/${params.gameId}`)
      .then((data) => {
        if (!ignore) setGame(data.game);
      })
      .catch(async (error: unknown) => {
        if (ignore) return;
        if (error instanceof ApiError && error.code === "LOCKED") {
          const list = await api<{ games: GameCard[] }>("/api/games");
          if (!ignore) setOutline(list.games.find((item) => item.gameId === params.gameId) ?? null);
          return;
        }
        setFailed(true);
      });
    return () => {
      ignore = true;
    };
  }, [attempt, params.gameId]);

  if (failed) {
    return (
      <OfflineState
        onRetry={() => {
          setFailed(false);
          setAttempt((value) => value + 1);
        }}
      />
    );
  }
  if (game) {
    return (
      <ColorMatch
        game={game}
        onExit={() => router.push("/games")}
        onStart={() => {
          if (started || readStore().vip) return;
          consumePlay(game.gameId);
          setStarted(true);
        }}
      />
    );
  }
  if (!outline && !failed) return <LoadingScreen />;
  return (
    <Screen className="flex min-h-dvh flex-col px-5 pt-16 pb-8 text-center">
      <h1 className="text-3xl font-black">{outline?.title ?? "游戏"}</h1>
      <p className="mt-3 text-muted-foreground">{outline?.howTo}</p>
      <p className="mt-6 font-black">这款游戏还在画画</p>
      <div className="mt-auto">
        <BigButton href="/games">回列表</BigButton>
      </div>
    </Screen>
  );
}
