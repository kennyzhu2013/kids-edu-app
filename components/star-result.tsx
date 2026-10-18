import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function StarResult({ stars, max = 3 }: { stars: number; max?: number }) {
  return (
    <div className="flex items-center justify-center gap-3" aria-label={`星星×${stars}`}>
      {Array.from({ length: max }, (_, index) => {
        const filled = index < stars;
        return (
          <Star
            key={index}
            className={cn(
              "size-14 star-pop",
              filled ? "fill-sun text-sun" : "fill-muted text-muted",
            )}
            style={{ animationDelay: `${index * 120}ms` }}
            aria-hidden
          />
        );
      })}
    </div>
  );
}
