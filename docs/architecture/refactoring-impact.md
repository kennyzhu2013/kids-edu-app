# 改造影响

- **审查基线：** `d1f84de49a8753115f47006f0dd1616bc53ca1c0`
- **规划裁决：** 以归档的 `docs/roadmap/V1.1-OPTIMIZATION-PROPOSAL.md` 为准。本文只在源码和该裁决不一致时写明，并说明要不要重开裁决。任务书原文在 `docs/roadmap/V1.1-TECHNICAL-REFACTORING.md`，不按它一次性施工。

## 1. 源码与方案不一致的地方

这些条目里，「现在」以源码为准。「以后」仍沿用方案裁决，除非注明建议重开。

### 1.1 四个 Tab 指的不是同一组

方案第 2 节把现状写成「四个 Tab：语言、英语、数学、认知」，第 9 节写「把四个 Tab 改成七个学科入口」不做。

源码底栏（`components/tab-bar.tsx`）是今日、课程、游戏、我的。语言、数学、英语、认知是 `Subject` 的 `tab`，由 `CoursesScreen` 全部渲染出来。`GET /api/subjects` 没有过滤。

**不重开「不要七个学科入口」这条裁决。** 落地时要写清楚：底栏保持四个功能项；课程馆的学科胶囊继续只显示现在这四科。七个规划学科不能插进现有 `Subject` 表还指望界面不变，因为界面会把每条 `Subject` 画出来。

### 1.2 没有名为 `no_hearing` 的事件

方案写「空听记为 `no_hearing`，不算做错，也不掉星」，并要求以后的事件类型保留这个名字。

源码行为只有一半：`SpeakBoard` 在识别结果 `reason === "empty"` 时提示「没听清，再试一次。」并返回，不调用 `onMiss()`，所以不加 `mistakes`、不掉星。业务源码（`app/`、`components/`、`lib/`、`prisma/`、`content/`、`scripts/`）里没有 `no_hearing` 字符串，完成接口也不知道发生过空听。

**不重开裁决。** Sprint 2 建 `LearningEvent` 时把 `no_hearing` 列为正式类型，并且仍然不计错、不掉星、不降掌握度。不要在文档里写成这个事件已经在入库。

另外两条跟读路径方案没有细写，实现时不要误伤：

- 麦克风不可用或被拒绝时，「我说完了」直接 `onPass()`，这一步算通过。
- 跟读错满 2 次后，`LevelPlayer.miss` 会自动算通过。

### 1.3 服务端权威分比方案描述的范围更窄

方案：客观题服务端校验；跟读因为不上传音频，只能是带来源的参考分。

源码：跟读确实不上传，`speechMatches` 只在浏览器跑。但点选、拖拽、排序也在浏览器判对，`completeLevel` 信任客户端传来的 `score` 和 `stars`。`getLevel` 把 `answer` 发给浏览器。所以「客观题已经是服务端权威」并不成立，那是待建行为。

**不重开裁决。** 数学试点再为客观步骤补服务端校验。跟读继续不能当成服务端最终分。界面和 README 现在写的是「录音不会上传到这个应用」（`README.md` 课文音频一节），没有写「识别一定发生在本地」。Web Speech API 仍可能把声音交给浏览器厂商，代码里没有禁止这一点的实现。以后的文案不要新加「只在本地识别」的承诺。

### 1.4 内存回退没有生产拒绝

方案：内存只限本地 / 开发；生产必须有数据库。

源码：`databaseEnabled()` 只看 `DATABASE_URL` 是否非空，不看 `NODE_ENV`。漏配时生产也会用内存，并且 `jsonOk` 仍带 `stub: true`。

**不重开裁决。** Sprint 1 加守卫，而不是现在改。

### 1.5 游戏次数的「记在浏览器」只是无库路径

有 `DATABASE_URL` 时 `GameQuota` 才加一，客户端用返回值覆盖 `localStorage`。无库时服务端不加，客户端自己记。两种路径都没有幂等键。超时结束也会扣次，中途关闭不扣。游戏不写 `Progress`。

方案没把配额幂等放进 Sprint 1。可留到 Sprint 2 和学习事件一起做。Sprint 1 不要改扣次规则，以免游戏乐园回归。

### 1.6 游戏产品名

方案用简称「找动物、形状拼合、习惯排序」。源码标题是「动物找不同」「形状拼拼乐」「洗手顺序挑战」（`catalog.json`）。标签才是 `animals`、`shapes`、`habits`。映射知识点时用 `gameId` 和标签，不要按简称改标题。

颜色配对的 `howTo` 写「掉落色块」，`ColorMatch` 是静态点选。这是文案和组件不一致，不属于 V1.1 必改项；改 `howTo` 会动夹具文案，应单独决定，不放进目录迁移。

## 2. 应该复用

