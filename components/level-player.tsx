"use client";

import { Volume2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { KidScene } from "@/components/illustrations";
import { BigButton } from "@/components/big-button";
import { LoadingScreen } from "@/components/loading-screen";
import { OfflineState } from "@/components/offline-state";
import { StarResult } from "@/components/star-result";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { ApiError, api } from "@/lib/client/api";
import { readChild, readStore } from "@/lib/client/store";
import { speak, stopSpeech } from "@/lib/client/speech";
import type { LevelDocument } from "@/lib/content/schemas";
import { cn } from "@/lib/utils";

type Phase = "listen" | "quiz" | "result" | "ad" | "ad-playing" | "soon";

export function LevelPlayer({ levelId }: { levelId: string }) {
  const router = useRouter();
  const [level, setLevel] = useState<LevelDocument | null>(null);
  const [failed, setFailed] = useState(false);
  const [locked, setLocked] = useState(false);
  const [phase, setPhase] = useState<Phase>("listen");
  const [stepIndex, setStepIndex] = useState(0);
  const [feedback, setFeedback] = useState<"good" | "again" | null>(null);
  const [hinted, setHinted] = useState(false);
  const [shake, setShake] = useState(false);
  const [busy, setBusy] = useState(false);
  const [stars, setStars] = useState(3);
  const [confirmExit, setConfirmExit] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const mistakes = useRef(0);
  const startedAt = useRef(0);
  const eventId = useRef("");

  useEffect(() => {
    startedAt.current = Date.now();
    eventId.current = crypto.randomUUID();
    let ignore = false;
    api<{ level: LevelDocument }>(`/api/levels/${levelId}`)
      .then((data) => {
        if (!ignore) setLevel(data.level);
      })
      .catch((error: unknown) => {
        if (ignore) return;
        if (error instanceof ApiError && error.code === "LOCKED") setLocked(true);
        else setFailed(true);
      });
    return () => {
      ignore = true;
      stopSpeech();
    };
  }, [attempt, levelId]);

  useEffect(() => {
    if (phase !== "quiz" || !level) return;
    const line = level.steps[stepIndex]?.promptSpeak;
    if (line) speak(line);
  }, [phase, stepIndex, level]);

  if (failed) {
    return (
      <OfflineState
        onRetry={() => {
          setFailed(false);
          setLocked(false);
          setLevel(null);
          setAttempt((value) => value + 1);
        }}
      />
    );
  }
  if (locked) {
    return (
      <LockedLevel
        onAd={() => void watchAd(levelId)}
        onMember={() => router.push(`/membership?from=${encodeURIComponent(`/play/${levelId}`)}`)}
        onBack={() => router.push("/courses/eng-starter")}
      />
    );
  }
  if (!level) return <LoadingScreen label="准备这一关…" />;

  const totalDots = 1 + level.steps.length;
  const activeDot = phase === "listen" ? 0 : phase === "quiz" ? stepIndex + 1 : totalDots - 1;
  const step = level.steps[stepIndex];

  function playIntro() {
    setSpeaking(speak(level!.introScript));
  }

  function choose(choiceId: string) {
    if (!step || busy || feedback === "good") return;
    const correct = step.answer === choiceId;
    if (!correct) {
      mistakes.current += 1;
      setFeedback("again");
      setShake(true);
      window.setTimeout(() => setShake(false), 360);
      return;
    }
    setFeedback("good");
    setBusy(true);
    window.setTimeout(() => {
      setFeedback(null);
      setHinted(false);
      if (stepIndex + 1 >= level!.steps.length) {
        const earned = Math.max(1, level!.rewardStars - mistakes.current);
        setStars(earned);
        const child = readChild();
        void api(`/api/progress/levels/${level!.id}/complete`, {
          method: "POST",
          body: JSON.stringify({
            childId: child?.id,
            score: Math.round((1 - Math.min(mistakes.current, 2) / 2) * 100),
            stars: earned,
            duration: Math.max(1, Math.round((Date.now() - startedAt.current) / 1000)),
            clientEventId: eventId.current,
          }),
        })
          .catch(() => undefined)
          .finally(() => {
            setBusy(false);
            setPhase("result");
          });
        return;
      }
      setBusy(false);
      setStepIndex((value) => value + 1);
    }, 700);
  }

  function nextLevel() {
    if (readStore().noAds || readStore().vip) {
      setPhase("soon");
      return;
    }
    setPhase("ad");
  }

  return (
    <div className="flex min-h-dvh flex-col px-4 pt-4 pb-6">
      <div className="flex items-center justify-between">
        <button
          type="button"
          className="grid size-11 place-items-center rounded-full bg-white shadow-sm"
          aria-label="关闭"
          onClick={() => setConfirmExit(true)}
        >
          <X />
        </button>
        <div className="flex gap-2" aria-label={`第 ${activeDot + 1} 步，共 ${totalDots} 步`}>
          {Array.from({ length: totalDots }, (_, index) => (
            <span key={index} className={cn("size-2.5 rounded-full", index <= activeDot ? "bg-primary" : "bg-muted")} />
          ))}
        </div>
        <span className="size-11" />
      </div>

      {phase === "listen" ? (
        <div className="flex flex-1 flex-col">
          <button
            type="button"
            className={cn(
              "mx-auto mt-6 grid size-20 place-items-center rounded-full bg-primary text-white",
              speaking && "speaker-live",
            )}
            onClick={playIntro}
          >
            <Volume2 className="size-8" />
            <span className="sr-only">听一听</span>
          </button>
          <p className="mt-3 text-center text-sm font-bold text-primary">听一听</p>
          <KidScene scene="hello" className="mx-auto mt-4 max-w-[280px]" />
          <p className="mt-4 text-center text-2xl font-black">Hello</p>
          <p className="mt-2 text-center text-base leading-7 text-muted-foreground">{level.introScriptZh}</p>
          <div className="mt-auto pt-6">
            <BigButton onClick={() => setPhase("quiz")}>我听完了</BigButton>
          </div>
        </div>
      ) : null}

      {phase === "quiz" && step ? (
        <div className="flex flex-1 flex-col">
          <button
            type="button"
            className="mx-auto mt-5 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 font-black shadow-sm"
            onClick={() => step.promptSpeak && setSpeaking(speak(step.promptSpeak))}
          >
            <Volume2 className="size-5 text-primary" />
            {step.promptSpeak}
          </button>
          <p className="mt-3 text-center font-bold">{step.promptText}</p>
          {feedback ? (
            <p
              className={cn(
                "mt-3 text-center text-lg font-black",
                feedback === "good" ? "text-leaf" : "text-primary",
              )}
              role="status"
            >
              {feedback === "good" ? "真棒" : "再试一次"}
            </p>
          ) : (
            <p className="mt-3 h-7" />
          )}
          <div className="mt-2 grid gap-3">
            {(step.choices ?? []).map((choice) => {
              const answerId = typeof step.answer === "string" ? step.answer : "";
              const showHint = hinted && choice.id === answerId;
              return (
                <button
                  key={choice.id}
                  type="button"
                  disabled={busy}
                  onClick={() => choose(choice.id)}
                  className={cn(
                    "flex items-center gap-3 rounded-[24px] bg-white p-2 text-left shadow-sm",
                    shake && feedback === "again" && "shake",
                    showHint && "ring-4 ring-sun",
                  )}
                >
                  <KidScene scene={choice.scene ?? "hello"} className="w-28 shrink-0" />
                  <span className="text-lg font-black">{choice.label}</span>
                </button>
              );
            })}
          </div>
          <button type="button" className="mt-4 text-sm font-bold text-muted-foreground" onClick={() => setHinted(true)}>
            提示
          </button>
        </div>
      ) : null}

      {phase === "result" ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <StarResult stars={stars} />
          <p className="mt-4 text-sm font-bold text-muted-foreground">星星×{stars}</p>
          <h1 className="mt-2 text-4xl font-black">{level.rewardCopyZh}</h1>
          <p className="mt-2 text-lg font-bold text-primary">{level.rewardCopy}</p>
          <div className="mt-8 w-full space-y-3">
            <BigButton onClick={nextLevel}>下一关</BigButton>
            <BigButton variant="secondary" href="/today">
              回今日
            </BigButton>
          </div>
        </div>
      ) : null}

      {phase === "ad" || phase === "ad-playing" ? (
        <div className="flex flex-1 flex-col justify-center text-center">
          <h1 className="text-2xl font-black">看一段小视频，解锁下一关</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {phase === "ad-playing" ? "广告播放中。这是桩，没有接入广告 SDK。" : "看完可以试试下一关。"}
          </p>
          <div className="mt-8 space-y-3">
            <BigButton
              disabled={phase === "ad-playing"}
              onClick={() => {
                setPhase("ad-playing");
                window.setTimeout(() => {
                  void watchAd("eng-starter-02").finally(() => setPhase("soon"));
                }, 1200);
              }}
            >
              看广告解锁
            </BigButton>
            <BigButton variant="secondary" href={`/membership?from=${encodeURIComponent(`/play/${levelId}`)}`}>
              开通会员免广告
            </BigButton>
            <BigButton variant="outline" onClick={() => setPhase("result")}>
              以后再说
            </BigButton>
          </div>
        </div>
      ) : null}

      {phase === "soon" ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <h1 className="text-2xl font-black">下一关还在画画</h1>
          <p className="mt-3 text-muted-foreground">Hello & Bye 可以再玩一次。</p>
          <div className="mt-8 w-full">
            <BigButton href="/today">回今日</BigButton>
          </div>
        </div>
      ) : null}

      <Dialog open={confirmExit} onOpenChange={setConfirmExit}>
        <DialogContent>
          <DialogTitle>先离开吗？</DialogTitle>
          <DialogDescription>这一关的进度会停在这里。</DialogDescription>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <BigButton variant="secondary" onClick={() => setConfirmExit(false)}>
              留下
            </BigButton>
            <BigButton href="/today">离开</BigButton>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function LockedLevel({
  onAd,
  onMember,
  onBack,
}: {
  onAd: () => void;
  onMember: () => void;
  onBack: () => void;
}) {
  const [note, setNote] = useState("");
  return (
    <div className="flex min-h-dvh flex-col justify-center px-5 text-center">
      <h1 className="text-2xl font-black">这一关还锁着</h1>
      <p className="mt-3 text-muted-foreground">{note || "看一段小视频，或开通会员。"}</p>
      <div className="mt-8 space-y-3">
        <BigButton
          onClick={() => {
            onAd();
            setNote("广告已模拟看完。这一关的内容还在制作。");
          }}
        >
          看广告解锁
        </BigButton>
        <BigButton variant="secondary" onClick={onMember}>
          开通会员免广告
        </BigButton>
        <BigButton variant="outline" onClick={onBack}>
          回课程
        </BigButton>
      </div>
    </div>
  );
}

function watchAd(targetId: string) {
  return api("/api/unlock/ad", {
    method: "POST",
    body: JSON.stringify({ levelId: targetId, adToken: "stub" }),
  }).catch(() => undefined);
}
