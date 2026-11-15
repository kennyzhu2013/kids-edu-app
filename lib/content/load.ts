import catalogJson from "@/content/fixtures/catalog.json";
import colorMatchJson from "@/content/fixtures/games/game-color-match.json";
import countDashJson from "@/content/fixtures/games/game-count-dash.json";
import habitOrderJson from "@/content/fixtures/games/game-habit-order.json";
import shapeFitJson from "@/content/fixtures/games/game-shape-fit.json";
import spotAnimalJson from "@/content/fixtures/games/game-spot-animal.json";
import eng01 from "@/content/fixtures/levels/eng-starter-01.json";
import eng02 from "@/content/fixtures/levels/eng-starter-02.json";
import eng03 from "@/content/fixtures/levels/eng-starter-03.json";
import eng04 from "@/content/fixtures/levels/eng-starter-04.json";
import eng05 from "@/content/fixtures/levels/eng-starter-05.json";
import eng06 from "@/content/fixtures/levels/eng-starter-06.json";
import eng07 from "@/content/fixtures/levels/eng-starter-07.json";
import eng08 from "@/content/fixtures/levels/eng-starter-08.json";
import eng09 from "@/content/fixtures/levels/eng-starter-09.json";
import eng10 from "@/content/fixtures/levels/eng-starter-10.json";
import lang01 from "@/content/fixtures/levels/lang-starter-01.json";
import lang02 from "@/content/fixtures/levels/lang-starter-02.json";
import lang03 from "@/content/fixtures/levels/lang-starter-03.json";
import lang04 from "@/content/fixtures/levels/lang-starter-04.json";
import lang05 from "@/content/fixtures/levels/lang-starter-05.json";
import lang06 from "@/content/fixtures/levels/lang-starter-06.json";
import lang07 from "@/content/fixtures/levels/lang-starter-07.json";
import lang08 from "@/content/fixtures/levels/lang-starter-08.json";
import lang09 from "@/content/fixtures/levels/lang-starter-09.json";
import lang10 from "@/content/fixtures/levels/lang-starter-10.json";
import life01 from "@/content/fixtures/levels/life-starter-01.json";
import life02 from "@/content/fixtures/levels/life-starter-02.json";
import life03 from "@/content/fixtures/levels/life-starter-03.json";
import life04 from "@/content/fixtures/levels/life-starter-04.json";
import life05 from "@/content/fixtures/levels/life-starter-05.json";
import life06 from "@/content/fixtures/levels/life-starter-06.json";
import life07 from "@/content/fixtures/levels/life-starter-07.json";
import life08 from "@/content/fixtures/levels/life-starter-08.json";
import life09 from "@/content/fixtures/levels/life-starter-09.json";
import life10 from "@/content/fixtures/levels/life-starter-10.json";
import mathLife01 from "@/content/fixtures/levels/math-life-01.json";
import mathLife02 from "@/content/fixtures/levels/math-life-02.json";
import mathLife03 from "@/content/fixtures/levels/math-life-03.json";
import mathLife04 from "@/content/fixtures/levels/math-life-04.json";
import mathLife05 from "@/content/fixtures/levels/math-life-05.json";
import math01 from "@/content/fixtures/levels/math-starter-01.json";
import math02 from "@/content/fixtures/levels/math-starter-02.json";
import math03 from "@/content/fixtures/levels/math-starter-03.json";
import math04 from "@/content/fixtures/levels/math-starter-04.json";
import math05 from "@/content/fixtures/levels/math-starter-05.json";
import math06 from "@/content/fixtures/levels/math-starter-06.json";
import math07 from "@/content/fixtures/levels/math-starter-07.json";
import math08 from "@/content/fixtures/levels/math-starter-08.json";
import math09 from "@/content/fixtures/levels/math-starter-09.json";
import math10 from "@/content/fixtures/levels/math-starter-10.json";
import {
  catalogSchema,
  gameDocumentSchema,
  levelDocumentSchema,
  type Catalog,
  type GameDocument,
  type LevelDocument,
} from "@/lib/content/schemas";

const levelFiles = [
  eng01,
  eng02,
  eng03,
  eng04,
  eng05,
  eng06,
  eng07,
  eng08,
  eng09,
  eng10,
  lang01,
  lang02,
  lang03,
  lang04,
  lang05,
  lang06,
  lang07,
  lang08,
  lang09,
  lang10,
  life01,
  life02,
  life03,
  life04,
  life05,
  life06,
  life07,
  life08,
  life09,
  life10,
  mathLife01,
  mathLife02,
  mathLife03,
  mathLife04,
  mathLife05,
  math01,
  math02,
  math03,
  math04,
  math05,
  math06,
  math07,
  math08,
  math09,
  math10,
];

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
  return levelFiles.map((level) => {
    const parsed = parseOrThrow(
      typeof level === "object" && level && "id" in level ? String(level.id) : "level",
      levelDocumentSchema.safeParse(level),
    );
    return parsed;
  });
}

export function loadPlayableLevel(): LevelDocument {
  return loadPlayableLevels()[0];
}

const gameFiles = [colorMatchJson, spotAnimalJson, countDashJson, shapeFitJson, habitOrderJson];

export function loadGameConfigs(): GameDocument[] {
  return gameFiles.map((game) => {
    const name = typeof game === "object" && game && "gameId" in game ? String(game.gameId) : "game";
    return parseOrThrow(name, gameDocumentSchema.safeParse(game));
  });
}

export function loadColorMatch(): GameDocument {
  const game = loadGameConfigs().find((item) => item.gameId === "game-color-match");
  if (!game) throw new Error("缺少颜色配对");
  return game;
}
