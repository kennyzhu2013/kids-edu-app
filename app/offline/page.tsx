"use client";

import { useRouter } from "next/navigation";
import { OfflineState } from "@/components/offline-state";

export default function Page() {
  const router = useRouter();
  return <OfflineState onRetry={() => router.push("/today")} />;
}