| 现成部分 | 理由 |
|---|---|
| `Pack` / `Level` / 关卡 JSON / `LevelPlayer` | 45 关已经能播。试点是给步骤打标和校验，不是换播放器 |
| `stepSchema` 与 `load.ts` 的启动期校验 | 新字段做成可选，旧夹具继续通过 |
| 五款游戏组件和 `GameChrome` + `ready/play/done` | Sprint 2 的薄适配器包在外面，规则留在组件里 |
| `Progress.clientEventId` 的「同 id 不重复计时」 | 新事件表照这个想法加唯一键，不把逐步事件塞进 `Progress` |
| `persist.ts` 的「内存工作集 + 有库才 upsert」 | Sprint 1 仍要能在无库的开发机跑。生产守卫是额外分支，不是换成另一套数据层 |
| A/B/C、`stepsFor`、今日任务对 `math-life` 的 A 段排除 | 年龄模型已经符合「年龄不是第四级目录」 |
| 小芽、底栏、Piper mp3、`playPrompt` 的文件优先 | 方案明确不换 TTS、不大改 UI |
| `completeLevel` 的取较大星星、累加时长 | 再玩一次的产品行为。新事件是追加日志，不要改掉这行的含义 |
| 演示登录和支付的 `TODO` 边界 | 本期不接真短信、微信、支付、广告。只隔离默认密钥和补同意说明 |

## 3. 以后要改，但不是推倒

| 位置 | 为什么要动 | 放到哪一程 |
|---|---|---|
| `prisma/schema.prisma` 与新迁移 | 只有增量模型和可选列。不删 `Pack`、`Level`、`Progress` | Sprint 1 起，按实施计划分批 |
| `lib/api/modules/content.ts` 的 `listSubjects` | 若把七个规划学科写进现有 `Subject`，课程馆会多出入口 | Sprint 1 用单独的规划表，或查询时排除未上线学科 |
| `LevelPlayer.finish` 与 `completeLevel` | 数学试点的客观题要服务端重算；其它包先保持客户端上报 | Sprint 1 只包 `math-starter` |
| `getLevel` 返回全文答案 | 服务端校验之后，试点关卡仍可暂时返回答案（现有题依赖它）。不要在 Sprint 1 对 45 关突然隐藏答案，否则点选会无法判断直到客户端改完 | 试点内同时改「上报选择」和「服务端计分」；未试点的包保持现状 |
| `SpeakBoard` | 上报 `no_hearing` / 设备参考分时要加事件，不能改掉空听不扣星 | Sprint 2 |
| `components/screens/game-screens.tsx` 的 `GamePlayer` | 包一层统一生命周期；`onFinish` 要能区分完成和超时，避免超时被记成掌握 | Sprint 2 |
| `getToday` / `progressSummary` / `components/screens` 里的报告 | 今日和报告要改口径 | Sprint 3。Sprint 1–2 保持现在的四科各一关和一句薄弱提示 |
| `parent-lock.ts`、`auth.ts`、`requireAdmin` | 生产环境拒绝默认 `2580`、`000000`、`dev-admin` | Sprint 1 |
| `databaseEnabled` 的调用方 | 生产且无 `DATABASE_URL` 时拒绝服务，而不是内存冒充 | Sprint 1 |
| `loadFromDatabase` 的 `todayPlan.findMany` | 无 `orderBy`，多天数据可能冲掉「当天固定」 | 碰到今日逻辑时修。最迟 Sprint 3 改今日计划前修。不必单独立项去改产品行为 |
| `catalog-sync.ts` 的 update 字段少于 create | 目录列会和夹具漂移 | 打标若写进数据库列，更新子句要带上新列。请求路径仍以夹具为准，直到有意切换 |
| 设置页和家长中心的隐私段落 | 现在是待定稿说明，没有勾选 | Sprint 1 补同意文案和一条同意时间 |

## 4. 不要在本期动

- 不删除、不覆盖 `content/fixtures/` 里的题目、奖励文案、音频路径。打标只追加字段。
- 不改 `public/audio/`、`public/art/`，不运行 `generate-audio.mjs`（那会请求 Hugging Face 下载 Piper 模型，也没有理由换声）。
- 不把 `math-life` 并进 `math-starter`，不改 A 段排除 `math-life` 的规则，除非产品另作决定。
- 不把 `Level` 拆成全库 `Question`。
- 不引入 Phaser、Blockly、CMS 后台页面、CosyVoice、AI 出题或陪练。
- 不接真实短信、微信、支付、广告 SDK，不生成 `ios/`、`android/`。
- 不把订单和权益补进数据库，除非后来单独立项。本期避免依赖「重启后会员还在」。
- 不把 `ParentLock` 再建成第二套表。列已经在，缺的是校验和哈希。
- 不改四个功能 Tab 的文案和路由。

## 5. 新模型对现有库的影响

全部是加表或加可空列，用新的 Prisma migration。不改 init 迁移，不 `migrate reset`。

