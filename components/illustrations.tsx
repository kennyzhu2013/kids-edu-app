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

const BALLS: Record<string, string> = {
  "ball-red": "#ff5a5a",
  "ball-yellow": "#ffc83d",
  "ball-blue": "#4aa3ff",
  "ball-green": "#3dcb7a",
  "apple-red": "#ff5a5a",
  "apple-yellow": "#ffc83d",
};

export function TokenArt({ token, className }: { token: string; className?: string }) {
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
