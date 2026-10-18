import { Lock } from "lucide-react";

export function LockBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-xs font-bold text-muted-foreground">
      <Lock className="size-3.5" />
      锁
    </span>
  );
}
