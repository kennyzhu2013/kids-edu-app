# 当前内容模型

- **审查基线：** `d1f84de49a8753115f47006f0dd1616bc53ca1c0`
- **权威来源：** `content/fixtures/`、`lib/content/schemas.ts`、`lib/content/load.ts`、播放器与 `lib/api/modules/content.ts`。规划目录里的专题编码还没有出现在夹具或 schema 中。

## 1. 现在有什么内容

`content/fixtures/catalog.json` 是大纲。`lib/content/load.ts` 用 Zod 解析它，并静态 import 每一关、每一款游戏的 JSON。

| 种类 | 数量 | id |
|---|---|---|
| 学科 `subjects` | 4 | `lang` 语言、`math` 数学、`eng` 英语、`life` 认知。字段 `tab` 与 `name` 相同 |
| 课包 `packs` | 5 | `eng-starter`、`math-starter`、`math-life`、`lang-starter`、`life-starter`。`access` 全是 `trial` |
| 关卡大纲 `levels` | 45 | 四个「起步」包各 10 关，`math-life` 5 关。大纲里抽查到的 `playable` 都是 `true` |
| 游戏大纲 `games` | 5 | 见第 6 节 |
| 可玩关卡全文 | 45 | `load.ts` 的 `levelFiles` 与大纲一一对应 |
| 游戏全文 | 5 | `load.ts` 的 `gameFiles` |

`scripts/seed.ts` 会核对：可玩大纲至少 20 条；每条可玩大纲都有全文夹具；除跟读外至少两道题；课包 `levelCount` 等于大纲条数；可玩游戏至少 5 个且 `dailyFree` 与全文一致。`load.ts` 为大纲中的关卡和五款游戏都做了静态 import。审查没有运行 `npm run seed`，上面是门禁在查什么，不是一次执行结果。

数学两包都挂在学科 `math` 下，不是两个学科：

- `math-starter`：Math Starter · 数感启蒙。10 关：数数1-5、多少比较、形状、大小长短、分类、数到十、第几、找规律、比一比、数学复习。
- `math-life`：Math Life · 生活应用。5 关：分水果、买东西、排队几号、几点钟整点、整理玩具。

年龄段 A 的今日任务会跳过 `math-life`（`lib/api/modules/progress.ts` 的 `dailyTask`）。课包本身仍出现在课程馆的数学筛选里，因为 `listPacks` 不按年龄过滤。

没有「课程专题」实体。一个 `Pack` 下面按 `order` 排关，关与关用关卡 JSON 的 `nextLevelId` 串成下一关。`math-starter` 的关卡主题已经跨了数、比较、形状、分类，不能把整个包当成一个知识点。

## 2. 两套 schema，运行时只用 Zod

`lib/content/schemas.ts`：

- `levelDocumentSchema`：`schemaVersion`、`id`、`packId`、`title`、`order`、`ageBand`（`A|B|C` 数组）、`vocab`、`audioIntro`、`introScript`、`introScriptZh`、可选的听一听标题和插画、`nextLevelId`、`steps`（至少 1 步）、`rewardStars`（1–3）、中英奖励文案，以及可选的 `aDiff` / `bDiff` / `cDiff`。
- `stepSchema.type` 枚举：`listen`、`tap`、`drag`、`speak`、`count-tap`、`sort`、`scenario-choice`。
- 步骤字段：`id`、`promptAudio`、`promptText`、`promptSpeak`、`choices`、`baskets`、`answer`（字符串或字符串数组）、`speakText`、可选 `ages`。
- `gameDocumentSchema` 是按 `kind` 的 discriminated union：`color-match`、`spot-animal`、`count-dash`、`shape-fit`、`habit-order`。共有的元数据包括 `knowledgeTags`、`dailyFree`、`durationSec`、`winTarget`。
- `catalogSchema` 校验大纲，关卡大纲用 `levelOutlineSchema`（没有步骤正文）。

`loadCatalog`、`loadPlayableLevels`、`loadGameConfigs` 校验失败会抛错，开发服因此起不来。这是内容的实际门禁。

`content/schemas/level.schema.json` 是一份 JSON Schema 草稿（`$id` 为 `https://zonghe-qimeng.local/schemas/level.json`）。步骤枚举与 Zod 相同。它多了 `rewardSticker`、`charCards` 等 Zod 未声明的属性。`load.ts` 和 `seed.ts` 都不读取这份文件。两边谁都不管谁，以后加字段时要同时看，但以 Zod 为运行时门禁。

关卡和游戏 JSON 里没有 `knowledgePointIds`。游戏只有非正式的 `knowledgeTags`。

## 3. 关卡如何被加载和播放

```text
catalog.json + levels/*.json + games/*.json
  → load.ts Zod 解析
  → memory.applyContent 克隆进 packs / levels / playableLevels / games / gameConfigs
  → content.ts 的 getLevel / getGame 从内存返回全文
  → LevelPlayer 或 GamePlayer
```

`getLevel`（`lib/api/modules/content.ts`）：

