"use client";

import { api } from "@/lib/client/api";
import { EVENT_QUEUE_CAP, mergeEventQueue, type StoredDeviceEvent } from "@/lib/learning/events";

const KEY = "qimeng:event-queue";

function readQueue(): StoredDeviceEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is StoredDeviceEvent => Boolean(item && typeof item === "object" && "clientEventId" in item));
  } catch {
    return [];
  }
}

function writeQueue(events: StoredDeviceEvent[]) {
  localStorage.setItem(KEY, JSON.stringify(events));
}

/** 关页前同步写入。不包含音频。下次打开再 flush。 */
export function enqueueLearningEvents(events: StoredDeviceEvent[]) {
  if (typeof window === "undefined" || events.length === 0) return;
  writeQueue(mergeEventQueue(readQueue(), events, EVENT_QUEUE_CAP));
}

function removeQueued(ids: Set<string>) {
  writeQueue(readQueue().filter((item) => !ids.has(item.clientEventId)));
}

let flushing = false;

export async function flushEventQueue() {
  if (typeof window === "undefined" || flushing) return;
  flushing = true;
  try {
    for (;;) {
      const batch = readQueue().slice(0, 40);
      if (batch.length === 0) return;
      await api("/api/events", { method: "POST", body: JSON.stringify({ events: batch }) });
      removeQueued(new Set(batch.map((item) => item.clientEventId)));
    }
  } catch {
    // 留在本地，下次打开再补。
  } finally {
    flushing = false;
  }
}
