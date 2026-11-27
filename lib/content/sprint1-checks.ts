import { loadCurriculum } from "@/lib/content/curriculum";
import { loadCatalog, loadGameConfigs, loadPlayableLevels } from "@/lib/content/load";

const PRODUCT_SUBJECTS = ["lang", "math", "eng", "life"];
const PLANNING_SUBJECTS = ["ZH", "EN", "MA", "SC", "HL", "SE", "AR"];
const GAME_TAGS: Record<string, string> = {
  "game-color-match": "colors",
  "game-spot-animal": "animals",
  "game-count-dash": "numbers",
  "game-shape-fit": "shapes",
  "game-habit-order": "habits",
};

export function assertSprint1Content() {
  const curriculum = loadCurriculum();
  const catalog = loadCatalog();
  const levels = loadPlayableLevels();
  const games = loadGameConfigs();
  const productIds = catalog.subjects.map((item) => item.id);
  if (productIds.join(",") !== PRODUCT_SUBJECTS.join(",")) {
    throw new Error(`课程馆学科必须仍是 ${PRODUCT_SUBJECTS.join(" / ")}`);
  }
  const planningIds = curriculum.subjects.map((item) => item.id);
  if (planningIds.join(",") !== PLANNING_SUBJECTS.join(",")) {
    throw new Error("规划学科必须是 ZH EN MA SC HL SE AR");
  }
  if (planningIds.some((id) => productIds.includes(id))) {
    throw new Error("规划学科不能和产品学科共用 id");
  }
  const pointIds = new Set(curriculum.points.map((item) => item.code));
  if (levels.length !== 45) throw new Error("现有可玩关卡应仍是 45 关");
  for (const level of levels) {
    if (level.knowledgePointIds.length === 0) throw new Error(`${level.id} 缺少知识点`);
    for (const pointId of level.knowledgePointIds) {
      if (!pointIds.has(pointId)) throw new Error(`${level.id} 引用了不存在的 ${pointId}`);
    }
    if (level.packId === "math-starter") {
      for (const step of level.steps) {
        if (step.knowledgePointIds.length === 0) throw new Error(`${level.id} ${step.id} 缺少知识点`);
        for (const pointId of step.knowledgePointIds) {
          if (!pointIds.has(pointId)) throw new Error(`${level.id} ${step.id} 引用了不存在的 ${pointId}`);
        }
      }
    }
  }
  const lifeClock = levels.find((level) => level.id === "math-life-04");
  if (!lifeClock || lifeClock.knowledgePointIds.some((id) => !id.startsWith("MA08"))) {
    throw new Error("math-life-04 只属于时间认知 MA08");
  }
  for (const level of levels.filter((item) => item.packId === "math-life" && item.id !== "math-life-04")) {
    if (level.knowledgePointIds.some((id) => !id.startsWith("MA09"))) {
      throw new Error(`${level.id} 应属于生活数学 MA09`);
    }
  }
  for (const code of ["ZH02-001", "MA03-001"]) {
    const used = levels.some(
      (level) =>
        level.knowledgePointIds.includes(code) || level.steps.some((step) => step.knowledgePointIds.includes(code)),
    );
    if (used) throw new Error(`${code} 只留在目录骨架里，不要打到现有关卡`);
  }
  if (games.length !== 5) throw new Error("游戏应仍是 5 个");
  for (const game of games) {
    const tag = GAME_TAGS[game.gameId];
    if (!tag || !game.knowledgeTags.includes(tag)) throw new Error(`${game.gameId} 要保留原来的 knowledgeTags`);
    if (game.knowledgePointIds.length === 0) throw new Error(`${game.gameId} 缺少知识点`);
    for (const pointId of game.knowledgePointIds) {
      const point = curriculum.points.find((item) => item.code === pointId);
      if (!point) throw new Error(`${game.gameId} 引用了不存在的 ${pointId}`);
      if (point.courseId.startsWith("AR")) throw new Error(`${game.gameId} 不能因为名字挂到艺术学科`);
    }
  }
  const color = games.find((game) => game.gameId === "game-color-match");
  if (!color?.knowledgePointIds.includes("ZH04-002") || !color.knowledgePointIds.includes("EN03-003")) {
    throw new Error("颜色配对应挂到中文或英语的颜色知识点");
  }
}