- 大纲不存在 → 404。
- 大纲 `playable` 为假，或没有全文 → 403 `LOCKED`。有内存会员时 `lockReason` 是 `CONTENT_UNPUBLISHED`，否则是 `AD_OR_VIP`。
- 成功时返回 `{ level: full, assetResolution: "stub", todo: "CDN_AUDIO" }`。`full` 是整份 `LevelDocument`，**包含每一步的 `answer`**。

`getPack` 按 `packId` 列出大纲关卡，并用查询参数 `childId` 在内存进度里标 `done` / `todo`。`locked` 为 `!playable && !hasVip`。当前五包的关都是可玩的，所以课程馆里它们不锁。`unlockRule` 文案写明四科都可以直接玩，广告和会员仍是桩。

`LevelPlayer`（`components/level-player.tsx`）拉取 `/api/levels/:id` 后：

1. `stepsFor(level, age)` 按步骤 `ages` 过滤。
2. 阶段 `listen`：播 `audioIntro`，展示 `introScriptZh`。这一步不在 `steps` 数组里，是关卡顶层字段。
3. 阶段 `quiz`：按 `step.type` 分支。
4. 阶段 `result`：展示 `rewardCopyZh`，上报完成。有 `nextLevelId` 则「下一关」走到 `/play/<id>`，否则进入 `pack-done`。

播放器实际渲染的类型只有：

| `step.type` | 界面 | 判对位置 |
|---|---|---|
| `tap` 且 `choices` 非空 | `LevelPlayer` 里的选项按钮 | `answered()`：答案是数组则 `includes`，否则全等 |
| `speak` | `SpeakBoard` | 浏览器 `speechMatches`，见架构文档第 10 节 |
| `drag` | `DragBoard` | 选项上的 `choice.basket` 是否等于放下的篮子 id |
| `sort` | `SortBoard` | 与 `step.answer` 数组顺序比较（同文件后半） |
| `tap` 且没有选项 | 文案「这道题还没有选项」 | 不能作答 |
| `count-tap`、`listen`、`scenario-choice` | **没有分支** | 测验阶段只剩顶栏，无法作答，也无法进入下一步 |

`count-tap` 不是死枚举。`content/fixtures/levels/eng-starter-04.json` 的 `q1`、`q2` 就是 `count-tap`，结构和点选一样（`choices` + 字符串 `answer`），只是 `type` 不同。播放器不把它们当成 `tap`。这一关的后两步才是 `tap`。年龄段 A/B 会先碰到 `q1`，界面是空的。这是当前播放器缺口，不是内容缺了题。

大纲字段 `types` 和步骤 `type` 不是同一份数据。例如 `catalog.json` 里 `life-starter-01` 的 `types` 含 `scenario-choice`，`life-starter-03` 含 `listen` 和 `scenario-choice`。对应关卡 JSON 的步骤里，审查时只见到 `tap`、`drag`、`sort`、`speak`、`count-tap`。`scenario-choice` 和作为步骤的 `listen` 出现在大纲和 schema 枚举里，没有出现在已加载的步骤正文里。听一听是关卡顶层，不是 `type: "listen"` 的步骤。

错题不单独存储。错一次只让 `LevelPlayer` 的 `mistakes` ref 加 1，用来减星和算分。没有错因枚举。

## 4. 年龄段怎样作用在内容上

`lib/age.ts` 的 `AGE_OPTIONS`：A 为 3–4 岁，B 为 4–5 岁，C 为 5–6 岁。年龄不是第四级目录，是孩子档案上的一个字母，以及步骤上的可选 `ages`。

三处用法，互不影响：

1. **步骤：** `stepsFor` 滤掉不含当前字母的步骤。跟读步骤在夹具里标 B 或 C。例如 `eng-starter-03` 的 `q5` 只给 C（跟读 "It's a fish"），`q-speak-b` 只给 B（跟读 "fish"）。`math-starter-06` 的跟读「十」只给 B，`math-starter-09` 的跟读「两个加一个」只给 C。
2. **今日抽关：** A/B/C 的起始 `order` 不同，且 A 不抽 `math-life`。
3. **数一数冲关：** `CountDash` 在 B/C 时往棋盘加星星干扰物，A 不加。这是组件读 `useChild().ageBand`，不是夹具步骤。

关卡顶层 `ageBand` 在已读夹具里是 `["A","B","C"]`。它不参与 `stepsFor`。`syncCatalog` 写入数据库时也把 `ageBand` 写成这三个字母，不读夹具里的数组（create 路径写死 `["A","B","C"]`）。

没有 `ageTargets`。难度差异若要写给规划里的知识点，现在没有落点；`aDiff` / `bDiff` / `cDiff` 只是关卡上的可选字符串，播放器不读。

## 5. 客观题答案在客户端

点选答案在步骤 `answer`。拖拽的正确篮子在每个 `choice.basket`，步骤 `answer` 往往仍是一个字符串或数组，播放器拖拽路径不拿它和篮子比较。排序用 `answer` 数组。

这些字段随 `getLevel` 下发。完成接口不回收每一步的选择，只收整关的 `score`、`stars`、`duration`、`clientEventId`。所以：

