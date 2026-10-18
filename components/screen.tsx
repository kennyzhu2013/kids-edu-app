import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { TabBar } from "@/components/tab-bar";
import { cn } from "@/lib/utils";

export function Screen({
  tabs = false,
  children,
  className,
}: {
  tabs?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-h-dvh", tabs && "pb-24", className)}>
      {children}
      {tabs ? <TabBar /> : null}
    </div>
  );
}

export function BackLink({ href, label = "返回" }: { href: string; label?: string }) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="grid size-11 place-items-center rounded-full bg-white text-foreground shadow-sm"
    >
      <ChevronLeft />
    </Link>
  );
}
