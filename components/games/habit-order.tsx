"use client";

import { useRef, useState } from "react";
import { TokenArt } from "@/components/illustrations";
import { GameChrome, GameDone, GameReady, useRoundTimer } from "@/components/games/chrome";
import { gameResult, type GameResult } from "@/components/games/plugin";
import { HearButton, speakLine } from "@/components/games/voice";
import { playCue } from "@/lib/client/speech";
import type { GameDocument } from "@/lib/content/schemas";
import { cn } from "@/lib/utils";

type HabitGame = Extract<GameDocument, { kind: "habit-order" }>;
type Step = HabitGame["steps"][number];

function shuffled(steps: Step[]) {
  const copy = [...steps];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = (index * 3 + 1) % (index + 1);
    const current = copy[index];
    copy[index] = copy[swap];
    copy[swap] = current;
  }
  if (copy.every((step, index) => step.id === steps[index]?.id) && copy.length > 1) {
    const first = copy[0];
    copy[0] = copy[1];
    copy[1] = first;
  }
  return copy;
}

export function HabitOrder({
  game,
  remaining,
  onPlay,
  onEnd,
  onExit,
}: {
  game: HabitGame;
  remaining: string;
  onPlay: () => void;
  onEnd: (result: GameResult) => void;
  onExit: () => void;
}) {
  const [pool, setPool] = useState<Step[]>(() => shuffled(game.steps));
  const [placed, setPlaced] = useState<Array<Step | null>>(() => game.steps.map(() => null));
  const [phase, setPhase] = useState<"ready" | "play" | "done">("ready");
  const [note, setNote] = useState("");
  const [shake, setShake] = useState(false);
  const [won, setWon] = useState(false);
  const ended = useRef(false);
  const moved = useRef(false);
  const startedAt = useRef(0);
  const left = useRoundTimer(phase === "play", game.durationSec, () => end(false));

  function begin() {
    startedAt.current = Date.now();
    setPhase("play");
    onPlay();
  }

  function end(success: boolean) {
    if (ended.current) return;
    ended.current = true;
    setWon(success);
    setPhase("done");
    onEnd(
      gameResult(success, {
        score: success ? 1 : 0,
        durationMs: startedAt.current > 0 ? Math.max(0, Date.now() - startedAt.current) : 0,
      }),
    );
  }

  function resetWrong() {
    playCue("again");
    setNote("再试一次");
    setShake(true);
    window.setTimeout(() => setShake(false), 350);
    setPool(shuffled(game.steps));
    setPlaced(game.steps.map(() => null));
  }

  function put(step: Step, index?: number) {
    if (phase !== "play" || ended.current) return;
    const slot = index ?? placed.findIndex((item) => item === null);
    if (slot < 0 || placed[slot]) return;
    const next = placed.slice();
    next[slot] = step;
    const nextPool = pool.filter((item) => item.id !== step.id);
    setPool(nextPool);
    setPlaced(next);
    if (next.some((item) => item === null)) {
      setNote("");
      return;
    }
    const correct = next.every((item, itemIndex) => item?.id === game.steps[itemIndex]?.id);
    if (!correct) {
      resetWrong();
      return;
    }
    playCue("ok");
    setNote("真棒");
    end(true);
  }

  const filled = placed.filter(Boolean).length;

  return (
    <GameChrome title={game.title} phase={phase} seconds={left} progress={`${won ? 1 : 0}/${game.winTarget}`} onExit={onExit}>
      {phase === "ready" ? (
        <GameReady
          title={game.title}
          titleEn={game.titleEn}
          howTo={game.howTo}
          remaining={remaining}
          audioIntro={game.audioIntro}
          introScript={game.introScript}
          onStart={() => {
            begin();
            speakLine(game.promptAudio, game.promptSpeak ?? "按顺序排一排");
          }}
        />
      ) : null}
      {phase === "play" ? (
        <div className={cn("flex flex-1 flex-col", shake && "shake")}>
          <p className="mt-4 text-center font-bold">先打湿，再搓皂，冲干净，最后擦干</p>
          <div className="mt-3 flex justify-center">
            <HearButton audio={game.promptAudio} speak={game.promptSpeak ?? "按顺序排一排"} label="再听一次" />
          </div>
          <ol className="mt-3 grid gap-2">
            {placed.map((step, index) => (
              <li
                key={game.steps[index]?.id ?? index}
                data-slot={index}
                className="flex h-14 items-center gap-3 rounded-[18px] bg-white px-3 shadow-sm"
              >
                <span className="grid size-8 place-items-center rounded-full bg-accent font-black">{index + 1}</span>
                {step ? (
                  <>
                    <TokenArt token={step.visual} className="size-10" />
                    <span className="font-black">{step.label}</span>
                  </>
                ) : (
                  <span className="text-sm text-muted-foreground">拖到这里，或点下面的卡片</span>
                )}
              </li>
            ))}
          </ol>
          <p className="mt-3 h-7 text-center text-lg font-black text-primary" role="status">
            {note}
          </p>
          <div className="mt-auto grid grid-cols-2 gap-2">
            {pool.map((step) => (
              <button
                key={step.id}
                type="button"
                aria-label={step.label}
                onPointerDown={() => {
                  moved.current = false;
                }}
                onPointerMove={(event) => {
                  if (event.buttons) moved.current = true;
                }}
                onPointerUp={(event) => {
                  if (!moved.current) return;
                  const hit = document.elementFromPoint(event.clientX, event.clientY)?.closest("[data-slot]");
                  const index = hit ? Number(hit.getAttribute("data-slot")) : Number.NaN;
                  if (Number.isInteger(index)) put(step, index);
                }}
                onClick={() => {
                  if (moved.current) return;
                  put(step);
                }}
                className="flex items-center gap-2 rounded-[18px] bg-white p-2 text-left shadow-sm"
              >
                <TokenArt token={step.visual} className="size-10" />
                <span className="font-black">{step.label}</span>
              </button>
            ))}
          </div>
          <p className="sr-only">已放 {filled} 张</p>
        </div>
      ) : null}
      {phase === "done" ? (
        <GameDone won={won} title={won ? "顺序对啦！" : "时间到"} body={won ? "洗手四步都对" : "还没排完"} remaining={remaining} onExit={onExit} />
      ) : null}
    </GameChrome>
  );
}
