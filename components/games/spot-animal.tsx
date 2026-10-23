"use client";

import { useRef, useState } from "react";
import { TokenArt } from "@/components/illustrations";
import { GameChrome, GameDone, GameReady, useRoundTimer } from "@/components/games/chrome";
import { playCue } from "@/lib/client/speech";
import type { GameDocument } from "@/lib/content/schemas";
import { cn } from "@/lib/utils";

type SpotGame = Extract<GameDocument, { kind: "spot-animal" }>;
type Animal = SpotGame["animals"][number];

const ODD_INDEX = [4, 0, 8];

function buildRounds(animals: Animal[]) {
  return ODD_INDEX.map((oddIndex, round) => {
    const major = animals[round % animals.length];
    const odd = animals[(round + 1) % animals.length];
    const cells = Array.from({ length: 9 }, () => major);
    cells[oddIndex] = odd;
    return cells;
  });
}

export function SpotAnimal({
  game,
  remaining,
  onFinish,
  onExit,
}: {
  game: SpotGame;
  remaining: string;
  onFinish: () => void;
  onExit: () => void;
}) {
  const [rounds] = useState(() => buildRounds(game.animals));
  const [phase, setPhase] = useState<"ready" | "play" | "done">("ready");
  const [round, setRound] = useState(0);
  const [note, setNote] = useState("");
  const [shake, setShake] = useState(false);
  const [won, setWon] = useState(false);
  const ended = useRef(false);
  const cells = rounds[round] ?? rounds[0];
  const left = useRoundTimer(phase === "play", game.durationSec, () => end(false));

  function end(success: boolean) {
    if (ended.current) return;
    ended.current = true;
    setWon(success);
    setPhase("done");
    setNote(success ? "真棒" : "");
    onFinish();
  }

  function pick(index: number) {
    if (phase !== "play" || !cells) return;
    const oddIndex = ODD_INDEX[round] ?? 4;
    if (index !== oddIndex) {
      playCue("again");
      setNote("再试一次");
      setShake(true);
      window.setTimeout(() => setShake(false), 350);
      return;
    }
    const next = round + 1;
    if (next >= game.winTarget) {
      playCue("ok");
      setRound(next);
      end(true);
      return;
    }
    playCue("ok");
    setNote("真棒");
    setRound(next);
  }

  return (
    <GameChrome title={game.title} phase={phase} seconds={left} progress={`${Math.min(round, game.winTarget)}/${game.winTarget}`} onExit={onExit}>
      {phase === "ready" ? (
        <GameReady title={game.title} titleEn={game.titleEn} howTo={game.howTo} remaining={remaining} onStart={() => setPhase("play")} />
      ) : null}
      {phase === "play" && cells ? (
        <div className={cn("flex flex-1 flex-col", shake && "shake")}>
          <p className="mt-6 text-center text-xl font-black">哪个不一样？</p>
          <div className="mx-auto mt-4 grid w-full max-w-[320px] grid-cols-3 gap-2">
            {cells.map((animal, index) => (
              <button
                key={`${round}-${index}`}
                type="button"
                aria-label={animal.label}
                data-animal={animal.id}
                onClick={() => pick(index)}
                className="grid place-items-center rounded-[20px] bg-white py-2 shadow-sm"
              >
                <TokenArt token={animal.id} />
              </button>
            ))}
          </div>
          <p className="mt-4 h-7 text-center text-lg font-black text-primary" role="status">
            {note}
          </p>
        </div>
      ) : null}
      {phase === "done" ? (
        <GameDone
          won={won}
          title={round >= game.winTarget ? "找到啦！" : "时间到"}
          body={`找出 ${Math.min(round, game.winTarget)} 只`}
          remaining={remaining}
          onExit={onExit}
        />
      ) : null}
    </GameChrome>
  );
}
