"use client";

import { Volume2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { KidScene, TokenArt } from "@/components/illustrations";
import { BigButton } from "@/components/big-button";
import { LoadingScreen } from "@/components/loading-screen";
import { OfflineState } from "@/components/offline-state";
import { StarResult } from "@/components/star-result";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { ApiError, api } from "@/lib/client/api";
import { readChild, useChild } from "@/lib/client/store";
import { speak, stopSpeech } from "@/lib/client/speech";
import type { LevelDocument } from "@/lib/content/schemas";
import type { AgeBand } from "@/lib/age";
import { cn } from "@/lib/utils";

type Phase = "listen" | "quiz" | "result" | "pack-done";
type Step = LevelDocument["steps"][number];

function stepsFor(level: LevelDocument, age: AgeBand) {
  const matched = level.steps.filter((step) => !step.ages || step.ages.includes(age));
  return matched.length > 0 ? matched : level.steps;
}

function answered(step: Step, choiceId: string) {
  return Array.isArray(step.answer) ? step.answer.includes(choiceId) : step.answer === choiceId;
}

export function LevelPlayer({ levelId }: { levelId: string }) {
  const router = useRouter();
  const child = useChild();
  const [level, setLevel] = useState<LevelDocument | null>(null);
  const [failed, setFailed] = useState(false);
  const [locked, setLocked] = useState(false);
  const [phase, setPhase] = useState<Phase>("listen");
  const [stepIndex, setStepIndex] = useState(0);
  const [feedback, setFeedback] = useState<"good" | "again" | null>(null);
  const [hinted, setHinted] = useState(false);
  const [missedId, setMissedId] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [busy, setBusy] = useState(false);
  const [stars, setStars] = useState(3);
  const [saveNote, setSaveNote] = useState("");
  const [confirmExit, setConfirmExit] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const mistakes = useRef(0);
  const startedAt = useRef(0);
  const eventId = useRef("");

  useEffect(() => {
    mistakes.current = 0;
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

  const age = child?.ageBand ?? "A";
  const steps = level ? stepsFor(level, age) : [];
  const step = steps[stepIndex];

  useEffect(() => {
    if (phase !== "quiz" || !step?.promptSpeak) return;
    speak(step.promptSpeak);
  }, [phase, step]);

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
        onBack={() => router.push("/courses")}
      />
    );
  }
  if (!level) return <LoadingScreen label="准备这一关…" />;
  if (steps.length === 0) {
    return <PlayerNotice title="这一关还没有题目" body="内容还是空的。回课程看看别的关。" href="/courses" action="回课程" />;
  }

  const totalDots = 1 + steps.length;
  const activeDot = phase === "listen" ? 0 : phase === "quiz" ? Math.min(stepIndex + 1, totalDots - 1) : totalDots - 1;

  function playIntro() {
    setSpeaking(speak(level!.introScript));
  }

  function finish(earned: number) {
    setStars(earned);
    const profile = readChild();
    void api(`/api/progress/levels/${level!.id}/complete`, {
      method: "POST",
      body: JSON.stringify({
        childId: profile?.id,
        score: Math.round((1 - Math.min(mistakes.current, 2) / 2) * 100),
        stars: earned,
        duration: Math.max(1, Math.round((Date.now() - startedAt.current) / 1000)),
        clientEventId: eventId.current,
      }),
    })
      .then(() => setSaveNote(""))
      .catch(() => setSaveNote("成绩没记下。可以再玩一次。"))
      .finally(() => {
        setBusy(false);
        setPhase("result");
      });
  }

  function choose(choiceId: string) {
    if (!step || busy || feedback === "good") return;
    if (!answered(step, choiceId)) {
      mistakes.current += 1;
      setFeedback("again");
      setMissedId(choiceId);
      setShake(true);
      if (mistakes.current >= 2) setHinted(true);
      window.setTimeout(() => {
        setShake(false);
        setMissedId(null);
      }, 420);
      return;
    }
    setFeedback("good");
    setBusy(true);
    window.setTimeout(() => {
      setFeedback(null);
      setHinted(false);
      setMissedId(null);
      if (stepIndex + 1 >= steps.length) {
        finish(Math.max(1, level!.rewardStars - mistakes.current));
        return;
      }
      setBusy(false);
      setStepIndex((value) => value + 1);
    }, 650);
  }

  function replay() {
    mistakes.current = 0;
    startedAt.current = Date.now();
    eventId.current = crypto.randomUUID();
    setStars(3);
    setSaveNote("");
    setStepIndex(0);
    setFeedback(null);
    setHinted(false);
    setMissedId(null);
    setPhase("listen");
  }

  function goNext() {
    if (!level?.nextLevelId) {
      setPhase("pack-done");
      return;
    }
    router.push(`/play/${level.nextLevelId}?run=${Date.now()}`);
  }

  const answerId = step && !Array.isArray(step.answer) ? step.answer : "";
  const tapChoices = step?.choices ?? [];

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
        <ProgressDots total={totalDots} active={activeDot} />
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
          <div className="mx-auto mt-4 w-full max-w-[280px]">
            {(level.listenVisual ?? "hello") === "hello" ? (
              <KidScene scene="hello" />
            ) : (
              <TokenArt token={level.listenVisual ?? "hello"} className="mx-auto" />
            )}
          </div>
          <p className="mt-4 text-center text-2xl font-black">{level.listenTitle ?? level.title}</p>
          <p className="mt-2 text-center text-base leading-7 text-muted-foreground">{level.introScriptZh}</p>
          <div className="mt-auto pt-6">
            <BigButton onClick={() => setPhase("quiz")}>我听完了</BigButton>
          </div>
        </div>
      ) : null}

      {phase === "quiz" && step?.type === "speak" ? (
        <div className="flex flex-1 flex-col">
          <button
            type="button"
            className="mx-auto mt-5 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 font-black shadow-sm"
            onClick={() => step.promptSpeak && speak(step.promptSpeak)}
          >
            <Volume2 className="size-5 text-primary" />
            {step.promptSpeak}
          </button>
          <p className="mt-3 text-center font-bold">{step.promptText}</p>
          <p className="mt-6 text-center text-3xl font-black">{step.speakText}</p>
          <p className="mt-3 text-center text-sm text-muted-foreground">跟读还没接麦克风。点下面就算说完。</p>
          <div className="mt-auto pt-6">
            <BigButton disabled={busy} onClick={() => choose(typeof step.answer === "string" ? step.answer : "spoken")}>
              我说完了
            </BigButton>
          </div>
        </div>
      ) : null}

      {phase === "quiz" && step && step.type !== "speak" && tapChoices.length === 0 ? (
        <PlayerNotice title="这道题还没有选项" body="先回课程，这道题补好了再来。" href={`/courses/${level.packId}`} action="回课程" />
      ) : null}

      {phase === "quiz" && step && step.type !== "speak" && tapChoices.length > 0 ? (
        <div className="flex flex-1 flex-col">
          <button
            type="button"
            className="mx-auto mt-5 inline-flex max-w-full items-center gap-2 rounded-full bg-white px-4 py-2 font-black shadow-sm"
            onClick={() => step.promptSpeak && speak(step.promptSpeak)}
          >
            <Volume2 className="size-5 shrink-0 text-primary" />
            <span className="truncate">{step.promptSpeak}</span>
          </button>
          <p className="mt-3 text-center font-bold">{step.promptText}</p>
          <p
            className={cn(
              "mt-3 h-7 text-center text-lg font-black",
              feedback === "good" ? "text-leaf" : "text-primary",
              !feedback && "invisible",
            )}
            role="status"
          >
            {feedback === "good" ? "真棒" : "再试一次"}
          </p>
          <div className="mt-2 grid gap-3">
            {tapChoices.map((choice) => {
              const showHint = hinted && choice.id === answerId;
              return (
                <button
                  key={choice.id}
                  type="button"
                  disabled={busy}
                  onClick={() => choose(choice.id)}
                  className={cn(
                    "flex items-center gap-3 rounded-[24px] bg-white p-2 text-left shadow-sm",
                    shake && missedId === choice.id && "shake",
                    missedId === choice.id && "ring-4 ring-primary",
                    showHint && "ring-4 ring-sun",
                  )}
                >
                  {choice.visual ? (
                    <TokenArt token={choice.visual} className="shrink-0" />
                  ) : (
                    <KidScene scene={choice.scene ?? "hello"} className="w-28 shrink-0" />
                  )}
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
          {saveNote ? <p className="mt-3 text-sm font-bold text-primary">{saveNote}</p> : null}
          <div className="mt-8 w-full space-y-3">
            {level.nextLevelId ? <BigButton onClick={goNext}>下一关</BigButton> : <BigButton onClick={goNext}>课程完成</BigButton>}
            <BigButton variant="secondary" onClick={replay}>
              再玩一次
            </BigButton>
            <BigButton variant="outline" href="/today">
              回今日
            </BigButton>
          </div>
        </div>
      ) : null}

      {phase === "pack-done" ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <StarResult stars={3} />
          <h1 className="mt-4 text-3xl font-black">这一包玩完啦</h1>
          <p className="mt-3 text-muted-foreground">五关都可以再玩。</p>
          <div className="mt-8 w-full space-y-3">
            <BigButton href={`/courses/${level.packId}`}>回课程</BigButton>
            <BigButton variant="secondary" href="/today">
              回今日
            </BigButton>
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

function ProgressDots({ total, active }: { total: number; active: number }) {
  return (
    <div className="flex items-center gap-1.5" aria-label={`第 ${active + 1} 步，共 ${total} 步`}>
      {Array.from({ length: total }, (_, index) => (
        <span
          key={index}
          className={cn(
            "rounded-full",
            index === active ? "h-2.5 w-6 bg-primary" : index < active ? "size-2.5 bg-primary" : "size-2.5 bg-muted",
          )}
        />
      ))}
    </div>
  );
}

function PlayerNotice({ title, body, href, action }: { title: string; body: string; href: string; action: string }) {
  return (
    <div className="grid min-h-dvh place-items-center px-6 text-center">
      <div>
        <h1 className="text-2xl font-black">{title}</h1>
        <p className="mt-3 text-muted-foreground">{body}</p>
        <div className="mt-8">
          <BigButton href={href}>{action}</BigButton>
        </div>
      </div>
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
      <p className="mt-3 text-muted-foreground">{note || "看一段小视频，或开通会员。广告和支付都还是桩。"}</p>
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
