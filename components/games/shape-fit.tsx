"use client";

import { useRef, useState } from "react";
import { GameChrome, GameDone, GameReady, useRoundTimer } from "@/components/games/chrome";
import type { GameDocument } from "@/lib/content/schemas";
import { cn } from "@/lib/utils";

type ShapeGame = Extract<GameDocument, { kind: "shape-fit" }>;
type ShapeId = ShapeGame["shapes"][number]["id"];

function ShapeGlyph({ id, className }: { id: ShapeId; className?: string }) {
  return (
    <svg viewBox="0 0 80 80" className={cn("size-16", className)} aria-hidden>
      {id === "circle" ? <circle cx="40" cy="40" r="26" fill="#ff8a5b" /> : null}
      {id === "square" ? <rect x="16" y="16" width="48" height="48" rx="6" fill="#4aa3ff" /> : null}
      {id === "triangle" ? <polygon points="40,12 68,66 12,66" fill="#3dcb7a" /> : null}
    </svg>
  );
}

export function ShapeFit({
  game,
  remaining,
  onFinish,
  onExit,
}: {
  game: ShapeGame;
  remaining: string;
  onFinish: () => void;
  onExit: () => void;
}) {
  const [phase, setPhase] = useState<"ready" | "play" | "done">("ready");
  const [round, setRound] = useState(0);
  const [note, setNote] = useState("");
  const [shake, setShake] = useState(false);
  const [filled, setFilled] = useState<ShapeId | null>(null);
  const [won, setWon] = useState(false);
  const ended = useRef(false);
  const moved = useRef(false);
  const target = game.shapes[round % game.shapes.length];
  const left = useRoundTimer(phase === "play", game.durationSec, () => end(false));

  function end(success: boolean) {
    if (ended.current) return;
    ended.current = true;
    setWon(success);
    setPhase("done");
    onFinish();
  }

  function place(id: ShapeId) {
    if (phase !== "play" || !target || ended.current) return;
    if (id !== target.id) {
      setNote("再试一次");
      setShake(true);
      window.setTimeout(() => setShake(false), 350);
      return;
    }
    setFilled(id);
    setNote("真棒");
    const next = round + 1;
    window.setTimeout(() => {
      if (next >= game.winTarget) {
        setRound(next);
        end(true);
        return;
      }
      setRound(next);
      setFilled(null);
    }, 280);
  }

  return (
    <GameChrome title={game.title} phase={phase} seconds={left} progress={`${Math.min(round, game.winTarget)}/${game.winTarget}`} onExit={onExit}>
      {phase === "ready" ? (
        <GameReady title={game.title} titleEn={game.titleEn} howTo={game.howTo} remaining={remaining} onStart={() => setPhase("play")} />
      ) : null}
      {phase === "play" && target ? (
        <div className={cn("flex flex-1 flex-col", shake && "shake")}>
          <p className="mt-6 text-center text-xl font-black">把{target.label}放进来</p>
          <div
            data-slot="shape"
            className="mx-auto mt-4 grid size-36 place-items-center rounded-[28px] border-4 border-dashed border-primary/40 bg-white"
          >
            {filled ? <ShapeGlyph id={filled} /> : <ShapeGlyph id={target.id} className="opacity-25" />}
          </div>
          <p className="mt-4 h-7 text-center text-lg font-black text-primary" role="status">
            {note}
          </p>
          <div className="mt-auto grid grid-cols-3 gap-3">
            {game.shapes.map((shape) => (
              <button
                key={shape.id}
                type="button"
                aria-label={shape.label}
                onPointerDown={() => {
                  moved.current = false;
                }}
                onPointerMove={(event) => {
                  if (event.buttons) moved.current = true;
                }}
                onPointerUp={(event) => {
                  if (!moved.current) return;
                  const hit = document.elementFromPoint(event.clientX, event.clientY);
                  if (hit?.closest("[data-slot='shape']")) place(shape.id);
                }}
                onClick={() => {
                  if (moved.current) return;
                  place(shape.id);
                }}
                className="grid place-items-center rounded-[22px] bg-white py-3 shadow-sm"
              >
                <ShapeGlyph id={shape.id} />
                <span className="text-sm font-black">{shape.label}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
      {phase === "done" ? (
        <GameDone
          won={won}
          title={round >= game.winTarget ? "拼好啦！" : "时间到"}
          body={`放对 ${Math.min(round, game.winTarget)} 个`}
          remaining={remaining}
          onExit={onExit}
        />
      ) : null}
    </GameChrome>
  );
}
