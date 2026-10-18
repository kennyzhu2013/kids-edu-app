import { loadCatalog, loadColorMatch, loadPlayableLevels } from "@/lib/content/load";
import type { GameDocument, LevelDocument } from "@/lib/content/schemas";

export type ChildRecord = {
  id: string;
  userId: string;
  nickname: string;
  ageBand: "A" | "B" | "C";
  avatar: string | null;
  isCurrent: boolean;
};

export type ProgressRecord = {
  id: string;
  childId: string;
  levelId: string;
  status: "started" | "completed";
  stars: number;
  score: number;
  durationSec: number;
  clientEventId: string | null;
  completedAt: string | null;
};

export type OrderRecord = {
  id: string;
  userId: string;
  skuId: string;
  channel: string;
  status: "pending" | "paid" | "failed";
  amount: number;
  currency: "CNY";
  payParams: Record<string, unknown>;
  createdAt: string;
};

export type EntitlementRecord = {
  id: string;
  userId: string;
  childId: string | null;
  type: "no_ads" | "pack" | "vip_year" | "ad_unlock";
  scope: string | null;
  expireAt: string | null;
  source: "order" | "ad" | "grant";
  createdAt: string;
};

export type AssetRecord = {
  id: string;
  kind: string;
  cdnUrl: string | null;
  tags: string[];
  status: string;
  deletedAt: string | null;
};

type SmsTicket = {
  code: string;
  expireAt: number;
  lastSentAt: number;
};

export const CONTENT_REV = 2;

export type Memory = {
  contentRev: number;
  user: {
    id: string;
    phone: string | null;
    wechatOpenId: string | null;
    nickname: string;
    role: "parent" | "admin";
  };
  children: ChildRecord[];
  progress: ProgressRecord[];
  orders: OrderRecord[];
  entitlements: EntitlementRecord[];
  parentLock: {
    pin: string;
    failCount: number;
    lockedUntil: number | null;
    sessionToken: string | null;
    sessionExpireAt: number | null;
  };
  sms: Map<string, SmsTicket>;
  packs: ReturnType<typeof loadCatalog>["packs"];
  levels: ReturnType<typeof loadCatalog>["levels"];
  games: ReturnType<typeof loadCatalog>["games"];
  subjects: ReturnType<typeof loadCatalog>["subjects"];
  playableLevels: Record<string, LevelDocument>;
  gameConfigs: Record<string, GameDocument>;
  assets: AssetRecord[];
};

const globalStore = globalThis as typeof globalThis & { __qimengMemory?: Memory };

let memory: Memory | null = globalStore.__qimengMemory ?? null;

function applyContent(state: Memory) {
  const catalog = loadCatalog();
  const levels = loadPlayableLevels();
  state.contentRev = CONTENT_REV;
  state.packs = structuredClone(catalog.packs);
  state.levels = structuredClone(catalog.levels);
  state.games = structuredClone(catalog.games);
  state.subjects = structuredClone(catalog.subjects);
  state.playableLevels = Object.fromEntries(levels.map((level) => [level.id, structuredClone(level)]));
}

export function db(): Memory {
  if (globalStore.__qimengMemory) {
    if (globalStore.__qimengMemory.contentRev !== CONTENT_REV) applyContent(globalStore.__qimengMemory);
    return globalStore.__qimengMemory;
  }
  if (memory) return memory;
  const game = loadColorMatch();
  memory = {
    contentRev: CONTENT_REV,
    user: {
      id: "user-demo",
      phone: null,
      wechatOpenId: null,
      nickname: "家长",
      role: "parent",
    },
    children: [
      {
        id: "child-demo",
        userId: "user-demo",
        nickname: "小芽",
        ageBand: "A",
        avatar: "sprout",
        isCurrent: true,
      },
    ],
    progress: [],
    orders: [],
    entitlements: [],
    parentLock: {
      pin: process.env.PARENT_LOCK_PIN || "2580",
      failCount: 0,
      lockedUntil: null,
      sessionToken: null,
      sessionExpireAt: null,
    },
    sms: new Map(),
    packs: [],
    levels: [],
    games: [],
    subjects: [],
    playableLevels: {},
    gameConfigs: { [game.gameId]: structuredClone(game) },
    assets: [
      {
        id: "asset-mia",
        kind: "image",
        cdnUrl: null,
        tags: ["mia", "eng-starter-01"],
        status: "draft",
        deletedAt: null,
      },
    ],
  };
  applyContent(memory);
  globalStore.__qimengMemory = memory;
  return memory;
}

export function resetMemoryForTests() {
  memory = null;
  globalStore.__qimengMemory = undefined;
}

export function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function currentChild(state: Memory, childId?: string | null) {
  if (childId) {
    const found = state.children.find((child) => child.id === childId);
    if (found) return found;
  }
  return state.children.find((child) => child.isCurrent) ?? state.children[0] ?? null;
}

export function activeEntitlements(state: Memory, now = Date.now()) {
  return state.entitlements.filter((item) => !item.expireAt || new Date(item.expireAt).getTime() > now);
}

export function hasVip(state: Memory) {
  return activeEntitlements(state).some((item) => item.type === "vip_year");
}

export function hasNoAds(state: Memory) {
  return hasVip(state) || activeEntitlements(state).some((item) => item.type === "no_ads");
}
