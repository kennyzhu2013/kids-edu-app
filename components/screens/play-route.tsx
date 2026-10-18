"use client";

import { useParams, useSearchParams } from "next/navigation";
import { LevelPlayer } from "@/components/level-player";

export function PlayRoute() {
  const params = useParams<{ levelId: string }>();
  const search = useSearchParams();
  const levelId = String(params.levelId ?? "");
  const run = search.get("run") ?? "start";
  return <LevelPlayer key={`${levelId}-${run}`} levelId={levelId} />;
}
