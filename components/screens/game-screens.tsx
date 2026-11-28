"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BigButton } from "@/components/big-button";
import { playsLabel } from "@/components/games/chrome";
import { GAME_VIEWS } from "@/components/games/registry";
import { useGameRound } from "@/components/games/use-game-round";
import { EmptyPanel } from "@/components/empty-panel";
import { LoadingScreen } from "@/components/loading-screen";
import { OfflineState } from "@/components/offline-state";
import { Screen } from "@/components/screen";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { ApiError, api, failureKind, type FailureKind } from "@/lib/client/api";
import {
  applyServerQuotas,
  grantBonusPlay,
  localDayKey,
  mergeServerQuota,
  readChild,
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
  const [problem, setProblem] = useState<FailureKind | null>(null);
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
        setProblem(null);
        const childId = readChild()?.id;
        if (!childId) return;
        api<{ persisted: boolean; day: string; quotas: Array<{ gameId: string; used: number; bonus: number }> }>(
          `/api/games/quota?childId=${encodeURIComponent(childId)}&day=${encodeURIComponent(localDayKey())}`,
        )
          .then((quota) => {
            if (!ignore && quota.persisted) applyServerQuotas(quota.day, quota.quotas);
          })
          .catch(() => undefined);
      })
      .catch((error: unknown) => {
        if (!ignore) setProblem(failureKind(error));
      });
    return () => {
      ignore = true;
    };
  }, [attempt]);

  if (problem) {
    return (
      <OfflineState
        tabs
        kind={problem}
        onRetry={() => {
          setProblem(null);
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
        {games.length === 0 ? (
          <EmptyPanel title="游戏还在准备" body="乐园暂时是空的。可以先去课程馆玩一关。" primaryHref="/courses" primaryLabel="去课程馆" />
        ) : null}
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
      <OutOfPlaysDialog
        open={Boolean(blocked)}
        onClose={() => setBlocked(null)}
        onAd={() => {
          if (!blocked) return;
          const gameId = blocked.gameId;
          void api("/api/unlock/ad", {
            method: "POST",
            body: JSON.stringify({ gameId, adToken: "stub" }),
          })
            .then(() =>
              api<{ persisted: boolean; day: string; gameId: string; used: number; bonus: number }>(`/api/games/${gameId}/bonus`, {
                method: "POST",
                body: JSON.stringify({ childId: readChild()?.id, day: localDayKey() }),
              }),
            )
            .then((quota) => {
              if (quota.persisted) mergeServerQuota(quota.day, quota);
              else grantBonusPlay(gameId);
            })
            .catch(() => grantBonusPlay(gameId))
            .finally(() => {
              setBlocked(null);
              router.push(`/games/${gameId}`);
            });
        }}
      />
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
  const [problem, setProblem] = useState<FailureKind | null>(null);
  const [attempt, setAttempt] = useState(0);
  const vip = useVip();
  const left = useRemainingPlays(params.gameId, game?.dailyFree ?? 3, vip);

  useEffect(() => {
    let ignore = false;
    api<{ game: GameDocument }>(`/api/games/${params.gameId}`)
      .then((data) => {
        if (ignore) return;
        setGame(data.game);
        setProblem(null);
      })
      .catch(async (error: unknown) => {
        if (ignore) return;
        if (error instanceof ApiError && error.code === "LOCKED") {
          try {
            const list = await api<{ games: GameCard[] }>("/api/games");
            if (!ignore) setOutline(list.games.find((item) => item.gameId === params.gameId) ?? null);
          } catch (listError: unknown) {
            if (!ignore) setProblem(failureKind(listError));
          }
          return;
        }
        setProblem(failureKind(error));
      });
    return () => {
      ignore = true;
    };
  }, [attempt, params.gameId]);

  if (problem) {
    return (
      <OfflineState
        kind={problem}
        title={problem === "missing" ? "找不到这个游戏" : undefined}
        backHref="/games"
        backLabel="回乐园"
        onRetry={() => {
          setProblem(null);
          setAttempt((value) => value + 1);
        }}
      />
    );
  }
  if (game && Number.isFinite(left) && left <= 0) {
    return (
      <Screen className="flex min-h-dvh flex-col px-5 pt-16 pb-8 text-center">
        <h1 className="text-3xl font-black">{game.title}</h1>
        <p className="mt-3 font-bold text-primary">今日剩余 0 次</p>
        <OutOfPlaysDialog
          open
          onClose={() => router.push("/games")}
          onAd={() => {
            void api("/api/unlock/ad", {
              method: "POST",
              body: JSON.stringify({ gameId: game.gameId, adToken: "stub" }),
            })
            .then(() =>
              api<{ persisted: boolean; day: string; gameId: string; used: number; bonus: number }>(`/api/games/${game.gameId}/bonus`, {
                method: "POST",
                body: JSON.stringify({ childId: readChild()?.id, day: localDayKey() }),
              }),
            )
            .then((quota) => {
              if (quota.persisted) mergeServerQuota(quota.day, quota);
              else grantBonusPlay(game.gameId);
            })
            .catch(() => grantBonusPlay(game.gameId));
          }}
        />
      </Screen>
    );
  }
  if (game) {
    return <GamePlayer key={game.gameId} game={game} remaining={playsLabel(left)} onExit={() => router.push("/games")} />;
  }
  if (!outline && !problem) return <LoadingScreen />;
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

function GamePlayer({
  game,
  remaining,
  onExit,
}: {
  game: GameDocument;
  remaining: string;
  onExit: () => void;
}) {
  const round = useGameRound(game);
  const View = GAME_VIEWS[game.kind];
  return (
    <View
      game={game}
      remaining={remaining}
      onPlay={round.onPlay}
      onEnd={round.onEnd}
      onExit={() => round.onExit(onExit)}
    />
  );
}

function OutOfPlaysDialog({ open, onClose, onAd }: { open: boolean; onClose: () => void; onAd: () => void }) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogTitle>今日次数用完啦</DialogTitle>
        <DialogDescription>看广告可以再玩 1 次，会员不限次数。</DialogDescription>
        <div className="mt-5 grid gap-3">
          <BigButton onClick={onAd}>看广告再玩1次</BigButton>
          <BigButton variant="secondary" href="/membership?from=/games">
            会员无限玩
          </BigButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}
