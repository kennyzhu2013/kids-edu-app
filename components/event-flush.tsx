"use client";

import { useEffect } from "react";
import { flushEventQueue } from "@/lib/client/event-queue";

/** 打开页面时把上次没送出的学习事件补上。队列在写入时就已经进了 localStorage。 */
export function EventFlush() {
  useEffect(() => {
    void flushEventQueue();
    const onShow = () => {
      if (document.visibilityState === "visible") void flushEventQueue();
    };
    window.addEventListener("pageshow", onShow);
    document.addEventListener("visibilitychange", onShow);
    return () => {
      window.removeEventListener("pageshow", onShow);
      document.removeEventListener("visibilitychange", onShow);
    };
  }, []);
  return null;
}
