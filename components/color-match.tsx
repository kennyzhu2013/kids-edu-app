"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { BigButton } from "@/components/big-button";
import { StarResult } from "@/components/star-result";
import type { GameDocument } from "@/lib/content/schemas";
import { cn } from "@/lib/utils";

export function ColorMatch({
  game,
  onStart,
  onExit,
}: {
  game: GameDocument;
  onStart: () => void;
  onExit: () => void;
}) {
  const [phase, setPhase] = useState<"ready" | "play" | "done">("ready");
  const [colorIndex, setColorIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [left, setLeft] = useState(game.durationSec);
  const [won, setWon] = useState(false);
  const [shake, setShake] = useState(false);
  const [note, setNote] = useState("");
  const color = game.colors[colorIndex % game.colors.length];

  useEffect(() => {
    if (phase !== "play") return;
    const timer = window.setInterval(() => {
      setLeft((value) => {
        if (value <= 1) {
          setWon(false);
          setPhase("done");
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [phase]);

  function pick(id: string) {
    if (phase !== "play" || !color) return;
    if (id !== color.id) {
      setNote("再试一次");
      setShake(true);
      window.setTimeout(() => setShake(false), 350);
      return;
    }
    const nextScore = score + 1;
    setScore(nextScore);
    setNote("真棒");
    if (nextScore >= game.winTarget) {
      setWon(true);
      setPhase("done");
      return;
    }
    setColorIndex((value) => value + 1);
  }

  return (
    <div className="flex min-h-dvh flex-col px-4 pt-4 pb-6">
      <div className="flex items-center justify-between">
        <button type="button" className="grid size-11 place-items-center rounded-full bg-white shadow-sm" aria-label="关闭" onClick={onExit}>
          <X />
        </button>
        <p className="font-black">{phase === "ready" ? game.title : `剩余 ${left} 秒`}</p>
        <p className="min-w-11 text-right text-sm font-bold text-muted-foreground">{score}/{game.winTarget}</p>
      </div>

      {phase === "ready" ? (
        <div className="flex flex-1 flex-col justify-center text-center">
          <h1 className="text-3xl font-black">{game.title}</h1>
          <p className="mt-2 text-muted-foreground">{game.titleEn}</p>
          <p className="mt-4 text-lg font-bold">{game.howTo}</p>
          <div className="mt-8">
            <BigButton
              onClick={() => {
                onStart();
                setPhase("play");
              }}
            >
              开始
            </BigButton>
          </div>
        </div>
      ) : null}

      {phase === "play" && color ? (
        <div className={cn("flex flex-1 flex-col", shake && "shake")}>
          <div className="mx-auto mt-8 grid size-40 place-items-center rounded-[36px] text-white shadow-md" style={{ background: color.hex }}>
            <div>
              <p className="text-2xl font-black">{color.label}</p>
              <p className="text-sm font-bold opacity-90">{color.labelEn}</p>
            </div>
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
                className="h-20 rounded-[22px] border-4 border-white shadow-sm"
                style={{ background: item.hex }}
              />
            ))}
          </div>
        </div>
      ) : null}

      {phase === "done" ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <StarResult stars={won ? 3 : 1} />
          <h1 className="mt-4 text-3xl font-black">{won ? "接对啦！" : "时间到"}</h1>
          <p className="mt-2 text-muted-foreground">接对 {score} 个</p>
          <div className="mt-8 w-full">
            <BigButton onClick={onExit}>回列表</BigButton>
          </div>
        </div>
      ) : null}
    </div>
  );
}
