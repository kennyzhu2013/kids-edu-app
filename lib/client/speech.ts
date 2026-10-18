"use client";

import { soundEnabled } from "@/lib/client/store";

export function speak(text: string) {
  if (typeof window === "undefined" || !soundEnabled() || !window.speechSynthesis) return false;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 0.86;
  window.speechSynthesis.speak(utterance);
  return true;
}

export function stopSpeech() {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
}
