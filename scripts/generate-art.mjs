import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import {
  angry,
  apple,
  ask,
  baby,
  ball,
  bike,
  bird,
  blocks,
  bread,
  brush,
  bus,
  candy,
  car,
  cat,
  clock,
  cluster,
  coat,
  dad,
  different,
  dog,
  dry,
  enough,
  eye,
  eyes,
  eyesClosed,
  feelings,
  fire,
  fish,
  follow,
  frame,
  hand,
  hands,
  happy,
  hat,
  hold,
  host,
  icon,
  lessMark,
  milk,
  mia,
  mom,
  moon,
  moreMark,
  mountain,
  mouth,
  no,
  nose,
  numeral,
  pencil,
  phone,
  place,
  plane,
  rice,
  rinse,
  sad,
  sameMark,
  scared,
  shapeCircle,
  shapeSquare,
  shapeTriangle,
  sizedBall,
  soap,
  sprites,
  stage,
  star,
  stop,
  strokes,
  sun,
  swatch,
  tooth,
  toybox,
  umbrella,
  water,
  wet,
  xiaoya,
  yes,
} from "./art-library.mjs";

const root = path.resolve(import.meta.dirname, "..");
const outDir = path.join(root, "public", "art");

const SLUG = {
  hello: "listen-hello",
  bye: "scene-bye",
  sit: "scene-sit",
  colors: "listen-colors",
  animals: "listen-animals",
  numbers: "listen-numbers",
  body: "listen-body",
  饭: "listen-meal",
  日: "sun",
  伞: "umbrella",
  手: "hand",
  车: "car",
  脸: "feelings",
  停: "stop",
  水果: "listen-fruit",
  买: "listen-shop",
  队: "listen-queue",
  钟: "clock",
  盒: "toybox",
  多少: "listen-more",
  形状: "listen-shapes",
  大小: "listen-size",
  分类: "listen-sort",
  "ball-red": "ball-red",
  "ball-yellow": "ball-yellow",
  "ball-blue": "ball-blue",
  "ball-green": "ball-green",
  "apple-red": "apple-red",
  "apple-yellow": "apple-yellow",
  "apples-2": "apples-2",
  "apples-3": "apples-3",
  "apples-5": "apples-5",
  "stars-3": "stars-3",
  "stars-4": "stars-4",
  "stars-5": "stars-5",
  "number-2": "number-2",
  "number-3": "number-3",
  "number-5": "number-5",
  "two-cats": "two-cats",
  cat: "cat",
  dog: "dog",
  bird: "bird",
  fish: "fish",
  eyes: "eyes",
  nose: "nose",
  mouth: "mouth",
  hands: "hands",
  鼻: "nose",
  眼: "eye",
  嘴: "mouth",
  爸: "dad",
  妈: "mom",
  宝: "baby",
  狗: "dog",
  猫: "cat",
  鸟: "bird",
  鱼: "fish",
  黄: "swatch-yellow",
  红: "swatch-red",
  蓝: "swatch-blue",
  绿: "swatch-green",
  苹: "apple-red",
  米: "rice",
  奶: "milk",
  面: "bread",
  月: "moon",
  山: "mountain",
  水: "water",
  火: "fire",
  帽: "hat",
  袄: "coat",
  皂: "soap",
  湿: "wet",
  干: "dry",
  冲: "rinse",
  公: "bus",
  汽: "car",
  自: "bike",
  飞: "plane",
  难: "sad",
  开: "happy",
  气: "angry",
  怕: "scared",
  跑: "run",
  闭: "eyes-closed",
  跟: "follow",
  不: "no",
  糖: "candy",
  牵: "hold",
  站: "stand",
  同: "same",
  多: "more",
  少: "less",
  2: "num-2",
  3: "num-3",
  6: "num-6",
  能: "yes",
  问: "ask",
  4: "num-4",
  5: "num-5",
  够: "enough",
  1: "num-1",
  7: "num-7",
  12: "num-12",
  圆: "shape-circle",
  方: "shape-square",
  角: "shape-triangle",
  小: "small",
  大: "big",
  球: "ball-red",
  积: "blocks",
  中: "mid",
  异: "different",
  长: "long",
  短: "short",
};

