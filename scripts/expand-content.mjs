import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const levelsDir = path.join(root, "content/fixtures/levels");

function svg(body) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 88 88"><rect width="88" height="88" rx="24" fill="#fff3da"/>${body}</svg>\n`;
}

const extraArt = {
  "num-8": svg(`<text x="44" y="58" text-anchor="middle" font-size="42" font-weight="800" fill="#ff6b4a">8</text>`),
  "num-9": svg(`<text x="44" y="58" text-anchor="middle" font-size="42" font-weight="800" fill="#ff6b4a">9</text>`),
  "num-10": svg(`<text x="44" y="58" text-anchor="middle" font-size="42" font-weight="800" fill="#ff6b4a">10</text>`),
  jump: svg(`<circle cx="44" cy="28" r="12" fill="#ffd7bf"/><path d="M32 46h24l-4 22h-16z" fill="#ff6b4a"/><path d="M30 70l8-14M58 70l-8-14" stroke="#6b4638" stroke-width="4" stroke-linecap="round"/>`),
  brush: svg(`<rect x="40" y="16" width="8" height="28" rx="3" fill="#4aa3ff"/><path d="M36 44h16l-2 22h-12z" fill="#fff"/><path d="M38 62h12" stroke="#7ec8ff" stroke-width="3"/>`),
  phone: svg(`<rect x="30" y="16" width="28" height="52" rx="6" fill="#3b2a24"/><rect x="34" y="24" width="20" height="32" rx="2" fill="#7ec8ff"/>`),
  tooth: svg(`<path d="M28 28c0-8 32-8 32 0 0 18-4 34-8 34-4 0-4-12-8-12s-4 12-8 12c-4 0-8-16-8-34z" fill="#fff" stroke="#e7b89a" stroke-width="3"/>`),
};

for (const [name, markup] of Object.entries(extraArt)) {
  fs.writeFileSync(path.join(root, "public/art", `${name}.svg`), markup);
}

function read(id) {
  return JSON.parse(fs.readFileSync(path.join(levelsDir, `${id}.json`), "utf8"));
}
function write(level) {
  fs.writeFileSync(path.join(levelsDir, `${level.id}.json`), `${JSON.stringify(level, null, 2)}\n`);
}

function addStep(id, step) {
  const level = read(id);
  if (!level.steps.some((item) => item.id === step.id)) level.steps.push(step);
  write(level);
}

addStep("eng-starter-03", {
  id: "q-speak-b",
  type: "speak",
  ages: ["B"],
  promptText: "跟读：fish",
  promptSpeak: "fish",
  speakText: "fish",
  answer: "spoken",
});
addStep("eng-starter-05", {
  id: "q-speak-b",
  type: "speak",
  ages: ["B"],
  promptText: "跟读：nose",
  promptSpeak: "nose",
  speakText: "nose",
  answer: "spoken",
});
addStep("lang-starter-02", {
  id: "q-speak-b",
  type: "speak",
  ages: ["B"],
  promptText: "跟读：喵喵",
  promptSpeak: "喵喵",
  speakText: "喵喵",
  answer: "spoken",
});
addStep("lang-starter-02", {
  id: "q-speak-c",
  type: "speak",
  ages: ["C"],
  promptText: "跟读：小猫喵喵叫",
  promptSpeak: "小猫喵喵叫",
  speakText: "小猫喵喵叫",
  answer: "spoken",
});
addStep("lang-starter-04", {
  id: "q-speak-b",
  type: "speak",
  ages: ["B"],
  promptText: "跟读：苹果",
  promptSpeak: "苹果",
  speakText: "苹果",
  answer: "spoken",
});
addStep("lang-starter-04", {
  id: "q-speak-c",
  type: "speak",
  ages: ["C"],
  promptText: "跟读：我要吃苹果",
  promptSpeak: "我要吃苹果",
  speakText: "我要吃苹果",
  answer: "spoken",
});

