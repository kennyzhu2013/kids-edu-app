"use client";

import { soundEnabled } from "@/lib/client/store";

export type SpeakResult = "played" | "muted" | "unavailable";

const CJK = /[\u4e00-\u9fff]/;

export function voiceLang(text: string) {
  return CJK.test(text) ? "zh-CN" : "en-US";
}

export function voiceCaption(result: SpeakResult) {
  if (result === "muted") return "朗读关着，看下面的字就行。";
  if (result === "unavailable") return "这台设备读不出来，看下面的字就行。";
  return "";
}

function isPlayableUrl(asset: string) {
  return asset.startsWith("https://") || asset.startsWith("http://") || asset.startsWith("/");
}

let activeAudio: HTMLAudioElement | null = null;

export function stopSpeech() {
  activeAudio?.pause();
  activeAudio = null;
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  try {
    window.speechSynthesis.cancel();
  } catch {
    // 部分 WebView 没有语音引擎。
  }
}

function speakAsync(text: string): Promise<SpeakResult> {
  const line = text.trim();
  if (!line) return Promise.resolve("unavailable");
  if (!soundEnabled()) return Promise.resolve("muted");
  if (typeof window === "undefined" || !window.speechSynthesis) return Promise.resolve("unavailable");
  return new Promise((resolve) => {
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(line);
      utterance.lang = voiceLang(line);
      utterance.rate = utterance.lang === "zh-CN" ? 0.92 : 0.86;
      utterance.onend = () => resolve("played");
      utterance.onerror = () => resolve("unavailable");
      window.speechSynthesis.speak(utterance);
    } catch {
      resolve("unavailable");
    }
  });
}

function startPrompt(asset: string | undefined, fallback: string) {
  stopSpeech();
  if (!soundEnabled()) {
    return { immediate: "muted" as const, done: Promise.resolve("muted" as const) };
  }
  if (asset && isPlayableUrl(asset)) {
    let resolveDone: (result: SpeakResult) => void = () => undefined;
    const done = new Promise<SpeakResult>((resolve) => {
      resolveDone = resolve;
    });
    try {
      const audio = new Audio(asset);
      activeAudio = audio;
      let settled = false;
      const finish = (result: SpeakResult) => {
        if (settled) return;
        settled = true;
        if (activeAudio === audio) activeAudio = null;
        resolveDone(result);
      };
      audio.onended = () => finish("played");
      audio.onerror = () => {
        void speakAsync(fallback).then(finish);
      };
      void audio.play().catch(() => {
        void speakAsync(fallback).then(finish);
      });
      return { immediate: "played" as const, done };
    } catch {
      const spoken = speakAsync(fallback);
      return { immediate: "unavailable" as const, done: spoken };
    }
  }
  const spoken = speakAsync(fallback);
  return { immediate: "played" as const, done: spoken };
}

/** 有 http(s) 或站内地址才播文件。`asset:` 只是占位，没有媒体时改走朗读。 */
export function playPrompt(asset: string | undefined, fallback: string): SpeakResult {
  return startPrompt(asset, fallback).immediate;
}

export function playPromptAsync(asset: string | undefined, fallback: string) {
  return startPrompt(asset, fallback).done;
}

export function speak(text: string): SpeakResult {
  void speakAsync(text);
  const line = text.trim();
  if (!line) return "unavailable";
  if (!soundEnabled()) return "muted";
  if (typeof window === "undefined" || !window.speechSynthesis) return "unavailable";
  return "played";
}

const CUE_SRC = {
  ok: "/audio/sfx/ok.mp3",
  again: "/audio/sfx/again.mp3",
} as const;

let cueAudio: HTMLAudioElement | null = null;

/** 对错提示音。播放原创的木琴和轻轻的「再试试」，不再用正弦波哔声。 */
export function playCue(kind: "ok" | "again") {
  if (!soundEnabled() || typeof window === "undefined") return;
  try {
    cueAudio?.pause();
    const audio = new Audio(CUE_SRC[kind]);
    cueAudio = audio;
    audio.volume = 0.9;
    void audio.play().catch(() => undefined);
  } catch {
    // 无声设备或自动播放被拦下。
  }
}
