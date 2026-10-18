import catalogJson from "@/content/fixtures/catalog.json";
import colorMatchJson from "@/content/fixtures/games/game-color-match.json";
import levelJson from "@/content/fixtures/levels/eng-starter-01.json";
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

export function loadPlayableLevel(): LevelDocument {
  return parseOrThrow("eng-starter-01", levelDocumentSchema.safeParse(levelJson));
}

export function loadColorMatch(): GameDocument {
  return parseOrThrow("game-color-match", gameDocumentSchema.safeParse(colorMatchJson));
}
