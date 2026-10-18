"use client";

import { useEffect } from "react";

type NativeWindow = Window & {
  Capacitor?: {
    isNativePlatform?: () => boolean;
    Plugins?: {
      App?: {
        addListener?: (event: "backButton", handler: () => void) => { remove?: () => void } | void;
      };
    };
  };
};

/** Web 上什么都不做。进了 Capacitor WebView 之后，Android 返回走网页历史。 */
export function NativeShell() {
  useEffect(() => {
    const capacitor = (window as NativeWindow).Capacitor;
    if (!capacitor?.isNativePlatform?.()) return;
    const handle = capacitor.Plugins?.App?.addListener?.("backButton", () => {
      if (window.history.length > 1) window.history.back();
    });
    return () => {
      if (handle && typeof handle === "object" && handle.remove) handle.remove();
    };
  }, []);
  return null;
}