const kit = sprites();

function row(names, x0, y, gap, s) {
  return names.map((name, index) => [name, x0 + index * gap, y, s]);
}

function cover(who, pose, props, spot = {}) {
  const bits = [];
  if (who) {
    const x = spot.x ?? (who === "mia" ? 72 : 62);
    const y = spot.y ?? 86;
    const s = spot.s ?? (who === "mia" ? 0.86 : 0.78);
    bits.push(host(who, pose, x, y, s));
  }
  for (const [name, x, y, s] of props) bits.push(place(name, x, y, s, kit));
  return stage(bits.join(""));
}

const COVERS = {
  "eng-starter-01": () => cover("mia", "wave", [["sun", 214, 52, 0.85]]),
  "eng-starter-02": () => cover("mia", "wave", row(["ballR", "ballY", "ballB", "ballG"], 150, 86, 34, 0.48)),
  "eng-starter-03": () => cover("mia", "wave", row(["cat", "dog", "bird", "fish"], 150, 86, 34, 0.42)),
  "eng-starter-04": () => cover("mia", "wave", [...row(["apple", "apple", "apple", "apple", "apple"], 148, 78, 26, 0.28), ["n5", 230, 118, 0.55]]),
  "eng-starter-05": () => cover("mia", "wave", row(["eye", "nose", "mouth", "hand"], 156, 86, 34, 0.42)),
  "eng-starter-06": () => cover("mia", "wave", row(["dad", "mom", "baby"], 168, 86, 40, 0.55)),
  "eng-starter-07": () => cover("mia", "wave", row(["apple", "milk", "bread"], 168, 86, 40, 0.55)),
  "eng-starter-08": () => cover("mia", "jump", [["swoosh", 200, 70, 0.9], ["star", 236, 108, 0.45]], { x: 78, y: 90, s: 0.9 }),
  "eng-starter-09": () => cover("mia", "stand", row(["hat", "coat"], 176, 82, 52, 0.7)),
  "eng-starter-10": () => cover("mia", "wave", row(["dad", "apple", "swoosh"], 160, 86, 42, 0.5)),
  "lang-starter-01": () => cover("sprout", "wave", row(["eye", "nose", "mouth", "hand"], 148, 86, 34, 0.42)),
  "lang-starter-02": () => cover("sprout", "idle", row(["cat", "dog", "bird", "fish"], 146, 88, 34, 0.42)),
  "lang-starter-03": () => cover("sprout", "wave", row(["swR", "swY", "swB", "swG"], 150, 86, 34, 0.46)),
  "lang-starter-04": () => cover("sprout", "idle", row(["rice", "apple", "milk", "bread"], 146, 86, 34, 0.4)),
  "lang-starter-05": () => cover("sprout", "wave", [["sun", 176, 78, 1.15], ["bar1", 236, 92, 0.7]]),
  "lang-starter-06": () => cover("sprout", "idle", row(["bar1", "bar2", "bar3"], 168, 86, 40, 0.7)),
  "lang-starter-07": () => cover("sprout", "idle", [["big", 176, 86, 0.7], ["small", 236, 96, 0.7]]),
  "lang-starter-08": () => cover("sprout", "happy", [["sun", 176, 74, 0.95], ["moon", 236, 86, 0.9]]),
  "lang-starter-09": () => cover("sprout", "idle", row(["mountain", "water", "fire"], 164, 86, 42, 0.55)),
  "lang-starter-10": () => cover("sprout", "wave", row(["cat", "swR", "sun"], 164, 86, 42, 0.55)),
  "life-starter-01": () => cover("sprout", "idle", [["umbrella", 176, 74, 0.85], ["rain", 230, 90, 0.8], ["coat", 236, 118, 0.4]]),
  "life-starter-02": () => cover("sprout", "wave", row(["wet", "soap", "rinse", "dry"], 150, 88, 34, 0.4), { s: 0.62, x: 48 }),
  "life-starter-03": () => cover("sprout", "idle", row(["bus", "car", "bike", "plane"], 146, 88, 36, 0.4)),
  "life-starter-04": () => cover(null, "idle", row(["happy", "angry", "sad", "scared"], 46, 84, 62, 0.72)),
  "life-starter-05": () => cover("sprout", "idle", [["stop", 200, 80, 1.05]]),
  "life-starter-06": () => cover("sprout", "wave", [["tooth", 176, 82, 0.85], ["brush", 230, 82, 0.8]]),
  "life-starter-07": () => cover("sprout", "idle", [["toybox", 176, 90, 0.85], ["blocks", 236, 86, 0.6]]),
  "life-starter-08": () => cover("sprout", "happy", [["plate", 180, 96, 0.9], ["hands", 240, 78, 0.55]]),
  "life-starter-09": () => cover("sprout", "wave", [["phone", 200, 82, 0.95]]),
  "life-starter-10": () => cover("sprout", "idle", [["hand", 168, 86, 0.7], ["hand", 210, 86, 0.7], ["stop", 250, 84, 0.55]]),
  "math-starter-01": () => cover("sprout", "wave", [["apple", 160, 70, 0.36], ["apple", 188, 78, 0.36], ["apple", 172, 100, 0.36], ["star", 220, 68, 0.32], ["star", 244, 84, 0.32], ["star", 220, 104, 0.32], ["star", 246, 116, 0.28]]),
  "math-starter-02": () => cover("sprout", "idle", [["many", 176, 84, 0.7], ["few", 240, 90, 0.55]]),
  "math-starter-03": () => cover("sprout", "wave", row(["circle", "square", "triangle"], 164, 86, 40, 0.48)),
  "math-starter-04": () => cover("sprout", "idle", [["big", 160, 78, 0.48], ["small", 200, 92, 0.48], ["long", 236, 70, 0.4], ["short", 240, 108, 0.4]], { s: 0.62, x: 46 }),
  "math-starter-05": () => cover("sprout", "idle", [["apple", 160, 70, 0.4], ["apple", 188, 86, 0.4], ["square", 224, 74, 0.4], ["square", 250, 98, 0.4]]),
  "math-starter-06": () => cover("sprout", "wave", row(["n6", "n8", "n10"], 164, 86, 40, 0.55)),
  "math-starter-07": () => cover("sprout", "idle", row(["n1", "n2", "n3"], 164, 86, 40, 0.62)),
  "math-starter-08": () => cover("sprout", "wave", [...row(["ballR", "ballY", "ballR", "ballY"], 150, 78, 32, 0.36), ["circle", 180, 118, 0.32], ["square", 220, 118, 0.32]]),
  "math-starter-09": () => cover("sprout", "idle", [["scale", 200, 84, 0.95]]),
  "math-starter-10": () => cover("sprout", "happy", row(["triangle", "n5", "square"], 158, 86, 40, 0.5)),
  "math-life-01": () => cover("sprout", "idle", [["plate", 168, 96, 0.7], ["apple", 168, 78, 0.28], ["apple", 186, 80, 0.28], ["plate", 230, 96, 0.7], ["apple", 222, 78, 0.28], ["apple", 240, 80, 0.28]]),
  "math-life-02": () => cover("sprout", "wave", [["bread", 168, 80, 0.55], ["n2", 214, 78, 0.5], ["milk", 214, 118, 0.4], ["n3", 250, 86, 0.5]]),
  "math-life-03": () => cover(null, "idle", row(["kidR", "kidB", "kidG"], 70, 90, 70, 0.85)),
  "math-life-04": () => cover("sprout", "idle", [["clock", 196, 80, 1.15]]),
  "math-life-05": () => cover("sprout", "wave", [["toybox", 168, 92, 0.7], ["ballR", 214, 70, 0.4], ["square", 246, 86, 0.42]]),
};

