/**
 * 规划目录骨架，和产品四科（lang / math / eng / life）分开。
 * 只收录已经能对上现有关卡的知识点，另加拼音和 20 以内运算两条骨架。
 * 编码说明见 docs/curriculum/ENCODING.md。
 */

export type AgeTargets = {
  A?: string;
  B?: string;
  C?: string;
};

export type CurriculumRelation = "prerequisite" | "related" | "extension";

const SUBJECT_ROWS = [
  ["ZH", "中文启蒙"],
  ["EN", "英语启蒙"],
  ["MA", "数学启蒙"],
  ["SC", "科学探索与认知"],
  ["HL", "健康与生活"],
  ["SE", "社交与情绪"],
  ["AR", "艺术与创造"],
] as const;

const COURSE_ROWS: Array<[string, string, string]> = [
  ["ZH", "ZH01", "语言听说"],
  ["ZH", "ZH02", "拼音启蒙"],
  ["ZH", "ZH03", "汉字启蒙"],
  ["ZH", "ZH04", "词语积累"],
  ["ZH", "ZH05", "句子表达"],
  ["ZH", "ZH06", "儿歌童谣"],
  ["ZH", "ZH07", "古诗启蒙"],
  ["ZH", "ZH08", "绘本阅读"],
  ["EN", "EN01", "字母认知"],
  ["EN", "EN02", "自然拼读"],
  ["EN", "EN03", "基础词汇"],
  ["EN", "EN04", "日常表达"],
  ["EN", "EN05", "听力理解"],
  ["EN", "EN06", "口语表达"],
  ["EN", "EN07", "英语绘本"],
  ["EN", "EN08", "英语韵律"],
  ["MA", "MA01", "数字认知"],
  ["MA", "MA02", "数量与数感"],
  ["MA", "MA03", "数字运算"],
  ["MA", "MA04", "图形认知"],
  ["MA", "MA05", "规律排序"],
  ["MA", "MA06", "分类比较"],
  ["MA", "MA07", "空间认知"],
  ["MA", "MA08", "时间认知"],
  ["MA", "MA09", "生活数学"],
  ["SC", "SC01", "观察识别"],
  ["SC", "SC02", "分类归纳"],
  ["SC", "SC03", "逻辑推理"],
  ["SC", "SC04", "记忆训练"],
  ["SC", "SC05", "空间思维"],
  ["SC", "SC06", "专注训练"],
  ["SC", "SC07", "科学探索"],
  ["SC", "SC08", "时间与顺序"],
  ["HL", "HL01", "生活习惯"],
  ["HL", "HL02", "身体健康"],
  ["HL", "HL03", "安全教育"],
  ["HL", "HL04", "穿衣与天气"],
  ["HL", "HL05", "整理与自理"],
  ["HL", "HL06", "求助"],
  ["SE", "SE01", "情绪认知"],
  ["SE", "SE02", "社交礼仪"],
  ["SE", "SE03", "分享与轮流"],
  ["SE", "SE04", "自我与家庭"],
  ["SE", "SE05", "合作表达"],
  ["AR", "AR01", "色彩认知"],
  ["AR", "AR02", "绘画启蒙"],
  ["AR", "AR03", "音乐启蒙"],
  ["AR", "AR04", "手工创造"],
  ["AR", "AR05", "创意表达"],
];

function explore(what: string): AgeTargets {
  return {
    A: `${what}。3～4 岁听一听、点一点就好`,
    B: `${what}。4～5 岁可以比较，也可以跟着说`,
    C: `${what}。5～6 岁可以换一个生活里的例子再试`,
  };
}

