import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 96 96" className={cn("size-24", className)} aria-hidden>
      <rect width="96" height="96" rx="32" fill="#ff6b4a" />
      <path
        d="M48 74c-14-9-20-18-20-28 0-10 8-18 18-18 4 0 7 1.5 9 4 2-2.5 5-4 9-4 10 0 18 8 18 18 0 10-6 19-20 28z"
        fill="#fff8ef"
      />
      <circle cx="49" cy="44" r="5" fill="#ff6b4a" />
    </svg>
  );
}

export function KidScene({
  scene,
  className,
}: {
  scene: "hello" | "bye" | "sit";
  className?: string;
}) {
  const shirt = scene === "hello" ? "#ff6b4a" : scene === "bye" ? "#3d94f5" : "#1fa97a";
  return (
    <svg viewBox="0 0 220 168" className={cn("w-full", className)} aria-hidden>
      <rect width="220" height="168" rx="32" fill="#fff3da" />
      {scene === "hello" ? (
        <g>
          <circle cx="184" cy="36" r="16" fill="#ffc44d" />
          <path d="M168 78c18 8 34 8 48 0" stroke="#f0c27a" strokeWidth="4" fill="none" />
        </g>
      ) : null}
      {scene === "bye" ? (
        <g>
          <rect x="156" y="36" width="42" height="92" rx="8" fill="#f3d2b0" />
          <circle cx="188" cy="84" r="3" fill="#c9895a" />
          <path d="M28 132h150" stroke="#e7c9a4" strokeWidth="6" strokeLinecap="round" />
        </g>
      ) : null}
      {scene === "sit" ? <ellipse cx="110" cy="128" rx="58" ry="14" fill="#f0c27a" /> : null}
      <g transform={scene === "sit" ? "translate(38 18)" : "translate(48 22)"}>
        <circle cx="48" cy="28" r="22" fill="#ffd7bf" />
        <path d="M28 22c4-12 36-12 42 2-8-6-30-8-42-2z" fill="#6b4638" />
        <circle cx="40" cy="30" r="2.4" fill="#3b2a24" />
        <circle cx="56" cy="30" r="2.4" fill="#3b2a24" />
        <path d="M42 40c4 4 10 4 14 0" stroke="#e07a62" strokeWidth="2.4" fill="none" strokeLinecap="round" />
        <rect x="28" y="54" width="42" height="46" rx="16" fill={shirt} />
        {scene === "hello" ? (
          <g>
            <path d="M70 62c16-18 28-16 34-4" stroke="#ffd7bf" strokeWidth="8" strokeLinecap="round" />
            <circle cx="104" cy="52" r="8" fill="#ffd7bf" />
          </g>
        ) : null}
        {scene === "bye" ? (
          <g>
            <path d="M18 70c-12 6-16 16-12 24" stroke="#ffd7bf" strokeWidth="8" strokeLinecap="round" />
            <circle cx="8" cy="96" r="7" fill="#ffd7bf" />
            <path d="M74 64c10-8 16-6 18 2" stroke="#ffd7bf" strokeWidth="7" strokeLinecap="round" />
          </g>
        ) : null}
        {scene === "sit" ? (
          <g>
            <rect x="34" y="78" width="34" height="22" rx="4" fill="#fff" stroke="#ff6b4a" strokeWidth="3" />
            <path d="M40 84h22M40 90h16" stroke="#ffb199" strokeWidth="2" />
          </g>
        ) : null}
      </g>
    </svg>
  );
}

export function OfflineCloud({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 120" className={cn("w-40", className)} aria-hidden>
      <ellipse cx="80" cy="104" rx="46" ry="8" fill="#f0dcc8" />
      <path
        d="M48 78c-14 0-22-10-20-22 2-14 16-20 28-16 4-14 22-22 36-16 12 4 18 16 16 28 12 2 18 12 14 24-4 10-16 12-28 8H52c-2 0-3-4-4-6z"
        fill="#fff"
        stroke="#f0dcc8"
        strokeWidth="3"
      />
      <path d="M70 58l20 28M90 58L70 86" stroke="#ff6b4a" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}
