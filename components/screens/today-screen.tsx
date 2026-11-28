"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Buddy } from "@/components/buddy";
import { GuardianConsentNotice } from "@/components/guardian-consent";
import { EmptyToday } from "@/components/empty-today";
import { LockBadge } from "@/components/lock-badge";
import { LoadingScreen } from "@/components/loading-screen";
import { OfflineState } from "@/components/offline-state";
import { Screen } from "@/components/screen";
import { BigButton } from "@/components/big-button";
import { ApiError, api, failureKind, type FailureKind } from "@/lib/client/api";
import { readChild, useChild } from "@/lib/client/store";
import { cn } from "@/lib/utils";

type TodayPayload = {
  streakDays: number;
  continueLevel: {
    id: string;
    title: string;
    minutes: number;
    status: "todo" | "done";
    subject: string;
    progress: number;
  } | null;
  tasks: Array<{
    id: string;
    title: string;
    minutes: number;
    subject?: string;
    status: "todo" | "done" | "locked";
    href: string;
    kind?: "review" | "level" | "game";
    label?: "复习" | "新课" | "再练" | "游戏";
    knowledgePointId?: string | null;
  }>;
};

export function TodayScreen() {
  const router = useRouter();
  const child = useChild();
  const [attempt, setAttempt] = useState(0);
  const [data, setData] = useState<TodayPayload | null>(null);
  const [problem, setProblem] = useState<{ childId: string; kind: FailureKind } | null>(null);
  const [needsConsent, setNeedsConsent] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [consentNote, setConsentNote] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!readChild()) router.replace("/onboarding/age");
    }, 0);
    return () => window.clearTimeout(timer);
  }, [child, router]);

  useEffect(() => {
    if (!child) return;
    let ignore = false;
    const childId = child.id;
    api<TodayPayload>(`/api/today?childId=${encodeURIComponent(childId)}`)
      .then((payload) => {
        if (ignore) return;
        setData(payload);
        setProblem((current) => (current?.childId === childId ? null : current));
      })
      .catch((error: unknown) => {
        if (ignore) return;
        if (error instanceof ApiError && error.code === "CONSENT_REQUIRED") {
          setNeedsConsent(true);
          setProblem((current) => (current?.childId === childId ? null : current));
          return;
        }
        setNeedsConsent(false);
        setProblem({ childId, kind: failureKind(error) });
      });
    return () => {
      ignore = true;
    };
  }, [attempt, child]);

  if (!child) return <LoadingScreen />;
  if (needsConsent) {
    return (
      <Screen tabs>
        <div className="px-5 pt-8">
          <GuardianConsentNotice checked={accepted} onChange={setAccepted} />
          {consentNote ? <p className="mt-3 text-sm font-bold text-primary">{consentNote}</p> : null}
          <BigButton
            className="mt-4"
            disabled={!accepted}
            onClick={() => {
              void api("/api/guardian-consent", {
                method: "PATCH",
                body: JSON.stringify({ accepted: true }),
              })
                .then(() => {
                  setNeedsConsent(false);
                  setConsentNote("");
                  setAttempt((value) => value + 1);
                })
                .catch(() => setConsentNote("同意没记下，可以再试一次。"));
            }}
          >
            同意并进入今日
          </BigButton>
        </div>
      </Screen>
    );
  }
  const kind = problem?.childId === child.id ? problem.kind : null;
  if (kind) {
    return (
      <OfflineState
        tabs
        kind={kind}
        title={kind === "missing" ? "还没有今日任务" : undefined}
        onRetry={() => {
          setProblem(null);
          setAttempt((value) => value + 1);
        }}
      />
    );
  }
  if (!data) return <LoadingScreen />;
  if (data.tasks.length === 0) {
    return (
      <Screen tabs>
        <EmptyToday />
      </Screen>
    );
  }

  const current = data.continueLevel;
  const done = current?.status === "done";
  const progress = Math.round((current?.progress ?? 0) * 100);
  return (
    <Screen tabs>
      <div className="px-5 pt-8">
        <div className="flex items-center gap-3">
          <Buddy pose="idle" className="size-20 shrink-0" />
          <div>
            <h1 className="text-3xl font-black">嗨，{child.nickname}</h1>
            <p className="mt-1 font-bold text-muted-foreground">小芽陪你，已连学 {data.streakDays} 天</p>
          </div>
        </div>
        {current ? (
          <section className="mt-6 rounded-[28px] bg-white p-5 shadow-sm">
            <h2 className="text-2xl font-black">{done ? "再玩：" : "继续："}{current.title}</h2>
            <p className="mt-1 text-sm font-bold text-muted-foreground">
              {current.subject} · 约{current.minutes}分钟
            </p>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted" aria-hidden>
              <div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
            </div>
            <BigButton className="mt-4" onClick={() => router.push(`/play/${current.id}?run=${Date.now()}`)}>
              {done ? "再玩一次" : "开始挑战"}
            </BigButton>
          </section>
        ) : null}
        <h2 className="mt-8 text-lg font-black">今日任务</h2>
        <ul className="mt-3 grid gap-3">
          {data.tasks.map((task) => (
            <li key={`${task.kind ?? "level"}-${task.id}-${task.knowledgePointId ?? ""}`}>
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-[22px] bg-white p-3 text-left shadow-sm"
                onClick={() => {
                  if (task.status === "locked") router.push(task.href);
                  else if (task.href.startsWith("/play")) router.push(`${task.href}?run=${Date.now()}`);
                  else router.push(task.href);
                }}
              >
                <span className="grid size-12 place-items-center rounded-2xl bg-accent text-lg font-black text-primary">
                  {task.label === "复习" ? "复" : task.title.slice(0, 1)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-black">
                    {task.label ? <span className="mr-2 text-primary">{task.label}</span> : null}
                    {task.title}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {task.subject ? `${task.subject} · ` : ""}约{task.minutes}分钟
                  </span>
                </span>
                {task.status === "locked" ? (
                  <LockBadge />
                ) : (
                  <span className={cn("text-sm font-black", task.status === "done" ? "text-leaf" : "text-muted-foreground")}>
                    {task.status === "done" ? "完成" : "还没玩"}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </Screen>
  );
}
