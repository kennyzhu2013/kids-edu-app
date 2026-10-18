"use client";

import { X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { BigButton } from "@/components/big-button";
import { StarResult } from "@/components/star-result";

export function GameChrome({
  title,
  phase,
  seconds,
  progress,
  onExit,
  children,
}: {
  title: string;
  phase: "ready" | "play" | "done";
  seconds: number;
  progress: string;
  onExit: () => void;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col px-4 pt-4 pb-6">
      <div className="flex items-center justify-between">
        <button type="button" className="grid size-11 place-items-center rounded-full bg-white shadow-sm" aria-label="关闭" onClick={onExit}>
          <X />
        </button>
        <p className="font-black">{phase === "ready" ? title : `剩余 ${seconds} 秒`}</p>
        <p className="min-w-16 text-right text-sm font-bold text-muted-foreground">{progress}</p>
      </div>
      {children}
    </div>
  );
}

export function GameReady({
  title,
  titleEn,
  howTo,
  remaining,
  onStart,
}: {
  title: string;
  titleEn: string;
  howTo: string;
  remaining: string;
  onStart: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col justify-center text-center">
      <h1 className="text-3xl font-black">{title}</h1>
      <p className="mt-2 text-muted-foreground">{titleEn}</p>
      <p className="mt-4 text-lg font-bold">{howTo}</p>
      <p className="mt-3 text-sm font-black text-primary">{remaining}</p>
      <div className="mt-8">
        <BigButton onClick={onStart}>开始</BigButton>
      </div>
    </div>
  );
}

export function GameDone({
  won,
  title,
  body,
  remaining,
  onExit,
}: {
  won: boolean;
  title: string;
  body: string;
  remaining: string;
  onExit: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center">
      <StarResult stars={won ? 3 : 1} />
      <h1 className="mt-4 text-3xl font-black">{title}</h1>
      <p className="mt-2 text-muted-foreground">{body}</p>
      <p className="mt-2 text-sm font-black text-primary">{remaining}</p>
      <div className="mt-8 w-full">
        <BigButton onClick={onExit}>回列表</BigButton>
      </div>
    </div>
  );
}

export function playsLabel(left: number) {
  return Number.isFinite(left) ? `今日剩余 ${left} 次` : "会员无限玩";
}

export function useRoundTimer(running: boolean, seconds: number, onTimeUp: () => void) {
  const [left, setLeft] = useState(seconds);
  const onTimeUpRef = useRef(onTimeUp);
  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
  }, [onTimeUp]);
  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      setLeft((value) => {
        if (value <= 1) {
          window.setTimeout(() => onTimeUpRef.current(), 0);
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [running]);
  return left;
}