const ICONS = {
  "listen-hello": () => cover("mia", "wave", [["hi", 210, 70, 0.9]]),
  "scene-hello": () =>
    frame(
      160,
      112,
      `<rect y="86" width="160" height="26" fill="#f8e7cf"/>
${place("sun", 132, 28, 0.42, kit)}
<g transform="translate(72 62) scale(0.95)">${mia("wave")}</g>`,
    ),
  "scene-bye": () =>
    frame(
      160,
      112,
      `<rect y="86" width="160" height="26" fill="#f8e7cf"/>
${place("door", 128, 58, 0.55, kit)}
<g transform="translate(62 62) scale(0.95)">${mia("bye")}</g>`,
    ),
  "scene-sit": () =>
    frame(
      160,
      112,
      `<rect y="90" width="160" height="22" fill="#f8e7cf"/>
${place("book", 118, 78, 0.55, kit)}
<g transform="translate(70 58) scale(0.95)">${mia("sit")}</g>`,
    ),
  "listen-colors": () => cover(null, "idle", row(["ballR", "ballY", "ballB", "ballG"], 40, 84, 66, 0.7)),
  "listen-animals": () => cover(null, "idle", row(["cat", "dog", "bird", "fish"], 40, 86, 66, 0.62)),
  "listen-numbers": () => cover(null, "idle", row(["n1", "n2", "n3", "n5"], 46, 84, 60, 0.7)),
  "listen-body": () => cover(null, "idle", [["happy", 90, 84, 0.9], ["eye", 190, 70, 0.45], ["mouth", 230, 100, 0.45]]),
  "listen-meal": () => cover(null, "idle", row(["rice", "apple", "milk", "bread"], 40, 86, 66, 0.62)),
  "listen-fruit": () => cover(null, "idle", [["apple", 80, 80, 0.7], ["appleY", 140, 96, 0.65], ["apple", 200, 78, 0.6]]),
  "listen-shop": () => cover("sprout", "wave", [["apple", 170, 80, 0.5], ["bread", 214, 86, 0.5], ["n2", 250, 80, 0.45]]),
  "listen-queue": () => cover(null, "idle", row(["kidR", "kidB", "kidG"], 60, 90, 70, 0.8)),
  "listen-more": () => cover(null, "idle", [["many", 90, 86, 0.85], ["few", 200, 90, 0.7]]),
  "listen-shapes": () => cover(null, "idle", row(["circle", "square", "triangle"], 60, 86, 70, 0.7)),
  "listen-size": () => cover(null, "idle", [["big", 80, 86, 0.9], ["small", 170, 100, 0.9], ["long", 230, 86, 0.55]]),
  "listen-sort": () => cover(null, "idle", [["apple", 70, 70, 0.5], ["apple", 110, 96, 0.5], ["square", 180, 74, 0.5], ["square", 220, 100, 0.5]]),
  sun: () => icon(sun()),
  umbrella: () => icon(umbrella()),
  hand: () => icon(hand()),
  car: () => icon(car()),
  feelings: () => icon(feelings(), 88, 88, 0.95),
  stop: () => icon(stop()),
  clock: () => icon(clock()),
  toybox: () => icon(toybox()),
  rice: () => icon(rice()),
  milk: () => icon(milk()),
  bread: () => icon(bread()),
  moon: () => icon(moon()),
  mountain: () => icon(mountain()),
  water: () => icon(water()),
  fire: () => icon(fire()),
  hat: () => icon(hat()),
  coat: () => icon(coat()),
  soap: () => icon(soap()),
  wet: () => icon(wet()),
  dry: () => icon(dry()),
  rinse: () => icon(rinse()),
  bus: () => icon(bus()),
  bike: () => icon(bike()),
  plane: () => icon(plane()),
  sad: () => icon(sad()),
  happy: () => icon(happy()),
  angry: () => icon(angry()),
  scared: () => icon(scared()),
  run: () => icon(`<g transform="rotate(-18)">${mia("run")}</g>`, 88, 88, 0.78),
  "eyes-closed": () => icon(eyesClosed()),
  follow: () => icon(follow()),
  no: () => icon(no()),
  candy: () => icon(candy()),
  hold: () => icon(hold()),
  stand: () => icon(mia("stand"), 88, 88, 0.78),
  same: () => icon(sameMark()),
  more: () => icon(moreMark()),
  less: () => icon(lessMark()),
  yes: () => icon(yes()),
  ask: () => icon(ask()),
  enough: () => icon(enough()),
  big: () => icon(sizedBall(26)),
  small: () => icon(sizedBall(11)),
  mid: () => icon(sizedBall(17)),
  different: () => icon(different()),
  long: () => icon(pencil(56)),
  short: () => icon(pencil(28)),
  blocks: () => icon(blocks()),
  dad: () => icon(dad()),
  mom: () => icon(mom()),
  baby: () => icon(baby()),
  eye: () => icon(eye()),
  eyes: () => icon(eyes()),
  nose: () => icon(nose()),
  mouth: () => icon(mouth()),
  hands: () => icon(hands()),
  cat: () => icon(cat()),
  dog: () => icon(dog()),
  bird: () => icon(bird()),
  fish: () => icon(fish()),
  "two-cats": () => icon(`${cluster(cat, 2, 0.7)}`, 120, 88, 0.9),
  "ball-red": () => icon(ball("#ff5a5a")),
  "ball-yellow": () => icon(ball("#ffc83d")),
  "ball-blue": () => icon(ball("#4aa3ff")),
  "ball-green": () => icon(ball("#3dcb7a")),
  "swatch-red": () => icon(swatch("#ff5a5a")),
  "swatch-yellow": () => icon(swatch("#ffc83d")),
  "swatch-blue": () => icon(swatch("#4aa3ff")),
  "swatch-green": () => icon(swatch("#3dcb7a")),
  "apple-red": () => icon(apple("#ff5a5a")),
  "apple-yellow": () => icon(apple("#ffc83d")),
  "shape-circle": () => icon(shapeCircle()),
  "shape-square": () => icon(shapeSquare()),
  "shape-triangle": () => icon(shapeTriangle()),
  star: () => icon(star()),
  jump: () => icon(`<g transform="translate(0 -10)">${mia("jump")}</g>`, 88, 88, 0.78),
  tooth: () => icon(tooth()),
  brush: () => icon(brush()),
  phone: () => icon(phone()),
  mia: () =>
    frame(
      160,
      190,
      `<ellipse cx="80" cy="172" rx="36" ry="7" fill="#f0dcc4"/>
<g transform="translate(70 108) scale(1.2)">${mia("wave")}</g>`,
    ),
  xiaoya: () =>
    frame(
      160,
      190,
      `<ellipse cx="80" cy="172" rx="36" ry="7" fill="#f0dcc4"/>
<g transform="translate(80 104) scale(1.15)">${xiaoya("wave")}</g>`,
    ),
};

