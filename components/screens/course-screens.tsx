"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BackLink, Screen } from "@/components/screen";
import { BigButton } from "@/components/big-button";
import { LoadingScreen } from "@/components/loading-screen";
import { LockBadge } from "@/components/lock-badge";
import { OfflineState } from "@/components/offline-state";
import { ageLabel } from "@/lib/age";
import { api } from "@/lib/client/api";
import { useChild } from "@/lib/client/store";
import { cn } from "@/lib/utils";

type Subject = { id: string; tab: string };
type Pack = {
  id: string;
  subjectId: string;
  title: string;
  summary: string;
  levelCount: number;
  access: "trial" | "locked" | "owned";
  accent: string;
};

const ACCESS_LABEL = { trial: "试玩", owned: "已购", locked: "锁" } as const;

export function CoursesScreen() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [packs, setPacks] = useState<Pack[]>([]);
  const [subjectId, setSubjectId] = useState("eng");
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const child = useChild();

  useEffect(() => {
    let ignore = false;
    Promise.all([
      api<{ subjects: Subject[] }>("/api/subjects"),
      api<{ packs: Pack[] }>("/api/packs"),
    ])
      .then(([subjectData, packData]) => {
        if (ignore) return;
        setSubjects(subjectData.subjects);
        setPacks(packData.packs);
      })
      .catch(() => {
        if (!ignore) setFailed(true);
      });
    return () => {
      ignore = true;
    };
  }, [attempt]);

  if (failed) {
    return (
      <OfflineState
        onRetry={() => {
          setFailed(false);
          setAttempt((value) => value + 1);
        }}
      />
    );
  }
  if (subjects.length === 0) return <LoadingScreen />;
  const visible = packs.filter((pack) => pack.subjectId === subjectId);

  return (
    <Screen tabs>
      <div className="px-5 pt-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-black">课程馆</h1>
          <span className="rounded-full bg-white px-3 py-1 text-sm font-black shadow-sm">
            {child ? ageLabel(child.ageBand) : "3–6岁"}
          </span>
        </div>
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {subjects.map((subject) => (
            <button
              key={subject.id}
              type="button"
              onClick={() => setSubjectId(subject.id)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-black",
                subjectId === subject.id ? "bg-primary text-white" : "bg-white text-foreground",
              )}
            >
              {subject.tab}
            </button>
          ))}
        </div>
        <ul className="mt-4 grid gap-3">
          {visible.map((pack) => (
            <li key={pack.id}>
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-[24px] bg-white p-3 text-left shadow-sm"
                onClick={() => router.push(`/courses/${pack.id}`)}
              >
                <span className="grid size-16 place-items-center rounded-[20px] text-lg font-black text-white" style={{ background: pack.accent }}>
                  {pack.levelCount}关
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-black">{pack.title}</span>
                  <span className="mt-1 block text-sm text-muted-foreground">{pack.summary}</span>
                </span>
                {pack.access === "locked" ? <LockBadge /> : <span className="text-sm font-black text-primary">{ACCESS_LABEL[pack.access]}</span>}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </Screen>
  );
}

export function PackScreen() {
  const params = useParams<{ packId: string }>();
  const router = useRouter();
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [data, setData] = useState<{
    pack: Pack;
    levels: Array<{
      id: string;
      order: number;
      title: string;
      playable: boolean;
      locked: boolean;
      minutes: number;
      status?: "todo" | "done";
    }>;
  } | null>(null);
  const child = useChild();

  useEffect(() => {
    let ignore = false;
    const query = child ? `?childId=${encodeURIComponent(child.id)}` : "";
    api<NonNullable<typeof data>>(`/api/packs/${params.packId}${query}`)
      .then((payload) => {
        if (!ignore) setData(payload);
      })
      .catch(() => {
        if (!ignore) setFailed(true);
      });
    return () => {
      ignore = true;
    };
  }, [attempt, child, params.packId]);

  if (failed) {
    return (
      <OfflineState
        onRetry={() => {
          setFailed(false);
          setData(null);
          setAttempt((value) => value + 1);
        }}
      />
    );
  }
  if (!data) return <LoadingScreen />;

  return (
    <Screen className="flex min-h-dvh flex-col">
      <div className="px-4 pt-4">
        <BackLink href="/courses" />
        <h1 className="mt-4 text-2xl font-black">{data.pack.title}</h1>
        <p className="mt-2 text-muted-foreground">{data.pack.summary}</p>
      </div>
      {data.levels.length === 0 ? (
        <p className="mt-8 px-4 text-center font-bold text-muted-foreground">这一包还没有关卡。</p>
      ) : null}
      <ul className="mt-4 grid gap-2 px-4">
        {data.levels.map((level) => (
          <li key={level.id}>
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-[20px] bg-white px-4 py-3 text-left shadow-sm"
              onClick={() => router.push(level.playable ? `/play/${level.id}?run=${Date.now()}` : `/play/${level.id}`)}
            >
              <span className="grid size-9 place-items-center rounded-full bg-accent font-black">{level.order}</span>
              <span className="flex-1 font-black">{level.title}</span>
              {level.playable ? (
                <span className={cn("text-sm font-black", level.status === "done" ? "text-leaf" : "text-primary")}>
                  {level.status === "done" ? "再玩" : "开始"}
                </span>
              ) : (
                <LockBadge />
              )}
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-auto px-4 pt-6 pb-6">
        <BigButton href={`/membership?from=${encodeURIComponent(`/courses/${data.pack.id}`)}`}>购买本包</BigButton>
      </div>
    </Screen>
  );
}
