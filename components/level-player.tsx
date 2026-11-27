"use client";

import { Volume2, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Buddy } from "@/components/buddy";
import { DragBoard, SortBoard, SpeakBoard } from "@/components/level-boards";
import { KidScene, TokenArt } from "@/components/illustrations";
import { BigButton } from "@/components/big-button";
import { LoadingScreen } from "@/components/loading-screen";
import { OfflineState } from "@/components/offline-state";
import { StarResult } from "@/components/star-result";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { ApiError, api, failureKind, type FailureKind } from "@/lib/client/api";
import { readChild, useChild } from "@/lib/client/store";
import { playCue, playPrompt, playPromptAsync, stopSpeech, voiceCaption } from "@/lib/client/speech";
import { stepsForAge } from "@/lib/content/level-steps";
import type { StepAttempt } from "@/lib/content/score-math";
import type { LevelDocument } from "@/lib/content/schemas";
import { cn } from "@/lib/utils";

type Phase = "listen" | "quiz" | "result" | "pack-done";
type Step = LevelDocument["steps"][number];

function answered(step: Step, choiceId: string) {
  return Array.isArray(step.answer) ? step.answer.includes(choiceId) : step.answer === choiceId;
}

export function LevelPlayer({ levelId }: { levelId: string }) {
  const router = useRouter();
  const child = useChild();
  const [level, setLevel] = useState<LevelDocument | null>(null);
  const [problem, setProblem] = useState<FailureKind | null>(null);
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
  const [voiceNote, setVoiceNote] = useState("");
  const [attempt, setAttempt] = useState(0);
  const advancing = useRef(false);
  const mistakes = useRef(0);
  const attempts = useRef<StepAttempt[]>([]);
  const startedAt = useRef(0);
  const eventId = useRef("");

  useEffect(() => {
    mistakes.current = 0;
    attempts.current = [];
    startedAt.current = Date.now();
    eventId.current = crypto.randomUUID();
    let ignore = false;
    api<{ level: LevelDocument }>(`/api/levels/${levelId}`)
      .then((data) => {
        if (ignore) return;
        setLevel(data.level);
        setProblem(null);
      })
      .catch((error: unknown) => {
        if (ignore) return;
        if (error instanceof ApiError && error.code === "LOCKED") setLocked(true);
        else setProblem(failureKind(error));
      });
    return () => {
      ignore = true;
      stopSpeech();
    };
  }, [attempt, levelId]);

  const age = child?.ageBand ?? "A";
  const steps = level ? stepsForAge(level, age) : [];
  const step = steps[stepIndex];

  useEffect(() => {
    if (phase !== "quiz" || !step?.promptSpeak) return;
    playPrompt(step.promptAudio, step.promptSpeak);
  }, [phase, step]);

  if (problem) {
    return (
      <OfflineState
        kind={problem}
        title={problem === "missing" ? "找不到这一关" : undefined}
        backHref="/courses"
        backLabel="回课程馆"
        onRetry={() => {
          setProblem(null);
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

  async function playIntro() {
    setSpeaking(true);
    const result = await playPromptAsync(level!.audioIntro, level!.introScript);
    setSpeaking(false);
    setVoiceNote(voiceCaption(result));
  }

  function record(attempt: StepAttempt) {
    attempts.current = [...attempts.current.filter((item) => item.id !== attempt.id), attempt];
  }

  function finish(earned: number) {
    setStars(earned);
    const profile = readChild();
    const payload: Record<string, unknown> = {
      childId: profile?.id,
      score: Math.round((1 - Math.min(mistakes.current, 2) / 2) * 100),
      stars: earned,
      duration: Math.max(1, Math.round((Date.now() - startedAt.current) / 1000)), // eslint-disable-line react-hooks/purity -- 只在答完一关时计算用时
      clientEventId: eventId.current,
    };
    if (level!.packId === "math-starter") payload.steps = attempts.current;
    void api<{ rewards?: { stars?: number } }>(`/api/progress/levels/${level!.id}/complete`, {
      method: "POST",
      body: JSON.stringify(payload),
    })
      .then((data) => {
        if (typeof data.rewards?.stars === "number") setStars(data.rewards.stars);
        setSaveNote("");
      })
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
      playCue("again");
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
    playCue("ok");
    record({ id: step.id, choice: choiceId });
    succeed();
  }

  function miss() {
    mistakes.current += 1;
    setFeedback("again");
    if (mistakes.current >= 2) {
      setHinted(true);
      if (step?.type === "speak") {
        playPrompt(step.promptAudio, step.speakText || step.promptSpeak || "");
        const stepId = step.id;
        window.setTimeout(() => {
          record({ id: stepId, speak: "said_wrong" });
          succeed();
        }, 900);
      }
    }
  }

  function succeed() {
    if (advancing.current || busy) return;
    advancing.current = true;
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
      advancing.current = false;
      setBusy(false);
      setStepIndex((value) => value + 1);
    }, 650);
  }

  function replay() {
    mistakes.current = 0;
    attempts.current = [];
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
          <Buddy pose={speaking ? "listen" : "idle"} className="mx-auto mt-4 size-28" />
          <button
            type="button"
            className={cn(
              "mx-auto mt-4 grid size-20 place-items-center rounded-full bg-primary text-white",
              speaking && "speaker-live",
            )}
            onClick={playIntro}
          >
            <Volume2 className="size-8" />
            <span className="sr-only">听一听</span>
          </button>
          <p className="mt-3 text-center text-sm font-bold text-primary">听一听</p>
          {voiceNote ? <p className="mt-1 text-center text-sm font-bold text-muted-foreground">{voiceNote}</p> : null}
          <div className="mx-auto mt-4 w-full max-w-[280px]">
            {(level.listenVisual ?? "/art/listen-hello.svg").startsWith("/") ||
            (level.listenVisual ?? "").startsWith("http") ? (
              <Image src={level.listenVisual ?? "/art/listen-hello.svg"} alt="" width={280} height={168} unoptimized className="mx-auto h-auto w-full" />
            ) : (level.listenVisual ?? "hello") === "hello" ? (
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
        <SpeakBoard
          step={step}
          busy={busy}
          hinted={hinted}
          onPass={(result) => {
            record({ id: step.id, speak: result });
            succeed();
          }}
          onMiss={() => miss()}
        />
      ) : null}

      {phase === "quiz" && step?.type === "drag" ? (
        <DragBoard
          step={step}
          busy={busy}
          hinted={hinted}
          onPass={(placements) => {
            record({ id: step.id, placements });
            succeed();
          }}
          onMiss={() => miss()}
        />
      ) : null}

      {phase === "quiz" && step?.type === "sort" ? (
        <SortBoard
          step={step}
          busy={busy}
          hinted={hinted}
          onPass={(order) => {
            record({ id: step.id, order });
            succeed();
          }}
          onMiss={() => miss()}
        />
      ) : null}

      {phase === "quiz" && step && (step.type === "tap" || step.type === "count-tap") && tapChoices.length === 0 ? (
        <PlayerNotice title="这道题还没有选项" body="先回课程，这道题补好了再来。" href={`/courses/${level.packId}`} action="回课程" />
      ) : null}

      {phase === "quiz" && step && (step.type === "tap" || step.type === "count-tap") && tapChoices.length > 0 ? (
        <div className="flex flex-1 flex-col">
          <button
            type="button"
            className="mx-auto mt-5 inline-flex max-w-full items-center gap-2 rounded-full bg-white px-4 py-2 font-black shadow-sm"
            onClick={() => {
              const result = playPrompt(step.promptAudio, step.promptSpeak ?? "");
              setVoiceNote(voiceCaption(result));
            }}
          >
            <Volume2 className="size-5 shrink-0 text-primary" />
            <span className="truncate">{step.promptSpeak}</span>
          </button>
          {voiceNote ? <p className="mt-2 text-center text-sm text-muted-foreground">{voiceNote}</p> : null}
          <p className="mt-3 text-center font-bold">{step.promptText}</p>
          <p
            className={cn(
              "mt-3 flex h-16 items-center justify-center gap-2 text-lg font-black",
              feedback === "good" ? "text-leaf" : "text-primary",
              !feedback && "invisible",
            )}
            role="status"
          >
            {feedback ? <Buddy pose={feedback === "good" ? "happy" : "comfort"} className="size-14" /> : null}
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
                    <Image
                      src={`/art/scene-${choice.scene ?? "hello"}.svg`}
                      alt=""
                      width={112}
                      height={64}
                      unoptimized
                      className="h-16 w-28 shrink-0 object-contain"
                    />
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
          <Buddy pose="happy" className="size-28" />
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
          <Buddy pose="happy" className="size-28" />
          <StarResult stars={3} />
          <h1 className="mt-4 text-3xl font-black">这一包玩完啦</h1>
          <p className="mt-3 text-muted-foreground">这一包的关卡都可以再玩。</p>
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