const POINT_ROWS: Array<{ code: string; title: string; difficulty: number; ageTargets: AgeTargets }> = [
  { code: "ZH01-001", title: "听懂身体部位和家人称呼", difficulty: 1, ageTargets: explore("能把听到的身体和家人点出来") },
  { code: "ZH01-002", title: "理解常见反义词", difficulty: 2, ageTargets: explore("能听懂大与小、长与短") },
  {
    code: "ZH02-001",
    title: "拼音声母初识",
    difficulty: 2,
    ageTargets: {
      A: "不作为目标",
      B: "可以听一听，不要求拼读，也不是必修",
      C: "可以认识少量声母，不作为升级门槛",
    },
  },
  { code: "ZH03-001", title: "从图画感受象形字", difficulty: 1, ageTargets: explore("能把图画和像它的字连起来") },
  { code: "ZH03-002", title: "认识数字汉字一二三", difficulty: 1, ageTargets: explore("能认出一、二、三") },
  { code: "ZH04-001", title: "认识常见动物", difficulty: 1, ageTargets: explore("能认出猫、狗、鸟、鱼") },
  { code: "ZH04-002", title: "认识红黄蓝绿", difficulty: 1, ageTargets: explore("能按名字点出红、黄、蓝、绿") },
  { code: "ZH04-003", title: "认识常见食物", difficulty: 1, ageTargets: explore("能认出米饭、苹果、牛奶、面包") },
  { code: "ZH07-001", title: "听一句短诗", difficulty: 1, ageTargets: explore("能听完一句很短的诗") },
  { code: "ZH08-001", title: "复习已经听过的词", difficulty: 1, ageTargets: explore("能在复习里再认出学过的词") },
  { code: "EN03-001", title: "英语动物词", difficulty: 1, ageTargets: explore("能把 cat、dog、bird、fish 点出来") },
  { code: "EN03-003", title: "英语颜色词", difficulty: 1, ageTargets: explore("能把 red、yellow、blue、green 点出来") },
  { code: "EN03-004", title: "英语数字 1-5", difficulty: 1, ageTargets: explore("能把 one 到 five 和数量点到一起") },
  { code: "EN03-005", title: "英语身体部位", difficulty: 1, ageTargets: explore("能点出 eyes、nose、mouth、hands") },
  { code: "EN03-006", title: "英语家庭成员", difficulty: 1, ageTargets: explore("能点出家人的英语说法") },
  { code: "EN03-007", title: "英语食物饮品", difficulty: 1, ageTargets: explore("能点出苹果、牛奶、面包的英语说法") },
  { code: "EN03-009", title: "英语衣物", difficulty: 1, ageTargets: explore("能按天气点出帽子或外套") },
  { code: "EN04-001", title: "问候与道别", difficulty: 1, ageTargets: explore("能点出 hello 和 bye 的场景") },
  { code: "EN04-006", title: "复习已学英语", difficulty: 1, ageTargets: explore("能在复习里再点出学过的英语") },
  { code: "EN06-001", title: "说出简单动作", difficulty: 1, ageTargets: explore("能把跑、跳、站好点出来或跟着说") },
  { code: "MA01-001", title: "认识数字 1-5", difficulty: 1, ageTargets: explore("能点出 1 到 5") },
  { code: "MA01-002", title: "认识数字 6-10", difficulty: 2, ageTargets: explore("能点出 6 到 10") },
  { code: "MA01-003", title: "认识第几", difficulty: 2, ageTargets: explore("能说出最前面是第 1") },
  { code: "MA02-001", title: "听数并点出 1-5 的数量", difficulty: 1, ageTargets: explore("听一个数，点出同样多的东西") },
  { code: "MA02-002", title: "比较多少", difficulty: 2, ageTargets: explore("能点出更多、更少或一样多") },
  { code: "MA02-005", title: "理解再加一个", difficulty: 2, ageTargets: explore("能看出添上一个以后变多了") },
  {
    code: "MA03-001",
    title: "20以内加减初步",
    difficulty: 3,
    ageTargets: {
      A: "不作为目标",
      B: "不作为目标",
      C: "可以接触，不作为本阶段必修",
    },
  },
  { code: "MA04-001", title: "认识圆、方、三角", difficulty: 1, ageTargets: explore("能按名字点出圆、方和三角") },
  { code: "MA05-001", title: "颜色规律", difficulty: 2, ageTargets: explore("能看出红黄红黄的下一个") },
  { code: "MA05-002", title: "形状规律", difficulty: 2, ageTargets: explore("能按圆、方、圆排一排") },
  { code: "MA06-001", title: "比较大小", difficulty: 1, ageTargets: explore("能点出更大或更小的一个") },
  { code: "MA06-002", title: "比较长短", difficulty: 1, ageTargets: explore("能点出更短或更长的一个") },
  { code: "MA06-003", title: "按形状或颜色分类", difficulty: 2, ageTargets: explore("能把同一类放在一起") },
  { code: "MA08-001", title: "认识钟表整点", difficulty: 2, ageTargets: explore("能认出整点钟") },
  { code: "MA09-001", title: "分一分，一样多", difficulty: 2, ageTargets: explore("能把水果分成一样多") },
  { code: "MA09-002", title: "看价钱够不够", difficulty: 2, ageTargets: explore("能比较一个很小的价钱够不够") },
  { code: "MA09-003", title: "生活里的排队第几", difficulty: 2, ageTargets: explore("能在排队时点出第几") },
  { code: "MA09-004", title: "按形状和大小整理", difficulty: 2, ageTargets: explore("能把玩具按形状或大小放好") },
  { code: "SC07-001", title: "认识常见交通工具", difficulty: 1, ageTargets: explore("能点出汽车、公交、自行车、飞机") },
  { code: "HL01-001", title: "洗手的顺序", difficulty: 1, ageTargets: explore("能按湿手、搓皂、冲洗、擦干排一排") },
  { code: "HL01-002", title: "刷牙", difficulty: 1, ageTargets: explore("知道刷牙要挤一点牙膏") },
  { code: "HL03-001", title: "过马路和陌生人", difficulty: 1, ageTargets: explore("知道红灯停，不跟陌生人走") },
  { code: "HL04-001", title: "看天气穿衣服", difficulty: 1, ageTargets: explore("能按晴天、下雨、冷天选衣物") },
  { code: "HL05-001", title: "把玩具放回去", difficulty: 1, ageTargets: explore("玩完知道把玩具放进盒子") },
  { code: "HL06-001", title: "需要时告诉大人", difficulty: 1, ageTargets: explore("需要帮助时知道去告诉大人") },
  { code: "SE01-001", title: "认出开心、生气、难过、害怕", difficulty: 1, ageTargets: explore("能点出这四种表情") },
  { code: "SE02-001", title: "说请和谢谢", difficulty: 1, ageTargets: explore("想要的时候说请，得到了说谢谢") },
];

