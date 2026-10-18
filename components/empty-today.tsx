import Link from "next/link";
import { LogoMark } from "@/components/illustrations";
import { Button } from "@/components/ui/button";

export function EmptyToday() {
  return (
    <div className="px-5 pt-16 text-center">
      <LogoMark className="mx-auto" />
      <h1 className="mt-6 text-2xl font-black">今天任务稍后就来</h1>
      <p className="mt-2 text-muted-foreground">先去课程馆看看</p>
      <div className="mt-8 grid gap-3">
        <Button asChild size="lg">
          <Link href="/courses">去课程馆</Link>
        </Button>
        <Button asChild size="lg" variant="secondary">
          <Link href="/games">去游戏乐园</Link>
        </Button>
      </div>
    </div>
  );
}
