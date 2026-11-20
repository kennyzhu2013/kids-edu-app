import { cn } from "@/lib/utils";

export type BuddyPose = "idle" | "listen" | "speak" | "happy" | "comfort";

const MOTION: Record<BuddyPose, string> = {
  idle: "buddy-wave",
  listen: "buddy-lean",
  speak: "buddy-lean",
  happy: "buddy-jump",
  comfort: "",
};

export function Buddy({ pose = "idle", className }: { pose?: BuddyPose; className?: string }) {
  return (
    <svg viewBox="0 0 160 172" className={cn("buddy size-24", MOTION[pose], className)} role="img" aria-label="小芽">
      <ellipse cx="80" cy="162" rx="38" ry="6" fill="#f0dcc8" />
      <g className="buddy-body">
        <path d="M80 62c-6-20-26-26-32-14 8 2 20 8 32 14z" fill="#1fa97a" />
        <path d="M80 62c6-20 26-26 32-14-8 2-20 8-32 14z" fill="#3dcb7a" />
        <path d="M80 58v16" stroke="#1a8a62" strokeWidth="5" strokeLinecap="round" />
        <circle cx="80" cy="104" r="46" fill="#fff8ef" stroke="#3b2a24" strokeWidth="4" />
        <circle cx="58" cy="112" r="7" fill="#ffb199" />
        <circle cx="102" cy="112" r="7" fill="#ffb199" />
        <Face pose={pose} />
        <g className="buddy-arm">
          <path d="M118 112c14-4 24-16 20-28" stroke="#ffd7bf" strokeWidth="10" strokeLinecap="round" />
          <circle cx="136" cy="80" r="8" fill="#ffd7bf" stroke="#3b2a24" strokeWidth="3" />
        </g>
      </g>
    </svg>
  );
}

function Face({ pose }: { pose: BuddyPose }) {
  if (pose === "happy") {
    return (
      <g>
        <path d="M58 96c4 6 8 6 12 0" stroke="#3b2a24" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M90 96c4 6 8 6 12 0" stroke="#3b2a24" strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d="M62 118c10 12 26 12 36 0" stroke="#e07a62" strokeWidth="4" fill="none" strokeLinecap="round" />
      </g>
    );
  }
  if (pose === "comfort") {
    return (
      <g>
        <circle cx="66" cy="100" r="4" fill="#3b2a24" />
        <circle cx="98" cy="98" r="4" fill="#3b2a24" />
        <path d="M70 120h20" stroke="#e07a62" strokeWidth="3" strokeLinecap="round" />
      </g>
    );
  }
  if (pose === "speak") {
    return (
      <g>
        <circle cx="64" cy="98" r="5" fill="#3b2a24" />
        <circle cx="96" cy="98" r="5" fill="#3b2a24" />
        <ellipse cx="80" cy="120" rx="8" ry="6" fill="#e07a62" />
      </g>
    );
  }
  if (pose === "listen") {
    return (
      <g>
        <circle cx="64" cy="96" r="6" fill="#3b2a24" />
        <circle cx="96" cy="96" r="6" fill="#3b2a24" />
        <circle cx="66" cy="94" r="2" fill="#fff8ef" />
        <circle cx="98" cy="94" r="2" fill="#fff8ef" />
        <path d="M70 118c6 6 14 6 20 0" stroke="#e07a62" strokeWidth="3" fill="none" strokeLinecap="round" />
      </g>
    );
  }
  return (
    <g>
      <circle cx="64" cy="98" r="5" fill="#3b2a24" />
      <circle cx="96" cy="98" r="5" fill="#3b2a24" />
      <path d="M68 116c8 8 16 8 24 0" stroke="#e07a62" strokeWidth="3.5" fill="none" strokeLinecap="round" />
    </g>
  );
}
