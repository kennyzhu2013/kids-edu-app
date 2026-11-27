import { z } from "zod";

export const ageBandSchema = z.enum(["A", "B", "C"]);

export const choiceSchema = z.object({
  id: z.string(),
  label: z.string(),
  scene: z.enum(["hello", "bye", "sit"]).optional(),
  visual: z.string().optional(),
  asset: z.string().optional(),
  basket: z.string().optional(),
});

export const basketSchema = z.object({
  id: z.string(),
  label: z.string(),
  visual: z.string().optional(),
});

export const stepSchema = z.object({
  id: z.string(),
  type: z.enum([
    "listen",
    "tap",
    "drag",
    "speak",
    "count-tap",
    "sort",
    "scenario-choice",
  ]),
  promptAudio: z.string().optional(),
  promptText: z.string().optional(),
  promptSpeak: z.string().optional(),
  choices: z.array(choiceSchema).optional(),
  baskets: z.array(basketSchema).optional(),
  answer: z.union([z.string(), z.array(z.string())]),
  speakText: z.string().optional(),
  ages: z.array(ageBandSchema).optional(),
  knowledgePointIds: z.array(z.string()).optional().default([]),
});

export const levelDocumentSchema = z.object({
  schemaVersion: z.number().int(),
  id: z.string(),
  packId: z.string(),
  title: z.string(),
  order: z.number().int(),
  ageBand: z.array(ageBandSchema),
  vocab: z.array(z.string()),
  audioIntro: z.string(),
  introScript: z.string(),
  introScriptZh: z.string(),
  listenTitle: z.string().optional(),
  listenVisual: z.string().optional(),
  nextLevelId: z.string().optional(),
  steps: z.array(stepSchema).min(1),
  rewardStars: z.number().int().min(1).max(3),
  rewardCopy: z.string(),
  rewardCopyZh: z.string(),
  knowledgePointIds: z.array(z.string()).optional().default([]),
  aDiff: z.string().optional(),
  bDiff: z.string().optional(),
  cDiff: z.string().optional(),
  assetsNote: z.string().optional(),
});

export const levelOutlineSchema = z.object({
  id: z.string(),
  packId: z.string(),
  order: z.number().int(),
  title: z.string(),
  goal: z.string(),
  vocab: z.array(z.string()),
  rewardCopy: z.string(),
  types: z.array(z.string()),
  minutes: z.number().int(),
  playable: z.boolean(),
});

const gameMeta = {
  schemaVersion: z.number().int(),
  gameId: z.string(),
  title: z.string(),
  titleEn: z.string(),
  knowledgeTags: z.array(z.string()),
  knowledgePointIds: z.array(z.string()).optional().default([]),
  dailyFree: z.number().int(),
  durationSec: z.number().int(),
  rounds: z.string(),
  winCondition: z.string(),
  winTarget: z.number().int().min(1),
  howTo: z.string(),
  guide: z.string(),
  assetsNote: z.string().optional(),
};

const colorSchema = z.object({
  id: z.string(),
  label: z.string(),
  labelEn: z.string(),
  hex: z.string(),
});

export const gameDocumentSchema = z.discriminatedUnion("kind", [
  z.object({
    ...gameMeta,
    kind: z.literal("color-match"),
    colors: z.array(colorSchema).min(2),
  }),
  z.object({
    ...gameMeta,
    kind: z.literal("spot-animal"),
    animals: z
      .array(z.object({ id: z.enum(["cat", "dog", "bird", "fish"]), label: z.string() }))
      .min(2),
  }),
  z.object({
    ...gameMeta,
    kind: z.literal("count-dash"),
    targets: z.array(z.number().int().min(1).max(8)).min(1),
  }),
  z.object({
    ...gameMeta,
    kind: z.literal("shape-fit"),
    shapes: z
      .array(z.object({ id: z.enum(["circle", "square", "triangle"]), label: z.string() }))
      .min(2),
  }),
  z.object({
    ...gameMeta,
    kind: z.literal("habit-order"),
    steps: z.array(z.object({ id: z.string(), label: z.string(), visual: z.string() })).min(2),
  }),
]);

export const catalogSchema = z.object({
  subjects: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      tab: z.string(),
    }),
  ),
  packs: z.array(
    z.object({
      id: z.string(),
      subjectId: z.string(),
      title: z.string(),
      summary: z.string(),
      levelCount: z.number().int(),
      ageRange: z.string(),
      access: z.enum(["trial", "locked", "owned"]),
      accent: z.string(),
    }),
  ),
  levels: z.array(levelOutlineSchema),
  games: z.array(
    z.object({
      gameId: z.string(),
      title: z.string(),
      titleEn: z.string(),
      knowledgeTags: z.array(z.string()),
      dailyFree: z.number().int(),
      durationSec: z.number().int(),
      rounds: z.string(),
      winCondition: z.string(),
      howTo: z.string(),
      guide: z.string(),
      playable: z.boolean(),
    }),
  ),
});

export type LevelDocument = z.infer<typeof levelDocumentSchema>;
export type LevelOutline = z.infer<typeof levelOutlineSchema>;
export type GameDocument = z.infer<typeof gameDocumentSchema>;
export type Catalog = z.infer<typeof catalogSchema>;
export type PackRecord = Catalog["packs"][number];
export type GameOutline = Catalog["games"][number];