addStep("math-starter-01", {
  id: "q-drag",
  type: "drag",
  promptText: "苹果放进水果篮，星星放进星星盒",
  promptSpeak: "分一分",
  baskets: [
    { id: "fruit", label: "水果", visual: "/art/apple-red.svg" },
    { id: "sky", label: "星星", visual: "/art/star.svg" },
  ],
  choices: [
    { id: "apple", label: "苹果", visual: "/art/apple-red.svg", basket: "fruit" },
    { id: "star", label: "星星", visual: "/art/star.svg", basket: "sky" },
  ],
  answer: "placed",
});
addStep("math-starter-04", {
  id: "q-sort",
  type: "sort",
  promptText: "从小到大排一排",
  promptSpeak: "从小到大",
  choices: [
    { id: "small", label: "小", visual: "/art/small.svg" },
    { id: "mid", label: "中", visual: "/art/mid.svg" },
    { id: "big", label: "大", visual: "/art/big.svg" },
  ],
  answer: ["small", "mid", "big"],
});
addStep("math-starter-05", {
  id: "q-drag",
  type: "drag",
  promptText: "圆形进圆盒，方形进方盒",
  promptSpeak: "分一分形状",
  baskets: [
    { id: "round", label: "圆盒", visual: "/art/shape-circle.svg" },
    { id: "box", label: "方盒", visual: "/art/shape-square.svg" },
  ],
  choices: [
    { id: "circle", label: "圆形", visual: "/art/shape-circle.svg", basket: "round" },
    { id: "square", label: "方形", visual: "/art/shape-square.svg", basket: "box" },
  ],
  answer: "placed",
});
addStep("math-life-05", {
  id: "q-drag",
  type: "drag",
  promptText: "球进圆盒，积木进方盒",
  promptSpeak: "整理玩具",
  baskets: [
    { id: "round", label: "圆盒", visual: "/art/shape-circle.svg" },
    { id: "box", label: "方盒", visual: "/art/shape-square.svg" },
  ],
  choices: [
    { id: "ball", label: "球", visual: "/art/ball-red.svg", basket: "round" },
    { id: "block", label: "积木", visual: "/art/blocks.svg", basket: "box" },
  ],
  answer: "placed",
});
addStep("lang-starter-05", {
  id: "q-drag",
  type: "drag",
  promptText: "日配太阳，月配月亮",
  promptSpeak: "找一找",
  baskets: [
    { id: "sun", label: "太阳", visual: "/art/sun.svg" },
    { id: "moon", label: "月亮", visual: "/art/moon.svg" },
  ],
  choices: [
    { id: "ri", label: "日", visual: "/art/sun.svg", basket: "sun" },
    { id: "yue", label: "月", visual: "/art/moon.svg", basket: "moon" },
  ],
  answer: "placed",
});
addStep("life-starter-02", {
  id: "q-sort",
  type: "sort",
  promptText: "洗手要按顺序排好",
  promptSpeak: "排一排洗手",
  choices: [
    { id: "wet", label: "打湿", visual: "/art/wet.svg" },
    { id: "soap", label: "搓皂", visual: "/art/soap.svg" },
    { id: "rinse", label: "冲水", visual: "/art/rinse.svg" },
    { id: "dry", label: "擦干", visual: "/art/dry.svg" },
  ],
  answer: ["wet", "soap", "rinse", "dry"],
});
addStep("life-starter-03", {
  id: "q-drag",
  type: "drag",
  promptText: "地上跑的放一边，天上飞的放一边",
  promptSpeak: "分一分",
  baskets: [
    { id: "ground", label: "地上", visual: "/art/car.svg" },
    { id: "sky", label: "天上", visual: "/art/plane.svg" },
  ],
  choices: [
    { id: "car", label: "汽车", visual: "/art/car.svg", basket: "ground" },
    { id: "plane", label: "飞机", visual: "/art/plane.svg", basket: "sky" },
  ],
  answer: "placed",
});

function level(doc) {
  return {
    schemaVersion: 1,
    ageBand: ["A", "B", "C"],
    rewardStars: 3,
    ...doc,
  };
}

function tap(id, prompt, speak, choices, answer, ages) {
  return {
    id,
    type: "tap",
    promptText: prompt,
    promptSpeak: speak,
    choices,
    answer,
    ...(ages ? { ages } : {}),
  };
}
function choice(id, label, visual) {
  return { id, label, visual };
}