| 新对象 | 和现有数据的关系 | 风险 |
|---|---|---|
| 规划学科 + 专题 | 不替换 `Subject` 的四行。`Pack.subjectId` 仍是 `lang/math/eng/life` | 若复用 `Subject` 且 `listSubjects` 原样返回，课程馆胶囊变多 |
| `KnowledgePoint` | 新行。用 `code` 唯一。所属专题是 `courseId` 一类外键，不用 `parentId` 表示前置 | 空表上线不影响播放 |
| `KnowledgeDependency` | 多对多，类型 `prerequisite` / `related` / `extension` | 不要把依赖写进 `KnowledgePoint.parentId`。任务书草稿里的 `parentId` 与本裁决冲突，以裁决为准 |
| 步骤和游戏上的 `knowledgePointIds` | 先活在 JSON。数据库若要列，只能加可空数组，并让 `syncCatalog` 的 update 写到它 | 只改 create 不改 update 时，已种过的库不会得到新标签 |
| `Question` | 只挂 `math-starter` 的步骤 id。其它包不建行 | 若用题目替换 `steps`，45 关播放会断 |
| `LearningEvent` | 追加。`childId` 外键。幂等键唯一。类型含 `no_hearing` | 不要更新 `Progress` 来模拟流水；并发下要靠数据库唯一键，不能只查内存 |
| `KnowledgeMastery`、`ReviewPlan` | Sprint 3 才建。Sprint 1 不写掌握度 | 提前建表容易让报告读到空规则，显示出「未掌握」 |
| 同意时间 | 可空列，例如挂在 `User`。旧行是 `null` | 开发环境不要因为 `null` 把现有引导卡死；生产路径再要求勾选 |

`Progress`、`TodayPlan`、`GameQuota` 继续按现在的语义工作，和新表并存。等 Sprint 3 的口径稳定，再决定今日任务是否改读复习计划。在那之前，完成关卡的星星仍以 `Progress` 为准。

## 6. 回归风险

按「一改就会让现有家长路径坏掉」排序。

1. **关卡播不出来。** `LevelPlayer` 对未知 `type` 没有界面。`eng-starter-04` 的 `count-tap` 已经如此。改类型分支或 Zod 枚举时要先列出现有步骤类型：`tap`、`speak`、`drag`、`sort`、`count-tap`。
2. **年龄过滤过严。** `stepsFor` 在过滤结果为空时退回全部步骤。若改成「滤空就报错」，一些只给 B/C 的跟读关在边界年龄会打不开。
3. **完成上报改成服务端重算后，旧客户端仍只传 `score`。** 试点必须接受旧请求形状，或只在新字段存在时重算。对其它课包保持现在的 clamp。
4. **隐藏答案。** 在客户端仍用 `step.answer` 判对之前隐藏答案，点选和排序会全部失败或无法计星。
5. **`syncCatalog` 覆盖。** 有库启动会 upsert 夹具。手改数据库里的标题，下次进程启动会被夹具盖掉（更新子句包含 `title`）。不要把运营编辑放进这张表。
6. **今日计划被重新抽取。** 见数据库文档第 5 节。迁移如果为了回填插入多行 `TodayPlan`，会放大这个无序覆盖。
7. **孩子 id。** 无库重启后本地 id 404，`currentChild` 会把进度记到当前演示孩子。生产守卫上线后，开发说明要写清：无库数据不跨重启。不要在修守卫时把开发机也变成必须有库，方案允许开发内存。
8. **配额双计。** 有库时若客户端在 `persisted: false` 时又 `consumePlay`，会和库不一致。现在的分支是 `persisted` 为真才覆盖本地。改这个 if 要两边一起看 `game-screens.tsx` 和 `quota.ts`。
9. **默认密钥。** 生产拒绝 `2580` / `000000` / `dev-admin` 之后，没配环境变量的部署会起不来或登录失败。这是预期，要写进启动日志，而不是静默换一套新的默认值。
10. **演示档案占名额。** `child-demo` 加上引导新建的孩子，一共占 `MAX_CHILDREN`（4）。改种子逻辑时不要让老用户再也加不了孩子。

## 7. 数学试点应该选哪一包

额外建议和优化方案都要求先完整走通一门数学课，再推广其它学科。

源码里的数学是两个课包，不是一门。建议试点课包定为 **`math-starter`（10 关）**：播放器已经实现它用到的 `tap`、`drag`、`sort`、`speak`；它覆盖数、比较、形状、分类，适合验证「一个包打上多个知识点，而不是包等于专题」。`math-life` 保持原包，只做标签映射，不在 Sprint 1 做 `Question` 和客观题重算。

`math-starter` 里仍有跟读（`math-starter-06` 给 B，「十」；`math-starter-09` 给 C，「两个加一个」）。这两步继续走设备参考分，用来证明同一关里两种计分可以并存。不要为了试点删掉它们。

`eng-starter-04` 的 `count-tap` 缺口不阻塞数学试点。若 Sprint 1 的补丁碰到 `LevelPlayer` 的类型判断，应顺手让 `count-tap` 使用和 `tap` 相同的界面，因为数据结构已经相同。那是缺陷修复，不是把英语纳入内容引擎试点。
