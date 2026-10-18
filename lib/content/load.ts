import catalogJson from "@/content/fixtures/catalog.json";
import colorMatchJson from "@/content/fixtures/games/game-color-match.json";
import level01 from "@/content/fixtures/levels/eng-starter-01.json";
import level02 from "@/content/fixtures/levels/eng-starter-02.json";
import level03 from "@/content/fixtures/levels/eng-starter-03.json";
import level04 from "@/content/fixtures/levels/eng-starter-04.json";
import level05 from "@/content/fixtures/levels/eng-starter-05.json";
import {
  catalogSchema,
  gameDocumentSchema,
  levelDocumentSchema,
  type Catalog,
  type GameDocument,
  type LevelDocument,
} from "@/lib/content/schemas";

function parseOrThrow<T>(name: string, result: { success: true; data: T } | { success: false; error: { issues: unknown[] } }): T {
  if (!result.success) {
    throw new Error(`${name} 校验失败：${JSON.stringify(result.error.issues)}`);
  }
  return result.data;
}

export function loadCatalog(): Catalog {
  return parseOrThrow("catalog", catalogSchema.safeParse(catalogJson));
}

export function loadPlayableLevels(): LevelDocument[] {
  return [level01, level02, level03, level04, level05].map((level, index) =>
    parseOrThrow(`eng-starter-0${index + 1}`, levelDocumentSchema.safeParse(level)),
  );
}

export function loadPlayableLevel(): LevelDocument {
  return loadPlayableLevels()[0];
}

export function loadColorMatch(): GameDocument {
  return parseOrThrow("game-color-match", gameDocumentSchema.safeParse(colorMatchJson));
}