const packs = [
  {
    packId: "eng-starter",
    items: [
      level({
        id: "eng-starter-06",
        packId: "eng-starter",
        title: "Family",
        order: 6,
        vocab: ["mom", "dad", "baby"],
        audioIntro: "/audio/eng-starter-06/intro.mp3",
        introScript: "This is my family. Mom, dad, and a little baby.",
        introScriptZh: "这是我的家人。妈妈、爸爸，还有小宝宝。",
        listenTitle: "Family",
        listenVisual: "/art/listen-hello.svg",
        nextLevelId: "eng-starter-07",
        steps: [
          tap("q1", "听「mom」，点妈妈", "mom", [choice("dad", "爸爸", "/art/dad.svg"), choice("mom", "妈妈", "/art/mom.svg"), choice("baby", "宝宝", "/art/baby.svg")], "mom"),
          tap("q2", "听「dad」，点爸爸", "dad", [choice("mom", "妈妈", "/art/mom.svg"), choice("dad", "爸爸", "/art/dad.svg"), choice("baby", "宝宝", "/art/baby.svg")], "dad"),
          { id: "q3", type: "speak", ages: ["B"], promptText: "跟读：mom", promptSpeak: "mom", speakText: "mom", answer: "spoken" },
          { id: "q4", type: "speak", ages: ["C"], promptText: "跟读：This is my mom", promptSpeak: "This is my mom", speakText: "This is my mom", answer: "spoken" },
        ],
        rewardCopy: "Family star!",
        rewardCopyZh: "家人真棒！",
      }),
      level({
        id: "eng-starter-07",
        packId: "eng-starter",
        title: "Food",
        order: 7,
        vocab: ["apple", "milk", "bread"],
        audioIntro: "/audio/eng-starter-07/intro.mp3",
        introScript: "Yummy food. Apple, milk, and bread.",
        introScriptZh: "好吃的东西。苹果、牛奶和面包。",
        listenTitle: "Food",
        listenVisual: "/art/listen-meal.svg",
        nextLevelId: "eng-starter-08",
        steps: [
          tap("q1", "听「apple」，点苹果", "apple", [choice("milk", "牛奶", "/art/milk.svg"), choice("apple", "苹果", "/art/apple-red.svg"), choice("bread", "面包", "/art/bread.svg")], "apple"),
          tap("q2", "听「milk」，点牛奶", "milk", [choice("bread", "面包", "/art/bread.svg"), choice("milk", "牛奶", "/art/milk.svg"), choice("apple", "苹果", "/art/apple-red.svg")], "milk"),
          { id: "q3", type: "speak", ages: ["B"], promptText: "跟读：apple", promptSpeak: "apple", speakText: "apple", answer: "spoken" },
        ],
        rewardCopy: "Yummy!",
        rewardCopyZh: "好吃！",
      }),
      level({
        id: "eng-starter-08",
        packId: "eng-starter",
        title: "Actions",
        order: 8,
        vocab: ["run", "jump", "stand"],
        audioIntro: "/audio/eng-starter-08/intro.mp3",
        introScript: "Let's move! Run, jump, and stand.",
        introScriptZh: "动一动。跑一跑，跳一跳，站好。",
        listenTitle: "Actions",
        listenVisual: "/art/run.svg",
        nextLevelId: "eng-starter-09",
        steps: [
          tap("q1", "听「run」，点跑步", "run", [choice("jump", "跳", "/art/jump.svg"), choice("run", "跑", "/art/run.svg"), choice("stand", "站", "/art/stand.svg")], "run"),
          tap("q2", "听「jump」，点跳", "jump", [choice("stand", "站", "/art/stand.svg"), choice("jump", "跳", "/art/jump.svg"), choice("run", "跑", "/art/run.svg")], "jump"),
          { id: "q3", type: "speak", ages: ["C"], promptText: "跟读：I can jump", promptSpeak: "I can jump", speakText: "I can jump", answer: "spoken" },
        ],
        rewardCopy: "You can move!",
        rewardCopyZh: "动得真好！",
      }),
      level({
        id: "eng-starter-09",
        packId: "eng-starter",
        title: "Clothes",
        order: 9,
        vocab: ["hat", "coat"],
        audioIntro: "/audio/eng-starter-09/intro.mp3",
        introScript: "A hat for the sun. A coat when it is cold.",
        introScriptZh: "太阳大，戴帽子。天冷了，穿外套。",
        listenTitle: "Clothes",
        listenVisual: "/art/hat.svg",
        nextLevelId: "eng-starter-10",
        steps: [
          tap("q1", "听「hat」，点帽子", "hat", [choice("coat", "外套", "/art/coat.svg"), choice("hat", "帽子", "/art/hat.svg")], "hat"),
          tap("q2", "听「coat」，点外套", "coat", [choice("hat", "帽子", "/art/hat.svg"), choice("coat", "外套", "/art/coat.svg")], "coat"),
          { id: "q3", type: "speak", ages: ["B"], promptText: "跟读：hat", promptSpeak: "hat", speakText: "hat", answer: "spoken" },
        ],
        rewardCopy: "Nice clothes!",
        rewardCopyZh: "穿对啦！",
      }),
      level({
        id: "eng-starter-10",
        packId: "eng-starter",
        title: "Review",
        order: 10,
        vocab: ["mom", "apple", "run"],
        audioIntro: "/audio/eng-starter-10/intro.mp3",
        introScript: "Let's review. Family, food, and actions.",
        introScriptZh: "复习一下。家人、食物，还有动作。",
        listenTitle: "Review",
        listenVisual: "/art/listen-hello.svg",
        steps: [
          tap("q1", "听「apple」，点食物", "apple", [choice("mom", "妈妈", "/art/mom.svg"), choice("apple", "苹果", "/art/apple-red.svg"), choice("run", "跑", "/art/run.svg")], "apple"),
          {
            id: "q2",
            type: "drag",
            promptText: "家人放一边，食物放一边",
            promptSpeak: "sort them",
            baskets: [
              { id: "family", label: "家人", visual: "/art/mom.svg" },
              { id: "food", label: "食物", visual: "/art/apple-red.svg" },
            ],
            choices: [
              { id: "dad", label: "爸爸", visual: "/art/dad.svg", basket: "family" },
              { id: "apple", label: "苹果", visual: "/art/apple-red.svg", basket: "food" },
            ],
            answer: "placed",
          },
          { id: "q3", type: "speak", ages: ["C"], promptText: "跟读：I like apples", promptSpeak: "I like apples", speakText: "I like apples", answer: "spoken" },
        ],
        rewardCopy: "Review star!",
        rewardCopyZh: "复习完成！",
      }),
    ],
  },
  {
    packId: "lang-starter",
    items: [
      level({
        id: "lang-starter-06",
        packId: "lang-starter",
        title: "数字字",
        order: 6,
        vocab: ["一", "二", "三"],
        audioIntro: "/audio/lang-starter-06/intro.mp3",
        introScript: "一是一根棍，二是两横，三是三横。",
        introScriptZh: "一是一根棍，二是两横，三是三横。",
        listenTitle: "数字字",
        listenVisual: "/art/listen-numbers.svg",
        nextLevelId: "lang-starter-07",
        steps: [
          tap("q1", "听「二」，点二", "二", [choice("1", "一", "/art/num-1.svg"), choice("2", "二", "/art/num-2.svg"), choice("3", "三", "/art/num-3.svg")], "2"),
          tap("q2", "听「三」，点三", "三", [choice("2", "二", "/art/num-2.svg"), choice("3", "三", "/art/num-3.svg"), choice("1", "一", "/art/num-1.svg")], "3"),
          { id: "q3", type: "speak", ages: ["B"], promptText: "跟读：二", promptSpeak: "二", speakText: "二", answer: "spoken" },
        ],
        rewardCopy: "数字字认识啦！",
        rewardCopyZh: "数字字认识啦！",
      }),
      level({
        id: "lang-starter-07",
        packId: "lang-starter",
        title: "反义词",
        order: 7,
        vocab: ["大", "小", "长", "短"],
        audioIntro: "/audio/lang-starter-07/intro.mp3",
        introScript: "大的对面是小，长的对面是短。",
        introScriptZh: "大的对面是小，长的对面是短。",
        listenTitle: "反义词",
        listenVisual: "/art/listen-size.svg",
        nextLevelId: "lang-starter-08",
        steps: [
          tap("q1", "「大」的反面是？", "小", [choice("big", "大", "/art/big.svg"), choice("small", "小", "/art/small.svg"), choice("long", "长", "/art/long.svg")], "small"),
          tap("q2", "「长」的反面是？", "短", [choice("short", "短", "/art/short.svg"), choice("long", "长", "/art/long.svg"), choice("big", "大", "/art/big.svg")], "short"),
          { id: "q3", type: "speak", ages: ["C"], promptText: "跟读：大的和小的", promptSpeak: "大的和小的", speakText: "大的和小的", answer: "spoken" },
        ],
        rewardCopy: "反义词真清楚！",
        rewardCopyZh: "反义词真清楚！",
      }),
      level({
        id: "lang-starter-08",
        packId: "lang-starter",
        title: "一句小诗",
        order: 8,
        vocab: ["太阳", "月亮"],
        audioIntro: "/audio/lang-starter-08/intro.mp3",
        introScript: "太阳出来红彤彤，月亮出来亮晶晶。",
        introScriptZh: "太阳出来红彤彤，月亮出来亮晶晶。",
        listenTitle: "一句小诗",
        listenVisual: "/art/sun.svg",
        nextLevelId: "lang-starter-09",
        steps: [
          tap("q1", "听「太阳」，点太阳", "太阳", [choice("moon", "月亮", "/art/moon.svg"), choice("sun", "太阳", "/art/sun.svg")], "sun"),
          { id: "q2", type: "speak", ages: ["B"], promptText: "跟读：太阳", promptSpeak: "太阳", speakText: "太阳", answer: "spoken" },
          { id: "q3", type: "speak", ages: ["C"], promptText: "跟读：月亮出来亮晶晶", promptSpeak: "月亮出来亮晶晶", speakText: "月亮出来亮晶晶", answer: "spoken" },
        ],
        rewardCopy: "小诗读完啦！",
        rewardCopyZh: "小诗读完啦！",
      }),
      level({
        id: "lang-starter-09",
        packId: "lang-starter",
        title: "象形再认",
        order: 9,
        vocab: ["山", "水", "火"],
        audioIntro: "/audio/lang-starter-09/intro.mp3",
        introScript: "山高高，水弯弯，火苗跳。",
        introScriptZh: "山高高，水弯弯，火苗跳。",
        listenTitle: "象形再认",
        listenVisual: "/art/mountain.svg",
        nextLevelId: "lang-starter-10",
        steps: [
          tap("q1", "听「水」，点水", "水", [choice("mountain", "山", "/art/mountain.svg"), choice("water", "水", "/art/water.svg"), choice("fire", "火", "/art/fire.svg")], "water"),
          {
            id: "q2",
            type: "drag",
            promptText: "山配高山，火配火苗",
            promptSpeak: "配一配",
            baskets: [
              { id: "mountain", label: "山", visual: "/art/mountain.svg" },
              { id: "fire", label: "火", visual: "/art/fire.svg" },
            ],
            choices: [
              { id: "shan", label: "山", visual: "/art/mountain.svg", basket: "mountain" },
              { id: "huo", label: "火", visual: "/art/fire.svg", basket: "fire" },
            ],
            answer: "placed",
          },
        ],
        rewardCopy: "象形字又认识啦！",
        rewardCopyZh: "象形字又认识啦！",
      }),
      level({
        id: "lang-starter-10",
        packId: "lang-starter",
        title: "语文复习",
        order: 10,
        vocab: ["猫", "红", "日"],
        audioIntro: "/audio/lang-starter-10/intro.mp3",
        introScript: "复习小猫、红色和太阳。",
        introScriptZh: "复习小猫、红色和太阳。",
        listenTitle: "语文复习",
        listenVisual: "/art/listen-animals.svg",
        steps: [
          tap("q1", "听「红」，点红色", "红", [choice("cat", "猫", "/art/cat.svg"), choice("red", "红", "/art/swatch-red.svg"), choice("sun", "日", "/art/sun.svg")], "red"),
          {
            id: "q2",
            type: "sort",
            promptText: "按一、二、三排好",
            promptSpeak: "排好一二三",
            choices: [
              { id: "one", label: "一", visual: "/art/num-1.svg" },
              { id: "two", label: "二", visual: "/art/num-2.svg" },
              { id: "three", label: "三", visual: "/art/num-3.svg" },
            ],
            answer: ["one", "two", "three"],
          },
        ],
        rewardCopy: "语文复习完成！",
        rewardCopyZh: "语文复习完成！",
      }),
    ],
  },
  {
    packId: "life-starter",
    items: [
      level({
        id: "life-starter-06",
        packId: "life-starter",
        title: "刷牙",
        order: 6,
        vocab: ["牙刷", "牙膏"],
        audioIntro: "/audio/life-starter-06/intro.mp3",
        introScript: "刷牙要挤一点牙膏，上上下下刷干净。",
        introScriptZh: "刷牙要挤一点牙膏，上上下下刷干净。",
        listenTitle: "刷牙",
        listenVisual: "/art/tooth.svg",
        nextLevelId: "life-starter-07",
        steps: [
          tap("q1", "刷牙用什么？", "牙刷", [choice("brush", "牙刷", "/art/brush.svg"), choice("soap", "肥皂", "/art/soap.svg")], "brush"),
          {
            id: "q2",
            type: "sort",
            promptText: "先挤牙膏，再刷牙，最后漱口",
            promptSpeak: "排一排刷牙",
            choices: [
              { id: "paste", label: "挤牙膏", visual: "/art/tooth.svg" },
              { id: "brush", label: "刷牙", visual: "/art/brush.svg" },
              { id: "rinse", label: "漱口", visual: "/art/rinse.svg" },
            ],
            answer: ["paste", "brush", "rinse"],
          },
        ],
        rewardCopy: "牙齿亮晶晶！",
        rewardCopyZh: "牙齿亮晶晶！",
      }),
      level({
        id: "life-starter-07",
        packId: "life-starter",
        title: "整理房间",
        order: 7,
        vocab: ["玩具", "盒子"],
        audioIntro: "/audio/life-starter-07/intro.mp3",
        introScript: "玩完的玩具要回家，放进盒子里。",
        introScriptZh: "玩完的玩具要回家，放进盒子里。",
        listenTitle: "整理",
        listenVisual: "/art/toybox.svg",
        nextLevelId: "life-starter-08",
        steps: [
          {
            id: "q1",
            type: "drag",
            promptText: "玩具放进盒子，苹果留在桌上",
            promptSpeak: "整理一下",
            baskets: [
              { id: "box", label: "玩具盒", visual: "/art/toybox.svg" },
              { id: "table", label: "桌子", visual: "/art/apple-red.svg" },
            ],
            choices: [
              { id: "ball", label: "球", visual: "/art/ball-red.svg", basket: "box" },
              { id: "apple", label: "苹果", visual: "/art/apple-red.svg", basket: "table" },
            ],
            answer: "placed",
          },
          { id: "q2", type: "speak", ages: ["B"], promptText: "跟读：收玩具", promptSpeak: "收玩具", speakText: "收玩具", answer: "spoken" },
        ],
        rewardCopy: "房间整齐啦！",
        rewardCopyZh: "房间整齐啦！",
      }),
      level({
        id: "life-starter-08",
        packId: "life-starter",
        title: "吃饭礼貌",
        order: 8,
        vocab: ["请", "谢谢"],
        audioIntro: "/audio/life-starter-08/intro.mp3",
        introScript: "想吃的时候说请，吃完说谢谢。",
        introScriptZh: "想吃的时候说请，吃完说谢谢。",
        listenTitle: "吃饭",
        listenVisual: "/art/listen-meal.svg",
        nextLevelId: "life-starter-09",
        steps: [
          tap("q1", "想要苹果，先说什么？", "请", [choice("please", "请", "/art/apple-red.svg"), choice("run", "跑开", "/art/run.svg")], "please"),
          { id: "q2", type: "speak", ages: ["C"], promptText: "跟读：请给我苹果", promptSpeak: "请给我苹果", speakText: "请给我苹果", answer: "spoken" },
          { id: "q3", type: "speak", ages: ["B"], promptText: "跟读：谢谢", promptSpeak: "谢谢", speakText: "谢谢", answer: "spoken" },
        ],
        rewardCopy: "有礼貌！",
        rewardCopyZh: "有礼貌！",
      }),
      level({
        id: "life-starter-09",
        packId: "life-starter",
        title: "求助",
        order: 9,
        vocab: ["帮忙", "电话"],
        audioIntro: "/audio/life-starter-09/intro.mp3",
        introScript: "需要帮助就告诉大人。要紧的事可以打电话。",
        introScriptZh: "需要帮助就告诉大人。要紧的事可以打电话。",
        listenTitle: "求助",
        listenVisual: "/art/phone.svg",
        nextLevelId: "life-starter-10",
        steps: [
          tap("q1", "找不到妈妈，可以？", "告诉大人", [choice("tell", "告诉大人", "/art/mom.svg"), choice("follow", "跟陌生人", "/art/no.svg")], "tell"),
          tap("q2", "要紧的事用什么？", "电话", [choice("phone", "电话", "/art/phone.svg"), choice("candy", "糖果", "/art/candy.svg")], "phone"),
        ],
        rewardCopy: "会求助，真勇敢！",
        rewardCopyZh: "会求助，真勇敢！",
      }),
      level({
        id: "life-starter-10",
        packId: "life-starter",
        title: "户外安全",
        order: 10,
        vocab: ["停", "牵手"],
        audioIntro: "/audio/life-starter-10/intro.mp3",
        introScript: "出门牵着大人的手。红灯停一停。",
        introScriptZh: "出门牵着大人的手。红灯停一停。",
        listenTitle: "户外",
        listenVisual: "/art/stop.svg",
        steps: [
          tap("q1", "红灯了，应该？", "停", [choice("run", "跑", "/art/run.svg"), choice("stop", "停", "/art/stop.svg")], "stop"),
          {
            id: "q2",
            type: "sort",
            promptText: "过马路：先停，再牵手，再走",
            promptSpeak: "排一排",
            choices: [
              { id: "stop", label: "停下", visual: "/art/stop.svg" },
              { id: "hold", label: "牵手", visual: "/art/hold.svg" },
              { id: "go", label: "再走", visual: "/art/stand.svg" },
            ],
            answer: ["stop", "hold", "go"],
          },
        ],
        rewardCopy: "出门也安全！",
        rewardCopyZh: "出门也安全！",
      }),
    ],
  },
  {
    packId: "math-starter",
    items: [
      level({
        id: "math-starter-06",
        packId: "math-starter",
        title: "数到十",
        order: 6,
        vocab: ["6", "7", "8", "9", "10"],
        audioIntro: "/audio/math-starter-06/intro.mp3",
        introScript: "五之后是六、七、八、九、十。",
        introScriptZh: "五之后是六、七、八、九、十。",
        listenTitle: "数到十",
        listenVisual: "/art/listen-numbers.svg",
        nextLevelId: "math-starter-07",
        steps: [
          tap("q1", "听「八」，点 8", "八", [choice("6", "6", "/art/num-6.svg"), choice("8", "8", "/art/num-8.svg"), choice("10", "10", "/art/num-10.svg")], "8"),
          tap("q2", "听「十」，点 10", "十", [choice("9", "9", "/art/num-9.svg"), choice("10", "10", "/art/num-10.svg"), choice("7", "7", "/art/num-7.svg")], "10"),
          { id: "q3", type: "speak", ages: ["B"], promptText: "跟读：十", promptSpeak: "十", speakText: "十", answer: "spoken" },
        ],
        rewardCopy: "能数到十啦！",
        rewardCopyZh: "能数到十啦！",
      }),
      level({
        id: "math-starter-07",
        packId: "math-starter",
        title: "第几",
        order: 7,
        vocab: ["第1", "第2", "第3"],
        audioIntro: "/audio/math-starter-07/intro.mp3",
        introScript: "排队时，最前面是第 1，后面是第 2、第 3。",
        introScriptZh: "排队时，最前面是第 1，后面是第 2、第 3。",
        listenTitle: "第几",
        listenVisual: "/art/listen-queue.svg",
        nextLevelId: "math-starter-08",
        steps: [
          tap("q1", "最前面是第几？", "第1", [choice("2", "第2", "/art/num-2.svg"), choice("1", "第1", "/art/num-1.svg"), choice("3", "第3", "/art/num-3.svg")], "1"),
          {
            id: "q2",
            type: "sort",
            promptText: "按第 1、第 2、第 3 排好",
            promptSpeak: "排好顺序",
            choices: [
              { id: "first", label: "第1", visual: "/art/num-1.svg" },
              { id: "second", label: "第2", visual: "/art/num-2.svg" },
              { id: "third", label: "第3", visual: "/art/num-3.svg" },
            ],
            answer: ["first", "second", "third"],
          },
        ],
        rewardCopy: "第几都知道！",
        rewardCopyZh: "第几都知道！",
      }),
      level({
        id: "math-starter-08",
        packId: "math-starter",
        title: "找规律",
        order: 8,
        vocab: ["规律", "下一个"],
        audioIntro: "/audio/math-starter-08/intro.mp3",
        introScript: "红、黄、红、黄，下一个还是红。",
        introScriptZh: "红、黄、红、黄，下一个还是红。",
        listenTitle: "规律",
        listenVisual: "/art/listen-colors.svg",
        nextLevelId: "math-starter-09",
        steps: [
          tap("q1", "红黄红黄，下一个是？", "红", [choice("yellow", "黄", "/art/swatch-yellow.svg"), choice("red", "红", "/art/swatch-red.svg")], "red"),
          {
            id: "q2",
            type: "sort",
            promptText: "排成圆、方、圆",
            promptSpeak: "按规律排",
            choices: [
              { id: "c1", label: "圆", visual: "/art/shape-circle.svg" },
              { id: "s1", label: "方", visual: "/art/shape-square.svg" },
              { id: "c2", label: "圆", visual: "/art/shape-circle.svg" },
            ],
            answer: ["c1", "s1", "c2"],
          },
        ],
        rewardCopy: "规律找到啦！",
        rewardCopyZh: "规律找到啦！",
      }),
      level({
        id: "math-starter-09",
        packId: "math-starter",
        title: "比一比",
        order: 9,
        vocab: ["多", "少", "一共"],
        audioIntro: "/audio/math-starter-09/intro.mp3",
        introScript: "两个苹果再加一个，就变成三个。",
        introScriptZh: "两个苹果再加一个，就变成三个。",
        listenTitle: "比一比",
        listenVisual: "/art/listen-more.svg",
        nextLevelId: "math-starter-10",
        steps: [
          tap("q1", "2 个再加 1 个，是几个？", "3", [choice("2", "2", "/art/num-2.svg"), choice("3", "3", "/art/num-3.svg"), choice("5", "5", "/art/num-5.svg")], "3"),
          tap("q2", "哪边更多？", "更多", [choice("more", "更多", "/art/more.svg"), choice("less", "更少", "/art/less.svg")], "more"),
          { id: "q3", type: "speak", ages: ["C"], promptText: "跟读：两个加一个", promptSpeak: "两个加一个", speakText: "两个加一个", answer: "spoken" },
        ],
        rewardCopy: "会比较也会加一点！",
        rewardCopyZh: "会比较也会加一点！",
      }),
      level({
        id: "math-starter-10",
        packId: "math-starter",
        title: "数学复习",
        order: 10,
        vocab: ["5", "圆", "大"],
        audioIntro: "/audio/math-starter-10/intro.mp3",
        introScript: "复习数数、形状和大小。",
        introScriptZh: "复习数数、形状和大小。",
        listenTitle: "复习",
        listenVisual: "/art/listen-shapes.svg",
        steps: [
          tap("q1", "听「五」，点 5", "五", [choice("3", "3", "/art/num-3.svg"), choice("5", "5", "/art/num-5.svg"), choice("8", "8", "/art/num-8.svg")], "5"),
          {
            id: "q2",
            type: "drag",
            promptText: "圆形放圆盒，大球放大盒",
            promptSpeak: "分一分",
            baskets: [
              { id: "round", label: "圆盒", visual: "/art/shape-circle.svg" },
              { id: "big", label: "大盒", visual: "/art/big.svg" },
            ],
            choices: [
              { id: "circle", label: "圆形", visual: "/art/shape-circle.svg", basket: "round" },
              { id: "big", label: "大", visual: "/art/big.svg", basket: "big" },
            ],
            answer: "placed",
          },
        ],
        rewardCopy: "数学复习完成！",
        rewardCopyZh: "数学复习完成！",
      }),
    ],
  },
];

const outlines = [];
for (const pack of packs) {
  const previous = read(`${pack.packId}-05`);
  previous.nextLevelId = pack.items[0].id;
  write(previous);
  for (const item of pack.items) {
    write(item);
    outlines.push({
      id: item.id,
      packId: item.packId,
      order: item.order,
      title: item.title,
      goal: item.introScriptZh,
      vocab: item.vocab,
      rewardCopy: item.rewardCopy,
      types: [...new Set(item.steps.map((step) => step.type))],
      minutes: 2,
      playable: true,
    });
  }
}

const catalogPath = path.join(root, "content/fixtures/catalog.json");
const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
for (const pack of catalog.packs) {
  if (pack.id !== "math-life") pack.levelCount = 10;
}
for (const outline of outlines) {
  if (catalog.levels.some((item) => item.id === outline.id)) continue;
  const previousIndex = catalog.levels.findIndex((item) => item.id === `${outline.packId}-${String(outline.order - 1).padStart(2, "0")}`);
  catalog.levels.splice(previousIndex + 1, 0, outline);
}
fs.writeFileSync(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);
console.log(`新增关卡 ${outlines.length}`);
