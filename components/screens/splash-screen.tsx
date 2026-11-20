"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Buddy } from "@/components/buddy";
import { readChild } from "@/lib/client/store";

export function SplashScreen() {
  const router = useRouter();
  useEffect(() => {
    const timer = window.setTimeout(() => {
      router.replace(readChild() ? "/today" : "/onboarding/age");
    }, 900);
    return () => window.clearTimeout(timer);
  }, [router]);

  return (
    <div className="grid min-h-dvh place-items-center px-6 text-center">
      <div>
        <Buddy pose="idle" className="mx-auto size-32" />
        <p className="mt-8 text-sm font-bold tracking-wide text-muted-foreground">综合启蒙 · 3–6岁</p>
      </div>
    </div>
  );
}