for (const [name, total] of [
  ["apples-2", 2],
  ["apples-3", 3],
  ["apples-5", 5],
]) {
  ICONS[name] = () => icon(cluster(() => apple("#ff5a5a"), total, 0.42), 120, 88, 0.95);
}
for (const total of [3, 4, 5]) {
  ICONS[`stars-${total}`] = () => icon(cluster(star, total, 0.36), 120, 88, 0.95);
}
for (const digit of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12]) {
  ICONS[`num-${digit}`] = () => icon(numeral(digit, false));
  if (digit === 2 || digit === 3 || digit === 5) ICONS[`number-${digit}`] = () => icon(numeral(digit, true), 88, 88, 0.7);
}

const PLACEHOLDER = "没有实拍素材。图用色块和字块代替，旁白用浏览器语音。";
const EARLY_NOTE = "插画是原创矢量图，不再用色块占位。旁白是站内音频，缺文件时才用系统朗读。";
const ENG_NOTES = {
  "eng-starter-01": "Mia 立绘在 /art/mia.svg，英语第一关直接使用。打招呼、再见、坐好是同一角色的三张场景。旁白是站内英文音频。跟读麦克风尚未接入。",
  "eng-starter-02": "彩球和苹果是矢量插画。单词旁白是站内英文音频，缺文件时才用系统朗读。",
  "eng-starter-03": "猫、狗、鸟、鱼是矢量插画。叫声旁白是站内英文音频。",
  "eng-starter-04": "数量用重复的小图表示。开场旁白是站内英文音频，会数到 five。",
  "eng-starter-05": "身体部位是矢量插画。指令旁白是站内英文音频。",
};
const GAME_NOTES = {
  "game-color-match": "彩色皮球是矢量插画。开场和每一种颜色都有中文语音。",
  "game-count-dash": "苹果和星星是矢量插画。开场说明规则，每一关会念出要点的数量。星星不算。",
  "game-habit-order": "洗手四步是矢量插画，顺序和洗手步骤一致。开场有语音。可以点，也可以拖到格子里。",
  "game-shape-fit": "圆形、方形、三角形是矢量插画。开场和每一种形状都有语音。可以点，也可以拖进凹槽。",
  "game-spot-animal": "猫、狗、鸟、鱼是矢量插画。开场和「哪个不一样」都有语音。",
};

