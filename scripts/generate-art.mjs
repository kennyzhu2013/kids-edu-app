import fs from "node:fs";
import path from "node:path";

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

function frame(w, h, body) {
  const radius = Math.min(32, Math.round(w / 7));
  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">\n<rect width="${w}" height="${h}" rx="${radius}" fill="#fff3da"/>\n${body}\n</svg>\n`;
}

function face(cx, cy, r, mood = "happy") {
  const mouth =
    mood === "sad"
      ? `<path d="M${cx - r * 0.32} ${cy + r * 0.48}c${r * 0.2} ${-r * 0.28} ${r * 0.44} ${-r * 0.28} ${r * 0.64} 0" stroke="#e07a62" stroke-width="${Math.max(2, r * 0.12)}" fill="none" stroke-linecap="round"/>`
      : mood === "angry"
        ? `<path d="M${cx - r * 0.4} ${cy + r * 0.42}h${r * 0.8}" stroke="#e07a62" stroke-width="${Math.max(2, r * 0.12)}" stroke-linecap="round"/>`
        : mood === "scared"
          ? `<circle cx="${cx}" cy="${cy + r * 0.42}" r="${r * 0.12}" fill="#e07a62"/>`
          : `<path d="M${cx - r * 0.34} ${cy + r * 0.32}c${r * 0.2} ${r * 0.28} ${r * 0.48} ${r * 0.28} ${r * 0.68} 0" stroke="#e07a62" stroke-width="${Math.max(2, r * 0.12)}" fill="none" stroke-linecap="round"/>`;
  const brows =
    mood === "angry"
      ? `<path d="M${cx - r * 0.48} ${cy - r * 0.18}l${r * 0.28} ${r * 0.12}M${cx + r * 0.48} ${cy - r * 0.18}l${-r * 0.28} ${r * 0.12}" stroke="#6b4638" stroke-width="${Math.max(2, r * 0.1)}" stroke-linecap="round"/>`
      : "";
  const eyes =
    mood === "closed"
      ? `<path d="M${cx - r * 0.46} ${cy}q${r * 0.16} ${r * 0.16} ${r * 0.32} 0M${cx + r * 0.14} ${cy}q${r * 0.16} ${r * 0.16} ${r * 0.32} 0" stroke="#3b2a24" stroke-width="${Math.max(2, r * 0.1)}" fill="none" stroke-linecap="round"/>`
      : `<circle cx="${cx - r * 0.28}" cy="${cy}" r="${r * 0.1}" fill="#3b2a24"/><circle cx="${cx + r * 0.28}" cy="${cy}" r="${r * 0.1}" fill="#3b2a24"/>`;
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#ffd7bf"/>
    <path d="M${cx - r * 0.72} ${cy - r * 0.15}c${r * 0.15} ${-r * 0.85} ${r * 1.2} ${-r * 0.9} ${r * 1.45} ${-r * 0.05}" fill="#6b4638"/>
    ${eyes}${brows}${mouth}`;
}

function shirt(cx, cy, color = "#ff6b4a") {
  return `<rect x="${cx - 16}" y="${cy}" width="32" height="28" rx="12" fill="${color}"/>`;
}

function apple(cx, cy, fill) {
  return `<circle cx="${cx}" cy="${cy + 4}" r="16" fill="${fill}"/><path d="M${cx} ${cy - 12}c4-7 11-7 13-2-6 0-10 3-13 2z" fill="#3dcb7a"/><path d="M${cx} ${cy - 12}c-1-6 3-8 4-8" stroke="#6b4638" stroke-width="2" fill="none"/>`;
}

function star(cx, cy, r, fill = "#ffc44d") {
  const points = [];
  for (let i = 0; i < 10; i += 1) {
    const radius = i % 2 === 0 ? r : r * 0.42;
    const angle = -Math.PI / 2 + i * (Math.PI / 5);
    points.push(`${cx + Math.cos(angle) * radius},${cy + Math.sin(angle) * radius}`);
  }
  return `<polygon points="${points.join(" ")}" fill="${fill}"/>`;
}

function cat(cx, cy) {
  return `<circle cx="${cx}" cy="${cy + 6}" r="18" fill="#ffb067"/>
    <polygon points="${cx - 16},${cy} ${cx - 8},${cy - 16} ${cx - 2},${cy + 2}" fill="#ffb067"/>
    <polygon points="${cx + 16},${cy} ${cx + 8},${cy - 16} ${cx + 2},${cy + 2}" fill="#ffb067"/>
    <circle cx="${cx - 6}" cy="${cy + 4}" r="2" fill="#3b2a24"/>
    <circle cx="${cx + 6}" cy="${cy + 4}" r="2" fill="#3b2a24"/>
    <path d="M${cx - 5} ${cy + 12}q5 5 10 0" stroke="#e07a62" stroke-width="2" fill="none"/>`;
}

function dog(cx, cy) {
  return `<ellipse cx="${cx - 16}" cy="${cy + 4}" rx="8" ry="6" fill="#c9895a"/>
    <circle cx="${cx}" cy="${cy + 6}" r="18" fill="#e0a36a"/>
    <circle cx="${cx - 6}" cy="${cy + 4}" r="2" fill="#3b2a24"/>
    <circle cx="${cx + 6}" cy="${cy + 4}" r="2" fill="#3b2a24"/>
    <ellipse cx="${cx}" cy="${cy + 12}" rx="4" ry="3" fill="#3b2a24"/>`;
}

function bird(cx, cy) {
  return `<circle cx="${cx}" cy="${cy + 4}" r="16" fill="#ffc44d"/>
    <polygon points="${cx + 10},${cy + 4} ${cx + 24},${cy - 2} ${cx + 24},${cy + 10}" fill="#ff6b4a"/>
    <circle cx="${cx + 4}" cy="${cy}" r="2" fill="#3b2a24"/>
    <path d="M${cx - 16} ${cy + 2}q8-10 16 0" stroke="#f0a020" stroke-width="3" fill="none"/>`;
}

function fish(cx, cy) {
  return `<ellipse cx="${cx}" cy="${cy + 4}" rx="18" ry="12" fill="#4aa3ff"/>
    <polygon points="${cx + 14},${cy + 4} ${cx + 28},${cy - 6} ${cx + 28},${cy + 14}" fill="#4aa3ff"/>
    <circle cx="${cx - 6}" cy="${cy + 2}" r="2" fill="#fff8ef"/>`;
}

function ball(fill) {
  return frame(88, 88, `<circle cx="44" cy="48" r="24" fill="${fill}"/><ellipse cx="36" cy="40" rx="8" ry="5" fill="#fff" opacity="0.45"/>`);
}

function countIcons(kind, total) {
  const bits = [];
  for (let index = 0; index < total; index += 1) {
    const x = 22 + (index % 3) * 28;
    const y = 22 + Math.floor(index / 3) * 26;
    bits.push(kind === "star" ? star(x, y, 10) : apple(x, y - 4, "#ff5a5a"));
  }
  return frame(120, 88, bits.join("\n"));
}

const ICONS = {
  "listen-hello": () =>
    frame(
      280,
      168,
      `<circle cx="230" cy="36" r="18" fill="#ffc44d"/>
      <path d="M40 140c40-28 90-28 200 0" fill="#f0c27a"/>
      ${face(92, 78, 28)}
      ${shirt(92, 108)}
      <path d="M118 112c18-22 36-18 42-4" stroke="#ffd7bf" stroke-width="10" stroke-linecap="round"/>
      <circle cx="162" cy="100" r="9" fill="#ffd7bf"/>`,
    ),
  "scene-bye": () =>
    frame(
      88,
      88,
      `${face(40, 36, 18)}
      ${shirt(40, 56, "#3d94f5")}
      <path d="M58 58c10-8 16-4 16 4" stroke="#ffd7bf" stroke-width="7" stroke-linecap="round"/>
      <rect x="62" y="22" width="16" height="40" rx="3" fill="#f3d2b0"/>`,
    ),
  "scene-sit": () =>
    frame(88, 88, `${face(44, 30, 16)}${shirt(44, 48, "#1fa97a")}<ellipse cx="44" cy="74" rx="26" ry="6" fill="#f0c27a"/>`),
  "listen-colors": () =>
    frame(
      280,
      168,
      `<circle cx="50" cy="84" r="28" fill="#ff5a5a"/><circle cx="110" cy="84" r="28" fill="#ffc83d"/><circle cx="170" cy="84" r="28" fill="#4aa3ff"/><circle cx="230" cy="84" r="28" fill="#3dcb7a"/>`,
    ),
  "listen-animals": () => frame(280, 168, `${cat(50, 70)}${dog(120, 70)}${bird(185, 74)}${fish(240, 78)}`),
  "listen-numbers": () =>
    frame(
      280,
      168,
      ["1", "2", "3", "4", "5"]
        .map(
          (digit, index) =>
            `<text x="${36 + index * 50}" y="108" font-size="64" font-family="Nunito, sans-serif" font-weight="800" fill="#ff6b4a">${digit}</text>`,
        )
        .join(""),
    ),
  "listen-body": () =>
    frame(
      220,
      168,
      `${face(110, 58, 36)}
      ${shirt(110, 100, "#ff8a5b")}
      <path d="M62 118h22M146 118h22" stroke="#ffd7bf" stroke-width="10" stroke-linecap="round"/>
      <circle cx="96" cy="54" r="4" fill="#ff6b4a"/><circle cx="124" cy="54" r="4" fill="#ff6b4a"/>`,
    ),
  "listen-meal": () =>
    frame(220, 168, `${apple(54, 78, "#ff5a5a")}<ellipse cx="120" cy="96" rx="36" ry="16" fill="#fff"/><ellipse cx="120" cy="90" rx="28" ry="10" fill="#f4e1b5"/><rect x="168" y="70" width="22" height="40" rx="8" fill="#fff"/><rect x="172" y="78" width="14" height="22" rx="4" fill="#f7f3ea"/>`),
  "listen-fruit": () => frame(220, 168, `${apple(70, 80, "#ff5a5a")}${apple(120, 86, "#ffc83d")}${apple(168, 78, "#3dcb7a")}<ellipse cx="120" cy="128" rx="70" ry="14" fill="#f0c27a"/>`),
  "listen-shop": () =>
    frame(220, 168, `<rect x="36" y="48" width="148" height="84" rx="12" fill="#fff"/><rect x="36" y="36" width="148" height="22" rx="8" fill="#ff6b4a"/><text x="110" y="52" text-anchor="middle" font-size="14" font-weight="700" fill="#fff">¥</text>${apple(78, 78, "#ff5a5a")}<rect x="120" y="78" width="28" height="36" rx="6" fill="#fff8ef" stroke="#4aa3ff" stroke-width="3"/>`),
  "listen-queue": () => frame(280, 168, [0, 1, 2].map((index) => `${face(60 + index * 70, 70, 22)}${shirt(60 + index * 70, 96, ["#ff6b4a", "#4aa3ff", "#3dcb7a"][index])}`).join("")),
  "listen-more": () => frame(220, 168, `${apple(48, 70, "#ff5a5a")}${apple(78, 84, "#ff5a5a")}${apple(62, 100, "#ff5a5a")}${apple(150, 92, "#ff5a5a")}<path d="M108 84h16" stroke="#ff6b4a" stroke-width="6" stroke-linecap="round"/>`),
  "listen-shapes": () => frame(220, 168, `<circle cx="54" cy="84" r="28" fill="#ff8a5b"/><rect x="96" y="56" width="52" height="52" rx="8" fill="#4aa3ff"/><polygon points="190,52 222,120 158,120" fill="#3dcb7a"/>`),
  "listen-size": () => frame(220, 168, `<circle cx="64" cy="96" r="36" fill="#ff6b4a"/><circle cx="150" cy="108" r="16" fill="#ffc44d"/><rect x="176" y="70" width="8" height="50" rx="3" fill="#6b4638"/><rect x="188" y="96" width="8" height="24" rx="3" fill="#c9895a"/>`),
  "listen-sort": () => frame(220, 168, `<circle cx="58" cy="70" r="16" fill="#ff5a5a"/><circle cx="90" cy="78" r="16" fill="#ff5a5a"/><rect x="130" y="58" width="28" height="28" rx="6" fill="#4aa3ff"/><rect x="164" y="66" width="28" height="28" rx="6" fill="#4aa3ff"/>`),
  sun: () => frame(88, 88, `<circle cx="44" cy="46" r="16" fill="#ffc44d"/>${[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => `<line x1="44" y1="46" x2="44" y2="18" stroke="#ffc44d" stroke-width="4" stroke-linecap="round" transform="rotate(${deg} 44 46)"/>`).join("")}`),
  umbrella: () => frame(88, 88, `<path d="M16 46c0-16 12-28 28-28s28 12 28 28z" fill="#4aa3ff"/><path d="M44 46v22" stroke="#6b4638" stroke-width="3"/><path d="M44 68c8 0 10 6 6 8" stroke="#6b4638" stroke-width="3" fill="none"/>`),
  hand: () => frame(88, 88, `<path d="M30 48c0-8 6-10 8-4v-8c0-4 6-4 6 0v8v-12c0-4 6-4 6 0v12v-10c0-4 6-4 6 0v18c0 12-10 18-20 18h-6c-8 0-12-6-12-12z" fill="#ffd7bf" stroke="#e7b89a" stroke-width="2"/>`),
  car: () => frame(88, 88, `<rect x="14" y="40" width="60" height="22" rx="8" fill="#ff6b4a"/><path d="M24 40l8-12h24l8 12" fill="#ff8a5b"/><circle cx="28" cy="64" r="7" fill="#3b2a24"/><circle cx="60" cy="64" r="7" fill="#3b2a24"/>`),
  feelings: () => frame(88, 88, face(44, 46, 26, "happy")),
  stop: () => frame(88, 88, `<rect x="36" y="16" width="16" height="56" rx="6" fill="#3b2a24"/><circle cx="44" cy="28" r="6" fill="#ff5a5a"/><circle cx="44" cy="44" r="6" fill="#ffc44d"/><circle cx="44" cy="60" r="6" fill="#3dcb7a"/>`),
  clock: () => frame(88, 88, `<circle cx="44" cy="46" r="26" fill="#fff" stroke="#ff6b4a" stroke-width="4"/><path d="M44 46V30M44 46l12 8" stroke="#3b2a24" stroke-width="3" stroke-linecap="round"/>`),
  toybox: () => frame(88, 88, `<rect x="16" y="36" width="56" height="32" rx="6" fill="#ff8a5b"/><rect x="16" y="28" width="56" height="12" rx="4" fill="#ffc44d"/><circle cx="36" cy="52" r="8" fill="#4aa3ff"/>`),
  rice: () => frame(88, 88, `<ellipse cx="44" cy="54" rx="26" ry="14" fill="#fff"/><ellipse cx="44" cy="50" rx="20" ry="8" fill="#f4e1b5"/>`),
  milk: () => frame(88, 88, `<rect x="30" y="24" width="28" height="44" rx="8" fill="#fff" stroke="#d9c7b2" stroke-width="2"/><rect x="34" y="34" width="20" height="18" rx="4" fill="#7ec8ff"/>`),
  bread: () => frame(88, 88, `<path d="M18 50c0-14 12-22 26-22s26 8 26 22v10H18z" fill="#f0b45a"/><path d="M22 50h44" stroke="#c9895a" stroke-width="2"/>`),
  moon: () => frame(88, 88, `<circle cx="40" cy="46" r="22" fill="#ffc44d"/><circle cx="52" cy="40" r="16" fill="#fff3da"/>`),
  mountain: () => frame(88, 88, `<polygon points="10,70 34,28 52,70" fill="#7d9a6a"/><polygon points="36,70 58,36 82,70" fill="#5f8f62"/>`),
  water: () => frame(88, 88, `<path d="M18 48c8 8 14 8 22 0s14-8 22 0 12 8 18 0" stroke="#4aa3ff" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M18 62c8 8 14 8 22 0s14-8 22 0 12 8 18 0" stroke="#7ec8ff" stroke-width="6" fill="none" stroke-linecap="round"/>`),
  fire: () => frame(88, 88, `<path d="M44 16c8 12 18 16 18 32a18 18 0 1 1-36 0c0-10 6-16 10-22 2 8 6 10 8-10z" fill="#ff6b4a"/><path d="M44 42c4 6 8 8 8 14a8 8 0 1 1-16 0c0-4 2-6 4-8 1 3 2 4 4-6z" fill="#ffc44d"/>`),
  hat: () => frame(88, 88, `<ellipse cx="44" cy="58" rx="28" ry="8" fill="#ffc44d"/><path d="M24 54c2-20 12-28 20-28s18 8 20 28" fill="#ff6b4a"/>`),
  coat: () => frame(88, 88, `<path d="M28 30l16-8 16 8-4 36H32z" fill="#4aa3ff"/><path d="M44 26v40" stroke="#fff" stroke-width="2"/>`),
  soap: () => frame(88, 88, `<rect x="22" y="32" width="44" height="28" rx="10" fill="#7ec8ff"/><circle cx="34" cy="28" r="4" fill="#fff" opacity="0.8"/><circle cx="44" cy="22" r="3" fill="#fff" opacity="0.7"/>`),
  wet: () =>
    frame(
      88,
      88,
      `<path d="M24 50c0-8 6-10 8-4v-6c0-4 6-4 6 0v6 6c0 10-8 16-14 16s-14-6-14-12z" fill="#ffd7bf"/>
      <path d="M58 18c0 8 6 10 0 16M68 22c0 8 6 10 0 16" stroke="#4aa3ff" stroke-width="4" fill="none" stroke-linecap="round"/>`,
    ),
  dry: () => frame(88, 88, `<rect x="24" y="28" width="40" height="28" rx="8" fill="#fff" stroke="#f0c27a" stroke-width="3"/><path d="M30 42h28" stroke="#ffd7bf" stroke-width="6" stroke-linecap="round"/>`),
  rinse: () =>
    frame(
      88,
      88,
      `<path d="M34 16h8v10H30l8 14h18L42 68" stroke="#4aa3ff" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
    ),
  bus: () => frame(88, 88, `<rect x="14" y="28" width="60" height="32" rx="8" fill="#ffc44d"/><rect x="22" y="34" width="14" height="12" fill="#7ec8ff"/><rect x="40" y="34" width="14" height="12" fill="#7ec8ff"/><circle cx="28" cy="62" r="5" fill="#3b2a24"/><circle cx="60" cy="62" r="5" fill="#3b2a24"/>`),
  bike: () => frame(88, 88, `<circle cx="28" cy="58" r="12" fill="none" stroke="#3b2a24" stroke-width="3"/><circle cx="62" cy="58" r="12" fill="none" stroke="#3b2a24" stroke-width="3"/><path d="M28 58l12-20h16l6 20" stroke="#ff6b4a" stroke-width="3" fill="none"/>`),
  plane: () => frame(88, 88, `<path d="M10 48h28l10-16 6 16h24l-8 8H48L36 68l-4-12H18z" fill="#7ec8ff"/>`),
  sad: () => frame(88, 88, face(44, 44, 26, "sad")),
  happy: () => frame(88, 88, face(44, 44, 26, "happy")),
  angry: () => frame(88, 88, face(44, 44, 26, "angry")),
  scared: () => frame(88, 88, face(44, 44, 26, "scared")),
  run: () => frame(88, 88, `${face(36, 28, 14)}${shirt(36, 44, "#ff6b4a")}<path d="M28 70l10-12 8 6 10-8" stroke="#6b4638" stroke-width="4" fill="none" stroke-linecap="round"/>`),
  "eyes-closed": () => frame(88, 88, face(44, 44, 26, "closed")),
  follow: () => frame(88, 88, `${face(28, 40, 14)}${face(58, 44, 12, "happy")}<path d="M40 58h12" stroke="#ff6b4a" stroke-width="3"/>`),
  no: () => frame(88, 88, `<circle cx="44" cy="46" r="24" fill="none" stroke="#ff6b4a" stroke-width="6"/><path d="M30 32l28 28" stroke="#ff6b4a" stroke-width="6" stroke-linecap="round"/>`),
  candy: () => frame(88, 88, `<ellipse cx="44" cy="46" rx="16" ry="12" fill="#ff6b4a"/><polygon points="28,46 14,36 14,56" fill="#ffc44d"/><polygon points="60,46 74,36 74,56" fill="#ffc44d"/>`),
  hold: () => frame(88, 88, `${face(30, 34, 14)}${face(60, 40, 16)}<path d="M36 62h16" stroke="#ffd7bf" stroke-width="8" stroke-linecap="round"/>`),
  stand: () => frame(88, 88, `${face(44, 28, 14)}${shirt(44, 44)}<path d="M36 72v-12M52 72v-12" stroke="#6b4638" stroke-width="4" stroke-linecap="round"/>`),
  same: () => frame(88, 88, `${apple(28, 40, "#ff5a5a")}${apple(60, 40, "#ff5a5a")}`),
  more: () => frame(88, 88, `${apple(24, 36, "#ff5a5a")}${apple(44, 48, "#ff5a5a")}${apple(34, 58, "#ff5a5a")}`),
  less: () => frame(88, 88, apple(44, 40, "#ff5a5a")),
  yes: () => frame(88, 88, `<circle cx="44" cy="46" r="24" fill="#3dcb7a"/><path d="M30 46l8 8 16-16" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`),
  ask: () => frame(88, 88, `<circle cx="44" cy="40" r="22" fill="#4aa3ff"/><text x="44" y="50" text-anchor="middle" font-size="28" font-weight="800" fill="#fff">?</text>`),
  enough: () => frame(88, 88, `<circle cx="44" cy="46" r="24" fill="#3dcb7a"/><path d="M32 46h24" stroke="#fff" stroke-width="5" stroke-linecap="round"/>`),
  big: () => frame(88, 88, `<circle cx="44" cy="48" r="28" fill="#ff6b4a"/>`),
  small: () => frame(88, 88, `<circle cx="44" cy="50" r="12" fill="#ffc44d"/>`),
  mid: () => frame(88, 88, `<circle cx="44" cy="48" r="18" fill="#ff8a5b"/>`),
  different: () => frame(88, 88, `${apple(30, 42, "#ff5a5a")}<rect x="48" y="30" width="22" height="22" rx="4" fill="#4aa3ff"/>`),
  long: () => frame(88, 88, `<rect x="16" y="40" width="56" height="8" rx="4" fill="#6b4638"/>`),
  short: () => frame(88, 88, `<rect x="30" y="40" width="22" height="8" rx="4" fill="#c9895a"/>`),
  blocks: () => frame(88, 88, `<rect x="18" y="44" width="22" height="22" fill="#ff6b4a"/><rect x="40" y="28" width="22" height="22" fill="#4aa3ff"/><rect x="40" y="50" width="22" height="16" fill="#ffc44d"/>`),
  dad: () => frame(88, 88, `${face(44, 34, 18)}${shirt(44, 54, "#3d94f5")}`),
  mom: () => frame(88, 88, `${face(44, 34, 18)}${shirt(44, 54, "#ff8ad4")}<path d="M28 24c4-10 28-10 32 0" stroke="#6b4638" stroke-width="4" fill="none"/>`),
  baby: () => frame(88, 88, `${face(44, 40, 20)}<circle cx="44" cy="64" r="10" fill="#ffd7bf"/>`),
  eye: () => frame(88, 88, `<ellipse cx="44" cy="46" rx="26" ry="16" fill="#fff" stroke="#3b2a24" stroke-width="3"/><circle cx="44" cy="46" r="8" fill="#4aa3ff"/><circle cx="44" cy="46" r="4" fill="#3b2a24"/>`),
  eyes: () =>
    frame(
      88,
      88,
      `<ellipse cx="28" cy="46" rx="16" ry="10" fill="#fff" stroke="#3b2a24" stroke-width="2"/><ellipse cx="60" cy="46" rx="16" ry="10" fill="#fff" stroke="#3b2a24" stroke-width="2"/><circle cx="28" cy="46" r="4" fill="#3b2a24"/><circle cx="60" cy="46" r="4" fill="#3b2a24"/>`,
    ),
  nose: () => frame(88, 88, `<path d="M44 22c8 10 10 18 6 28-6 2-12 2-16-2 4-8 4-16 10-26z" fill="#ffd7bf" stroke="#e07a62" stroke-width="3"/>`),
  mouth: () => frame(88, 88, `<path d="M18 40c8 18 44 18 52 0" stroke="#e07a62" stroke-width="8" fill="#ff8a9a" stroke-linecap="round"/>`),
  hands: () =>
    frame(
      88,
      88,
      `<path d="M18 48c0-8 6-8 8-2v-8c0-4 6-4 6 0v8v-10c0-4 6-4 6 0v18c0 10-8 16-16 16h-4c-6 0-10-4-10-10z" fill="#ffd7bf"/>
      <path d="M48 48c0-8 6-8 8-2v-8c0-4 6-4 6 0v8v-10c0-4 6-4 6 0v18c0 10-8 16-16 16h-4c-6 0-10-4-10-10z" fill="#ffd7bf"/>`,
    ),
  cat: () => frame(88, 88, cat(44, 36)),
  dog: () => frame(88, 88, dog(44, 36)),
  bird: () => frame(88, 88, bird(44, 36)),
  fish: () => frame(88, 88, fish(44, 36)),
  "two-cats": () => frame(120, 88, `${cat(36, 34)}${cat(84, 34)}`),
  "ball-red": () => ball("#ff5a5a"),
  "ball-yellow": () => ball("#ffc83d"),
  "ball-blue": () => ball("#4aa3ff"),
  "ball-green": () => ball("#3dcb7a"),
  "swatch-red": () => ball("#ff5a5a"),
  "swatch-yellow": () => ball("#ffc83d"),
  "swatch-blue": () => ball("#4aa3ff"),
  "swatch-green": () => ball("#3dcb7a"),
  "apple-red": () => frame(88, 88, apple(44, 40, "#ff5a5a")),
  "apple-yellow": () => frame(88, 88, apple(44, 40, "#ffc83d")),
  "shape-circle": () => frame(88, 88, `<circle cx="44" cy="46" r="26" fill="#ff8a5b"/>`),
  "shape-square": () => frame(88, 88, `<rect x="18" y="20" width="52" height="52" rx="8" fill="#4aa3ff"/>`),
  "shape-triangle": () => frame(88, 88, `<polygon points="44,16 74,70 14,70" fill="#3dcb7a"/>`),
  apple: () => frame(88, 88, apple(44, 40, "#ff5a5a")),
  star: () => frame(88, 88, star(44, 48, 26)),
};

for (const [name, total] of [
  ["apples-2", 2],
  ["apples-3", 3],
  ["apples-5", 5],
]) {
  ICONS[name] = () => countIcons("apple", total);
}
for (const total of [3, 4, 5]) ICONS[`stars-${total}`] = () => countIcons("star", total);
for (const digit of [1, 2, 3, 4, 5, 6, 7, 12]) {
  const draw = () =>
    frame(88, 88, `<text x="44" y="58" text-anchor="middle" font-size="42" font-family="Nunito, sans-serif" font-weight="800" fill="#ff6b4a">${digit}</text>`);
  ICONS[`num-${digit}`] = draw;
  if (digit === 2 || digit === 3 || digit === 5) ICONS[`number-${digit}`] = draw;
}

fs.mkdirSync(outDir, { recursive: true });
const written = [];
for (const [slug, draw] of Object.entries(ICONS)) {
  fs.writeFileSync(path.join(outDir, `${slug}.svg`), draw());
  written.push(slug);
}

function rewrite(file) {
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  const missing = [];
  const swap = (token) => {
    if (typeof token !== "string" || token.startsWith("/")) return token;
    const slug = SLUG[token];
    if (!slug || !ICONS[slug]) missing.push(token);
    return slug ? `/art/${slug}.svg` : token;
  };
  if (data.listenVisual) data.listenVisual = swap(data.listenVisual);
  for (const step of data.steps ?? []) {
    if (step.visual) step.visual = swap(step.visual);
    for (const choice of step.choices ?? []) {
      if (choice.visual) choice.visual = swap(choice.visual);
    }
  }
  if (missing.length) throw new Error(`${path.basename(file)} 缺少插画：${missing.join(", ")}`);
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
}

for (const folder of ["levels", "games"]) {
  for (const name of fs.readdirSync(path.join(root, "content/fixtures", folder))) {
    if (name.endsWith(".json")) rewrite(path.join(root, "content/fixtures", folder, name));
  }
}

console.log(`插画 ${written.length} 张，夹具已指向 /art/*.svg`);