- 现在改客户端就可以上报 3 星，服务端只做范围夹取和「取较大值」。
- 跟读分数同样来自客户端。另外音频从未上传，服务端即使想重判也没有原声。跟读步骤的 `answer: "spoken"` 本身也不是期望文本，期望文本在 `speakText`。

空听行为见 `docs/architecture/current-architecture.md` 第 10 节：界面提示「没听清，再试一次。」，不记错；源码没有 `no_hearing` 事件。

## 6. 五款游戏的内容与实现

大纲标题和标签（`catalog.json` 的 `games`，全文夹具重复了 `knowledgeTags`）：

| gameId | 标题 | `kind` | `knowledgeTags` | `dailyFree` | 时长 | 玩法（以组件为准） |
|---|---|---|---|---|---|---|
| `game-color-match` | 颜色配对 | `color-match` | `colors` | 3 | 45 秒 | `ColorMatch`：上方显示一个色块，点下方同色。接满 `winTarget`（夹具为 5）即赢。夹具 `howTo` 写「上方掉落色块」，组件没有下落动画 |
| `game-spot-animal` | 动物找不同 | `spot-animal` | `animals` | 3 | 60 秒 | `SpotAnimal`：3 轮 3×3，八同一异，点出不同的动物 |
| `game-count-dash` | 数一数冲关 | `count-dash` | `numbers` | 3 | 60 秒 | `CountDash`：按 `targets` 点够苹果。B/C 混入星星，点星星只提示「星星不算」，不算赢 |
| `game-shape-fit` | 形状拼拼乐 | `shape-fit` | `shapes` | 3 | 90 秒 | `ShapeFit`：圆、方、三角放进对应凹槽 |
| `game-habit-order` | 洗手顺序挑战 | `habit-order` | `habits` | 3 | 90 秒 | `HabitOrder`：把夹具里的步骤卡排成原顺序 |

五款组件的外形已经一样：`phase` 为 `ready | play | done`，`useRoundTimer` 到时调用 `end(false)`，`end` 用 `ended` ref 只触发一次 `onFinish`。关闭按钮调用 `onExit`，不调用 `onFinish`。没有统一的 TypeScript 接口把这个形状固定下来，`GamePlayer` 用一串 `if (game.kind === ...)`。

游戏配置不经过关卡播放器，也不写 `Progress`。标签不能当知识点主键：它们是英文复数名词，没有学科、没有年龄目标、没有和关卡步骤的关联。

`spot-animal` 的动物 id 被 Zod 限制为 `cat | dog | bird | fish`。`shape-fit` 的形状 id 限制为 `circle | square | triangle`。换内容要改 schema，不只是改 JSON。

## 7. 音频与插画引用

关卡 `audioIntro`、`promptAudio` 使用站内路径，形如 `/audio/math-starter-01/intro.mp3`。文件在 `public/audio/<关卡 id>/`。`playPrompt` 只把 `http(s)` 和以 `/` 开头的字符串当媒体地址；别的字符串（例如将来的 `asset:`）会改走系统朗读。

`getLevel` / `getGame` 的 `assetResolution: "stub"` 表示接口没有把素材 id 换成 CDN 地址。内存里的 `asset-mia` 已发布，`cdnUrl` 是 `/art/mia.svg`。英语第一关的听一听封面和打招呼场景用的是同一套 Mia 立绘，播放器直接读 `/art/` 路径。

插画是 `choice.visual` 或关卡 `listenVisual` 上的 `/art/...svg`，由 `components/illustrations.tsx` 的 `TokenArt` 或 `next/image` 显示。生成脚本见架构文档，不在请求路径上。

## 8. 演进时可以留在原处的结构

这些已经够用来挂知识点，不必先换成另一套关卡格式：

- 继续用 `Pack` 当教学包，`Level` 当一关，`steps[]` 当一关里的题。`Question` 若只做数学试点，应对应某关的某个 `step.id`，而不是把 45 关的步骤搬进新表。
- 步骤上可以加可选的 `knowledgePointIds`（Zod 先放开，旧夹具不填也能过）。游戏全文同样加在共有元数据上，保留现有 `knowledgeTags` 作为对照，不要直接把 `colors` 当成正式编码。
- 年龄继续用 A/B/C。规划里的 `ageTargets` 放在知识点上，不要把年龄做成 `Subject` 下面的第四层，也不要靠拆包来表示年龄。
- `math-life` 保持独立课包。它和 `math-starter` 共享学科 `math`，今日任务对 A 段的排除也依赖这个包 id。把两包合成一个专题会和这段分支打架。
- 播放器缺口（`count-tap` 无界面）在英语第 4 关，不在 `math-starter` 的步骤类型里。数学试点不必先重写英语关，但一旦改 `LevelPlayer` 的类型分支，应把 `count-tap` 至少按点选渲染，避免英语关回归。

不适合在内容模型里立刻做的事：用 `Game.knowledgeTags` 代替知识点表；用大纲 `types` 代替步骤 `type`；把 `Level.config` 当成线上编辑器的唯一稿（请求不读数据库里的 `config`）；为了目录整齐拆掉 `Pack` / `Level`。