const DEPENDENCY_ROWS: Array<{ fromId: string; toId: string; relation: CurriculumRelation }> = [
  { fromId: "MA01-002", toId: "MA01-001", relation: "prerequisite" },
  { fromId: "MA02-001", toId: "MA01-001", relation: "related" },
  { fromId: "MA02-002", toId: "MA02-001", relation: "prerequisite" },
  { fromId: "MA02-005", toId: "MA02-001", relation: "prerequisite" },
  { fromId: "MA01-003", toId: "MA02-001", relation: "related" },
  { fromId: "MA03-001", toId: "MA01-002", relation: "prerequisite" },
  { fromId: "MA05-001", toId: "MA06-003", relation: "related" },
  { fromId: "MA05-002", toId: "MA04-001", relation: "related" },
  { fromId: "MA08-001", toId: "MA01-001", relation: "related" },
  { fromId: "MA09-003", toId: "MA01-003", relation: "related" },
  { fromId: "EN03-001", toId: "ZH04-001", relation: "related" },
  { fromId: "EN03-003", toId: "ZH04-002", relation: "related" },
  { fromId: "ZH02-001", toId: "ZH03-001", relation: "extension" },
  { fromId: "HL01-002", toId: "HL01-001", relation: "related" },
];

const courseSort = new Map<string, number>();

export const curriculumDocument = {
  subjects: SUBJECT_ROWS.map(([id, name], index) => ({
    id,
    name,
    sort: index + 1,
    status: "active" as const,
  })),
  courses: COURSE_ROWS.map(([subjectId, id, title]) => {
    const sort = (courseSort.get(subjectId) ?? 0) + 1;
    courseSort.set(subjectId, sort);
    return { id, subjectId, title, sort, status: "active" as const };
  }),
  points: POINT_ROWS.map((row) => {
    const courseId = row.code.slice(0, 4);
    const siblings = POINT_ROWS.filter((item) => item.code.slice(0, 4) === courseId);
    return {
      id: row.code,
      code: row.code,
      courseId,
      title: row.title,
      difficulty: row.difficulty,
      status: "active" as const,
      sort: siblings.findIndex((item) => item.code === row.code) + 1,
      version: 1,
      ageTargets: row.ageTargets,
    };
  }),
  dependencies: DEPENDENCY_ROWS,
};