fs.mkdirSync(outDir, { recursive: true });
const written = [];
for (const [slug, draw] of Object.entries(ICONS)) {
  fs.writeFileSync(path.join(outDir, `${slug}.svg`), draw());
  written.push(slug);
}
for (const [id, draw] of Object.entries(COVERS)) {
  fs.writeFileSync(path.join(outDir, `cover-${id}.svg`), draw());
  written.push(`cover-${id}`);
}

const appleFile = path.join(outDir, "apple.svg");
if (fs.existsSync(appleFile)) fs.unlinkSync(appleFile);

function rewrite(file) {
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  const missing = [];
  const swap = (token) => {
    if (typeof token !== "string" || token.startsWith("/")) return token;
    const slug = SLUG[token];
    if (!slug || !ICONS[slug]) missing.push(token);
    return slug ? `/art/${slug}.svg` : token;
  };
  if (data.id && COVERS[data.id]) data.listenVisual = `/art/cover-${data.id}.svg`;
  else if (data.listenVisual) data.listenVisual = swap(data.listenVisual);
  for (const step of data.steps ?? []) {
    if (step.visual) step.visual = swap(step.visual);
    for (const choice of step.choices ?? []) {
      if (choice.visual) choice.visual = swap(choice.visual);
    }
  }
  if (data.assetsNote === PLACEHOLDER) data.assetsNote = EARLY_NOTE;
  if (data.id && ENG_NOTES[data.id]) data.assetsNote = ENG_NOTES[data.id];
  if (data.gameId && GAME_NOTES[data.gameId]) data.assetsNote = GAME_NOTES[data.gameId];
  if (missing.length) throw new Error(`${path.basename(file)} 缺少插画：${missing.join(", ")}`);
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
}

for (const folder of ["levels", "games"]) {
  for (const name of fs.readdirSync(path.join(root, "content/fixtures", folder))) {
    if (name.endsWith(".json")) rewrite(path.join(root, "content/fixtures", folder, name));
  }
}

const hashes = new Map();
for (const name of fs.readdirSync(outDir)) {
  if (!name.endsWith(".svg")) continue;
  const digest = crypto.createHash("sha256").update(fs.readFileSync(path.join(outDir, name))).digest("hex");
  const list = hashes.get(digest) ?? [];
  list.push(name);
  hashes.set(digest, list);
}
const dupes = [...hashes.values()].filter((names) => names.length > 1);
if (dupes.length) {
  console.error(dupes.map((names) => names.join(" = ")).join("\n"));
  throw new Error(`有 ${dupes.length} 组插画内容完全相同`);
}

console.log(`插画 ${written.length} 张，听一听封面已按关卡分开`);
