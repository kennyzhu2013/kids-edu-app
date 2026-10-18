"use client";

import { BookOpen, Puzzle, Sun, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/today", label: "今日", icon: Sun },
  { href: "/courses", label: "课程", icon: BookOpen },
  { href: "/games", label: "游戏", icon: Puzzle },
  { href: "/mine", label: "我的", icon: UserRound },
];

export function TabBar() {
  const pathname = usePathname();
  return (
    <nav
      className="fixed bottom-0 left-1/2 z-30 w-full max-w-[430px] -translate-x-1/2 border-t border-border bg-white/95 px-2 pt-2 backdrop-blur pb-[max(0.55rem,env(safe-area-inset-bottom))]"
      aria-label="主导航"
    >
      <ul className="grid grid-cols-4">
        {TABS.map((tab) => {
          const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          const Icon = tab.icon;
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-2xl py-1.5 text-xs font-bold",
                  active ? "text-primary" : "text-muted-foreground",
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon />
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
