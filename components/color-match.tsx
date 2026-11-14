"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { GameChrome, GameDone, GameReady, useRoundTimer } from "@/components/games/chrome";
import { playCue } from "@/lib/client/speech";
import type { GameDocument } from "@/lib/content/schemas";
import { cn } from "@/lib/utils";

type ColorGame = Extract<GameDocument, { kind: "color-match" }>;

export function ColorMatch({
  game,
  remaining,
  onFinish,
  onExit,
}: {
  game: ColorGame;
  remaining: string;
  onFinish: () => void;
  onExit: () => void;
}) {
  const [phase, setPhase] = useState<"ready" | "play" | "done">("ready");
  const [colorIndex, setColorIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [won, setWon] = useState(false);
  const [shake, setShake] = useState(false);
  const [note, setNote] = useState("");
  const ended = useRef(false);
  const color = game.colors[colorIndex % game.colors.length];
  const left = useRoundTimer(phase === "play", game.durationSec, () => end(false));

  function end(success: boolean) {
    if (ended.current) return;
    ended.current = true;
    setWon(success);
    setPhase("done");
    onFinish();
  }

  function pick(id: string) {
    if (phase !== "play" || !color) return;
    if (id !== color.id) {
      playCue("again");
      setNote("再试一次");
      setShake(true);
      window.setTimeout(() => setShake(false), 350);
      return;
    }
    const nextScore = score + 1;
    playCue("ok");
    setScore(nextScore);
    setNote("真棒");
    if (nextScore >= game.winTarget) {
      end(true);
      return;
    }
    setColorIndex((value) => value + 1);
  }

  return (
    <GameChrome title={game.title} phase={phase} seconds={left} progress={`${score}/${game.winTarget}`} onExit={onExit}>
      {phase === "ready" ? (
        <GameReady title={game.title} titleEn={game.titleEn} howTo={game.howTo} remaining={remaining} onStart={() => setPhase("play")} />
      ) : null}
      {phase === "play" && color ? (
        <div className={cn("flex flex-1 flex-col", shake && "shake")}>
          <div className="mx-auto mt-8 grid size-40 place-items-center overflow-hidden rounded-[36px] bg-white shadow-md">
            <Image src={`/art/ball-${color.id}.svg`} alt={`${color.label} ${color.labelEn}`} width={112} height={112} unoptimized className="size-28 object-contain" />
          </div>
          <p className="mt-4 h-7 text-center text-lg font-black text-primary" role="status">
            {note}
          </p>
          <div className="mt-auto grid grid-cols-4 gap-2">
            {game.colors.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-label={item.label}
                onClick={() => pick(item.id)}
                className="grid h-20 place-items-center rounded-[22px] border-4 border-white bg-white shadow-sm"
              >
                <Image src={`/art/ball-${item.id}.svg`} alt="" width={48} height={48} unoptimized className="size-12 object-contain" />
              </button>
            ))}
          </div>
        </div>
      ) : null}
      {phase === "done" ? (
        <GameDone won={won} title={won ? "接对啦！" : "时间到"} body={`接对 ${score} 个`} remaining={remaining} onExit={onExit} />
      ) : null}
    </GameChrome>
  );
}
