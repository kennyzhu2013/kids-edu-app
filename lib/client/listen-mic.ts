"use client";

type RecognitionResult = { 0: { transcript: string }; isFinal?: boolean };
type RecognitionEvent = { results: ArrayLike<RecognitionResult> };
type RecognitionError = { error: string };

type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: ((event: RecognitionError) => void) | null;
  onend: (() => void) | null;
};

type RecognitionWindow = Window & {
  SpeechRecognition?: new () => Recognition;
  webkitSpeechRecognition?: new () => Recognition;
};

export function canListen() {
  if (typeof window === "undefined") return false;
  const host = window as RecognitionWindow;
  return Boolean(host.SpeechRecognition || host.webkitSpeechRecognition);
}

export function listenForSpeech(lang: string, timeoutMs = 7000) {
  const host = window as RecognitionWindow;
  const Ctor = host.SpeechRecognition || host.webkitSpeechRecognition;
  if (!Ctor) return Promise.resolve({ ok: false as const, reason: "unavailable" as const });
  return new Promise<{ ok: true; text: string } | { ok: false; reason: "denied" | "unavailable" | "empty" }>((resolve) => {
    const recognition = new Ctor();
    let settled = false;
    let transcript = "";
    const finish = (result: { ok: true; text: string } | { ok: false; reason: "denied" | "unavailable" | "empty" }) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      try {
        recognition.abort();
      } catch {
        // 有的浏览器在 stop 之后再 abort 会抛错。
      }
      resolve(result);
    };
    const timer = window.setTimeout(() => finish(transcript ? { ok: true, text: transcript } : { ok: false, reason: "empty" }), timeoutMs);
    recognition.lang = lang;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.onresult = (event) => {
      transcript = Array.from(event.results)
        .map((item) => item[0]?.transcript ?? "")
        .join(" ")
        .trim();
      const last = event.results[event.results.length - 1];
      if (last?.isFinal && transcript) finish({ ok: true, text: transcript });
    };
    recognition.onerror = (event) => {
      if (event.error === "not-allowed" || event.error === "service-not-allowed") finish({ ok: false, reason: "denied" });
      else if (event.error === "no-speech" || event.error === "aborted") finish(transcript ? { ok: true, text: transcript } : { ok: false, reason: "empty" });
      else finish({ ok: false, reason: "unavailable" });
    };
    recognition.onend = () => {
      if (!settled) finish(transcript ? { ok: true, text: transcript } : { ok: false, reason: "empty" });
    };
    try {
      recognition.start();
    } catch {
      finish({ ok: false, reason: "unavailable" });
    }
  });
}
