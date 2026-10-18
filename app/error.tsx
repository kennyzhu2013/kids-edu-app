"use client";

import { OfflineState } from "@/components/offline-state";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return <OfflineState onRetry={reset} />;
}
