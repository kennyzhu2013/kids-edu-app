"use client";

import { useRef, useState } from "react";
import { TokenArt } from "@/components/illustrations";
import { GameChrome, GameDone, GameReady, useRoundTimer } from "@/components/games/chrome";
import { HearButton, speakLine } from "@/components/games/voice";
import { playCue } from "@/lib/client/speech";
import { useChild } from "@/lib/client/store";
import type { GameDocument } from "@/lib/content/schemas";
import { cn } from "@/lib/utils";

type CountGame = Extract<GameDocument, { kind: "count-dash" }>;

type Piece = { id: string; kind: "apple" | "star" };

function boardFor(target: number, distract: boolean): Piece[] {
  const pieces: Piece[] = Array.from({ length: target }, (_, index) => ({ id: `apple-${index}`, kind: "apple" }));
  if (distract) {
    pieces.splice(1, 0, { id: "star-a", kind: "star" });
    pieces.push({ id: "star-b", kind: "star" });
  }
  return pieces;
}

export function CountDash({
  game,
  remaining,
  onFinish,
  onExit,
}: {
  game: CountGame;
  remaining: string;
  onFinish: () => void;
  onExit: () => void;
}) {
  const child = useChild();
  const distract = child?.ageBand === "B" || child?.ageBand === "C";
  const [phase, setPhase] = useState<"ready" | "play" | "done">("ready");
  const [round, setRound] = useState(0);
  const [picked, setPicked] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [shake, setShake] = useState(false);
  const [won, setWon] = useState(false);
  const ended = useRef(false);
  const target = game.targets[round] ?? game.targets[0];
  const cue = game.cues?.[String(target)];
  const cueSpeak = cue?.speak ?? `点${target}个苹果`;
  const pieces = boardFor(target, distract);
  const apples = picked.length;
  const left = useRoundTimer(phase === "play", game.durationSec, () => end(false));

  function end(success: boolean) {
    if (ended.current) return;
    ended.current = true;
    setWon(success);
    setPhase("done");
    onFinish();
  }

  function tap(piece: Piece) {
    if (phase !== "play" || picked.includes(piece.id)) return;
    if (piece.kind === "star") {
      playCue("again");
      setNote("星星不算");
      setShake(true);
      window.setTimeout(() => setShake(false), 350);
      return;
    }
    const next = [...picked, piece.id];
    setPicked(next);
    if (next.length >= target) {
      const nextRound = round + 1;
      if (nextRound >= game.targets.length) {
        playCue("ok");
        setRound(nextRound);
        end(true);
        return;
      }
      playCue("ok");
      setNote("真棒");
      setRound(nextRound);
      setPicked([]);
      const nextTarget = game.targets[nextRound];
      const nextCue = game.cues?.[String(nextTarget)];
      speakLine(nextCue?.audio, nextCue?.speak ?? `点${nextTarget}个苹果`);
      return;
    }
    setNote("");
  }

  return (
    <GameChrome title={game.title} phase={phase} seconds={left} progress={`${Math.min(round, game.targets.length)}/${game.targets.length}`} onExit={onExit}>
      {phase === "ready" ? (
        <GameReady
          title={game.title}
          titleEn={game.titleEn}
          howTo={game.howTo}
          remaining={remaining}
          audioIntro={game.audioIntro}
          introScript={game.introScript}
          onStart={() => {
            setPhase("play");
            const first = game.targets[0];
            const firstCue = game.cues?.[String(first)];
            speakLine(firstCue?.audio, firstCue?.speak ?? `点${first}个苹果`);
          }}
        />
      ) : null}
      {phase === "play" ? (
        <div className={cn("flex flex-1 flex-col", shake && "shake")}>
          <p className="mt-6 text-center text-5xl font-black text-primary">{target}</p>
          <p className="mt-1 text-center font-bold">点 {target} 个苹果 · 已点 {apples}</p>
          <div className="mt-3 flex justify-center">
            <HearButton audio={cue?.audio} speak={cueSpeak} label="再听一次" />
          </div>
          <div className="mx-auto mt-4 grid w-full max-w-[320px] grid-cols-3 gap-2">
            {pieces.map((piece) => {
              const on = picked.includes(piece.id);
              return (
                <button
                  key={piece.id}
                  type="button"
                  aria-label={piece.kind === "apple" ? "苹果" : "星星"}
                  data-kind={piece.kind}
                  disabled={on}
                  onClick={() => tap(piece)}
                  className={cn("grid place-items-center rounded-[20px] bg-white py-2 shadow-sm", on && "opacity-40")}
                >
                  <TokenArt token={piece.kind === "apple" ? "/art/apple-red.svg" : "/art/star.svg"} />
                </button>
              );
            })}
          </div>
          <p className="mt-4 h-7 text-center text-lg font-black text-primary" role="status">
            {note}
          </p>
        </div>
      ) : null}
      {phase === "done" ? (
        <GameDone
          won={won}
          title={round >= game.targets.length ? "数对啦！" : "时间到"}
          body={`完成 ${Math.min(round, game.targets.length)} 轮`}
          remaining={remaining}
          onExit={onExit}
        />
      ) : null}
    </GameChrome>
  );
}
