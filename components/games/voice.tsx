"use client";

import { Volume2 } from "lucide-react";
import { playPrompt } from "@/lib/client/speech";

export function speakLine(audio?: string, speak?: string) {
  const line = speak?.trim() ?? "";
  if (!audio && !line) return;
  playPrompt(audio, line);
}

export function HearButton({
  audio,
  speak,
  label = "听一听",
}: {
  audio?: string;
  speak: string;
  label?: string;
}) {
  return (
    <button
      type="button"
      className="mx-auto inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 font-black shadow-sm"
      onClick={() => speakLine(audio, speak)}
    >
      <Volume2 className="size-5 text-primary" aria-hidden />
      {label}
    </button>
  );
}
