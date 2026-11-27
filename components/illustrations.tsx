import Image from "next/image";
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
  return (
    <Image
      src={`/art/scene-${scene}.svg`}
      alt=""
      width={160}
      height={112}
      unoptimized
      className={cn("h-auto w-full", className)}
    />
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

const BALLS: Record<string, string> = {
  "ball-red": "#ff5a5a",
  "ball-yellow": "#ffc83d",
  "ball-blue": "#4aa3ff",
  "ball-green": "#3dcb7a",
  "apple-red": "#ff5a5a",
  "apple-yellow": "#ffc83d",
};

export function TokenArt({ token, className }: { token: string; className?: string }) {
  if (token.startsWith("/") || token.startsWith("http://") || token.startsWith("https://")) {
    return <Image src={token} alt="" width={88} height={88} unoptimized className={cn("size-16 object-contain", className)} />;
  }
  if (token.startsWith("ball-") || token.startsWith("apple-")) {
    const fill = BALLS[token] ?? "#ff8a5b";
    const apple = token.startsWith("apple-");
    return (
      <svg viewBox="0 0 88 88" className={cn("size-16", className)} aria-hidden>
        <rect width="88" height="88" rx="24" fill="#fff3da" />
        <circle cx="44" cy={apple ? 50 : 46} r="22" fill={fill} />
        {apple ? <path d="M44 28c6-8 14-8 16-2-8 0-12 4-16 2z" fill="#3dcb7a" /> : null}
      </svg>
    );
  }
  if (token.startsWith("number-")) {
    return (
      <svg viewBox="0 0 88 88" className={cn("size-16", className)} aria-hidden>
        <rect width="88" height="88" rx="24" fill="#fff3da" />
        <text x="44" y="58" textAnchor="middle" fontSize="40" fontWeight="800" fill="#ff6b4a">
          {token.slice("number-".length)}
        </text>
      </svg>
    );
  }
  const count = /^(apples|stars)-(\d)$/.exec(token);
  if (count) {
    const total = Number(count[2]);
    const star = count[1] === "stars";
    return (
      <svg viewBox="0 0 120 72" className={cn("h-16 w-24", className)} aria-hidden>
        <rect width="120" height="72" rx="20" fill="#fff3da" />
        {Array.from({ length: total }, (_, index) => {
          const x = 18 + (index % 3) * 34;
          const y = 18 + Math.floor(index / 3) * 28;
          return star ? (
            <polygon
              key={index}
              points={`${x + 10},${y} ${x + 13},${y + 8} ${x + 22},${y + 8} ${x + 15},${y + 13} ${x + 18},${y + 22} ${x + 10},${y + 17} ${x + 2},${y + 22} ${x + 5},${y + 13} ${x - 2},${y + 8} ${x + 7},${y + 8}`}
              fill="#ffc83d"
            />
          ) : (
            <circle key={index} cx={x + 10} cy={y + 10} r="9" fill="#ff5a5a" />
          );
        })}
      </svg>
    );
  }
  if (token === "two-cats") {
    return (
      <svg viewBox="0 0 120 72" className={cn("h-16 w-24", className)} aria-hidden>
        <rect width="120" height="72" rx="20" fill="#fff3da" />
        <Animal cx={38} kind="cat" />
        <Animal cx={82} kind="cat" />
      </svg>
    );
  }
  if (token === "cat" || token === "dog" || token === "bird" || token === "fish") {
    return (
      <svg viewBox="0 0 88 88" className={cn("size-16", className)} aria-hidden>
        <rect width="88" height="88" rx="24" fill="#fff3da" />
        <Animal cx={44} kind={token} />
      </svg>
    );
  }
  if (token === "colors") {
    return (
      <svg viewBox="0 0 220 88" className={cn("w-full max-w-[240px]", className)} aria-hidden>
        <rect width="220" height="88" rx="28" fill="#fff3da" />
        {["#ff5a5a", "#ffc83d", "#4aa3ff", "#3dcb7a"].map((fill, index) => (
          <circle key={fill} cx={36 + index * 50} cy="46" r="16" fill={fill} />
        ))}
      </svg>
    );
  }
  if (token === "animals") {
    return (
      <svg viewBox="0 0 220 88" className={cn("w-full max-w-[240px]", className)} aria-hidden>
        <rect width="220" height="88" rx="28" fill="#fff3da" />
        <Animal cx={36} kind="cat" />
        <Animal cx={86} kind="dog" />
        <Animal cx={136} kind="bird" />
        <Animal cx={186} kind="fish" />
      </svg>
    );
  }
  if (token === "numbers") {
    return (
      <svg viewBox="0 0 220 88" className={cn("w-full max-w-[240px]", className)} aria-hidden>
        <rect width="220" height="88" rx="28" fill="#fff3da" />
        {["1", "2", "3", "4", "5"].map((digit, index) => (
          <text key={digit} x={28 + index * 42} y="56" fontSize="32" fontWeight="800" fill="#ff6b4a">
            {digit}
          </text>
        ))}
      </svg>
    );
  }
  if (token === "body" || token === "eyes" || token === "nose" || token === "mouth" || token === "hands") {
    const hot = token === "body" ? "" : token;
    return (
      <svg viewBox="0 0 88 88" className={cn("size-16", className)} aria-hidden>
        <rect width="88" height="88" rx="24" fill="#fff3da" />
        <circle cx="44" cy="36" r="16" fill="#ffd7bf" />
        <circle cx="38" cy="34" r="2" fill={hot === "eyes" ? "#ff6b4a" : "#3b2a24"} />
        <circle cx="50" cy="34" r="2" fill={hot === "eyes" ? "#ff6b4a" : "#3b2a24"} />
        <circle cx="44" cy="40" r={hot === "nose" ? "3" : "1.6"} fill={hot === "nose" ? "#ff6b4a" : "#e07a62"} />
        <path d="M39 46c3 3 7 3 10 0" stroke={hot === "mouth" ? "#ff6b4a" : "#e07a62"} strokeWidth={hot === "mouth" ? 3 : 2} fill="none" />
        <rect x="34" y="54" width="20" height="18" rx="8" fill="#ff8a5b" />
        <path d="M22 62h10M56 62h10" stroke={hot === "hands" ? "#ff6b4a" : "#ffd7bf"} strokeWidth="6" strokeLinecap="round" />
      </svg>
    );
  }
  const glyph = token.trim();
  if (glyph.length > 0 && glyph.length <= 4 && /^[\u4e00-\u9fff0-9]+$/.test(glyph)) {
    return (
      <svg viewBox="0 0 88 88" className={cn("size-16", className)} aria-hidden>
        <rect width="88" height="88" rx="24" fill="#fff3da" />
        <text
          x="44"
          y="56"
          textAnchor="middle"
          fontSize={glyph.length > 2 ? 28 : glyph.length > 1 ? 36 : 42}
          fontWeight="800"
          fill="#ff6b4a"
        >
          {glyph}
        </text>
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 88 88" className={cn("size-16", className)} aria-hidden>
      <rect width="88" height="88" rx="24" fill="#fff3da" />
      <circle cx="44" cy="44" r="16" fill="#ff8a5b" />
    </svg>
  );
}

function Animal({ cx, kind }: { cx: number; kind: "cat" | "dog" | "bird" | "fish" }) {
  if (kind === "fish") {
    return (
      <g>
        <ellipse cx={cx} cy="46" rx="16" ry="10" fill="#4aa3ff" />
        <polygon points={`${cx + 14},46 ${cx + 24},38 ${cx + 24},54`} fill="#4aa3ff" />
      </g>
    );
  }
  if (kind === "bird") {
    return (
      <g>
        <circle cx={cx} cy="46" r="12" fill="#ffc83d" />
        <polygon points={`${cx + 8},46 ${cx + 18},42 ${cx + 18},50`} fill="#ff6b4a" />
      </g>
    );
  }
  return (
    <g>
      <circle cx={cx} cy="48" r="14" fill={kind === "cat" ? "#ffb067" : "#c9895a"} />
      {kind === "cat" ? (
        <g>
          <polygon points={`${cx - 12},40 ${cx - 6},28 ${cx - 2},42`} fill="#ffb067" />
          <polygon points={`${cx + 12},40 ${cx + 6},28 ${cx + 2},42`} fill="#ffb067" />
        </g>
      ) : (
        <ellipse cx={cx - 16} cy="50" rx="8" ry="6" fill="#c9895a" />
      )}
    </g>
  );
}
