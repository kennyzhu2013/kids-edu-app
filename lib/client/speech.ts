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

type ToneParam = { setValueAtTime: (value: number, time: number) => void; exponentialRampToValueAtTime: (value: number, time: number) => void };
type ToneNode = { connect: (node: unknown) => void };
type Oscillator = ToneNode & { type: string; frequency: ToneParam; start: (time: number) => void; stop: (time: number) => void };
type GainNodeLike = ToneNode & { gain: ToneParam };
type ToneContext = {
  state: string;
  currentTime: number;
  destination: unknown;
  resume: () => Promise<void>;
  createOscillator: () => Oscillator;
  createGain: () => GainNodeLike;
};

/** 对错提示音。没有音频文件，设备不支持就静音。 */
export function playCue(kind: "ok" | "again") {
  if (!soundEnabled() || typeof window === "undefined") return;
  const Ctx = toneCtor();
  if (!Ctx) return;
  try {
    const ctx = sharedContext(Ctx);
    if (ctx.state === "suspended") void ctx.resume().catch(() => undefined);
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(kind === "ok" ? 640 : 196, now);
    if (kind === "ok") osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.06, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  } catch {
    // 无声设备或自动播放被拦下。
  }
}

let audioContext: ToneContext | null = null;

function toneCtor() {
  const host = globalThis as typeof globalThis & {
    AudioContext?: new () => ToneContext;
    webkitAudioContext?: new () => ToneContext;
  };
  return host.AudioContext ?? host.webkitAudioContext ?? null;
}

function sharedContext(Ctx: new () => ToneContext) {
  audioContext ??= new Ctx();
  return audioContext;
}
