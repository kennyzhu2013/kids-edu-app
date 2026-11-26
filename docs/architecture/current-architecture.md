# 当前架构

- **审查基线：** `d1f84de49a8753115f47006f0dd1616bc53ca1c0`（`d1f84de`，提交说明：Add the 小芽 mascot and replace lesson audio with Piper voices.）
- **审查方式：** 只读该提交的源码。归档在 `docs/roadmap/`、`docs/curriculum/` 的方案只作后续规划输入，不作为「现在已经这样实现」的证据。
- **本文范围：** 页面、组件、服务与数据访问、登录与桩、跟读、五款游戏。表结构和夹具细节见同目录另外三篇。

## 1. 运行形态

仓库包名是 `zonghe-qimeng`（`package.json`）。运行时是 Next.js `16.4.2` App Router、React `19.3.0`、TypeScript、Zod `4`、Prisma `6` / `@prisma/client`。样式是 Tailwind CSS 4。没有测试脚本，`package.json` 的 scripts 只有 `dev`、`build`、`start`、`lint`、`seed`、`assets`、`db:generate`。仓库里没有 `*.test.ts` / `*.spec.ts`。

`npm run dev` / `start` 绑定 `0.0.0.0:41731`。根布局 `app/layout.tsx` 把页面限制在最大宽度 430px 的手机框里，并挂上 `NativeShell`。`capacitor.config.ts` 的 `appId` 是 `com.qimeng.kids`，`webDir` 是 `capacitor/www`。设了 `CAPACITOR_SERVER_URL` 时 WebView 打开正在跑的 Next 站点；仓库里没有 `ios/` 或 `android/` 工程。`components/native-shell.tsx` 的 `NativeShell` 只在检测到 Capacitor 原生平台时监听 Android 返回键。

没有 `middleware.ts`。没有按 `NODE_ENV` 区分生产与开发的守卫。

## 2. 页面

页面文件都是薄入口，交互在 `components/screens/` 或播放器组件里。

| 路径 | 页面文件 | 实际界面 |
|---|---|---|
| `/` | `app/page.tsx` | `SplashScreen`：约 900ms 后，本地已有孩子则去 `/today`，否则去 `/onboarding/age` |
| `/onboarding/age` | `app/onboarding/age/page.tsx` | `AgeScreen`，年龄段 A/B/C |
| `/onboarding/profile` | `app/onboarding/profile/page.tsx` | `ProfileScreen`，`POST /api/children` 建档后写入本地 |
| `/today` | `app/today/page.tsx` | `TodayScreen` |
| `/courses`、`/courses/[packId]` | 对应 `page.tsx` | `CoursesScreen`、`PackScreen` |
| `/games`、`/games/[gameId]` | 对应 `page.tsx` | `GamesScreen`、`GameScreen` |
| `/play/[levelId]` | `app/play/[levelId]/page.tsx` | `PlayRoute` → `LevelPlayer`。`generateStaticParams` 来自 `content/fixtures/catalog.json` 的全部关卡 id |
| `/mine` | `app/mine/page.tsx` | 账号页，含孩子切换 |
| `/login` | `app/login/page.tsx` | 短信登录桩 |
| `/lock` | `app/lock/page.tsx` | 家长锁键盘 |
| `/parent` | `app/parent/page.tsx` | 家长中心 |
| `/membership` | `app/membership/page.tsx` | 价卡与模拟支付 |
| `/report` | `app/report/page.tsx` | 学习报告 |
| `/settings` | `app/settings/page.tsx` | 朗读开关、登录入口、隐私待定文案 |
| `/offline`、`/preview/empty` | 对应页面 | 断网和空状态预览 |

`app/error.tsx`、`app/not-found.tsx` 是错误和 404 页。

主导航在 `components/tab-bar.tsx` 的 `TABS`，四项是 **今日 `/today`、课程 `/courses`、游戏 `/games`、我的 `/mine`**。带底栏的页面通过 `Screen` 的 `tabs` 属性挂上 `TabBar`。

课程馆里另有一排学科筛选，不是底栏。`components/screens/course-screens.tsx` 的 `CoursesScreen` 把 `GET /api/subjects` 返回的 `subject.tab` 画成胶囊按钮，默认选中 `subjectId === "eng"`。夹具里的四个学科是语言、数学、英语、认知（`content/fixtures/catalog.json` 的 `subjects`）。

这和优化方案里「界面四个 Tab：语言、英语、数学、认知」不是同一件事。源码的底栏是功能 Tab；语言 / 英语 / 数学 / 认知是课程馆筛选，数据来自 `Subject.tab`。

## 3. 组件分层

可复用的界面骨架：

- `components/screen.tsx`：页框、返回、底栏。
- `components/big-button.tsx`、`components/ui/*`：按钮、对话框、输入框。
- `components/buddy.tsx`：角色「小芽」的姿态（`idle`、`listen`、`happy`、`comfort`、`speak`）。
- `components/tab-bar.tsx`：四个功能 Tab。
- `components/level-player.tsx`：关卡状态机（`listen` → `quiz` → `result` / `pack-done`）。
- `components/level-boards.tsx`：`SpeakBoard`、`DragBoard`、`SortBoard`。点选在 `LevelPlayer` 内部，没有单独的 TapBoard。
- `components/games/chrome.tsx`：`GameChrome`、`GameReady`、`GameDone`、`useRoundTimer`。五款游戏共用「准备 / 进行 / 结束」。
- `components/star-result.tsx`、`components/pin-pad.tsx`、`components/price-cards.tsx`、`components/empty-panel.tsx`、`components/offline-state.tsx`。

游戏实现各自一个组件，由 `components/screens/game-screens.tsx` 的 `GamePlayer` 按 `game.kind` 分发：

| `kind` | 组件 | 夹具 |
|---|---|---|
| `color-match` | `components/color-match.tsx` 的 `ColorMatch` | `content/fixtures/games/game-color-match.json` |
| `spot-animal` | `components/games/spot-animal.tsx` 的 `SpotAnimal` | `game-spot-animal.json` |
| `count-dash` | `components/games/count-dash.tsx` 的 `CountDash` | `game-count-dash.json` |
| `shape-fit` | `components/games/shape-fit.tsx` 的 `ShapeFit` | `game-shape-fit.json` |
| `habit-order` | `components/games/habit-order.tsx` 的 `HabitOrder` | `game-habit-order.json` |

没有 `GamePlugin` 类型，也没有 Phaser 或其他游戏引擎依赖。

## 4. 客户端状态与请求

`lib/client/store.ts` 把档案放在 `localStorage` 键 `qimeng:v1`：孩子、令牌、朗读开关、家长锁会话、会员标记。默认令牌是字符串 `stub-parent-token`。游戏次数在另一个键 `qimeng:plays`，按本地日历日（`localDayKey`，月和日不补零）重置。

`lib/client/api.ts` 的 `api()` 给每个请求加上 `Authorization: Bearer <本地令牌>`。失败分成 `offline` / `missing` / `error`（`failureKind`）。

`lib/client/session.ts` 的 `alignChildSession()` 在「我的」里把本地孩子 id 和 `GET /api/me` 的当前孩子对齐。本地 id 在服务端 404 时，改用服务端当前孩子并覆盖本地。今日页和关卡完成直接使用本地 `child.id`，不会先做这次对齐。

`lib/api/modules/progress.ts` 的 `currentChild`（定义在 `lib/api/memory.ts`）在传入的 `childId` 找不到时，会静默改用 `isCurrent` 的孩子，再不行就用列表第一个。因此重启后本地 id 失效时，进度可能记到演示档案上，而不是返回 404。

## 5. 服务端分发

`app/api/**/route.ts` 只把方法和路径交给 `lib/api/dispatch.ts` 的 `dispatch`。例如 `app/api/progress/levels/[levelId]/complete/route.ts` 调用 `dispatch(..., "POST", "/progress/levels/:levelId/complete", params)`。

`dispatch` 开头 `await ensureReady()`，再按 `"METHOD /path"` 分到 `lib/api/modules/`：

| 模块 | 职责 |
|---|---|
| `auth.ts` | 短信、微信桩、`requireUser`、`requireAdmin`、`getMe` |
| `children.ts` | 孩子列表、创建、修改、切换 |
| `content.ts` | 学科、课包、关卡、游戏读取 |
| `progress.ts` | 今日任务、完成关卡、周报 |
| `quota.ts` | 游戏次数 |
| `orders.ts` | 下单与 `stubPaid` 确认 |
| `unlock.ts` | 广告解锁、权益列表 |
| `parent-lock.ts` | 家长锁校验与改密 |
| `admin.ts` | 后台对课包 / 关卡 / 游戏 / 素材的内存 CRUD |

`lib/api/http.ts` 的 `jsonOk` 给成功响应铺上 `stub: true`。错误体是 `{ code, message, details? }`。

`next.config.ts` 的 `rewrites` 把一部分无 `/api` 前缀的路径转到 `/api/...`。**没有**把 `/today`、`/games` 重写掉，因为这两条是页面。读接口要走 `/api/today`、`/api/games`。

## 6. 数据访问：内存是请求路径，数据库是可选回写

所有接口读的是 `lib/api/memory.ts` 的 `db()`，一块挂在 `globalThis.__qimengMemory` 上的进程内存。内容在 `applyContent` 里从 JSON 夹具克隆进来（`CONTENT_REV = 6`，版本变了会重新套内容，不清进度）。

`lib/api/prisma.ts` 的 `databaseEnabled()` 只判断 `process.env.DATABASE_URL` 是否为非空字符串。为真时 `getPrisma()` 懒创建一个 `PrismaClient`。

`lib/api/persist.ts` 的 `ensureReady()`：

- 没设 `DATABASE_URL`：立刻返回，后续 `persist*` 全部直接 return。
- 设了：进程内只跑一次 `loadFromDatabase()`。失败会清掉 ready 标记，请求变成 500，**不会**自动改走纯内存。

`loadFromDatabase` 先 `syncCatalog` 再 `ensureDemoFamily`（都在 `lib/api/catalog-sync.ts`），然后把 `user-demo` 的手机号、孩子、`Progress`、`TodayPlan`、`GameQuota` 灌进内存。内容目录本身仍以夹具为准，API 不从 Prisma 读课包和关卡。

回写函数只有：`persistProgress`、`persistTodayPlan`、`persistChild`、`persistCurrentChild`、`persistPhone`、`persistQuota`。订单、权益、家长锁明文、短信票据、后台改动只留在内存。

演示家庭固定 id：`user-demo`、`child-demo`。冷启动内存里还有一个昵称「小芽」、年龄段 A 的孩子。引导页总会再 `POST /api/children`，所以玩过引导后通常至少有两个档案。`children.ts` 上限 `MAX_CHILDREN = 4`，演示档案占一个名额。

`docker-compose.yml` 只起 Postgres 16，库名 `zonghe_qimeng`，口令写在 compose 里，供本机开发。没有应用服务。

## 7. 今日、进度、报告

`getToday`（`lib/api/modules/progress.ts`）要求 `stub-parent-token`。任务生成规则：

- 学科顺序 `SUBJECT_ORDER = ["lang", "math", "eng", "life"]`。
- 数学包含课包 `math-starter` 和 `math-life`。年龄段 A 排除 `math-life`（`dailyTask` 里 `age === "A" && packId === "math-life"`）。
- 起点关序号：A 从 1、B 从 2、C 从 3（`START_ORDER`）。
- 每个学科挑第一个未完成且 `order >= start` 的可玩关；都完成了就用剩余未完成的第一关，再没有就用该科第一关。
- 日期键 `utcDayKey` 是 UTC 的 `YYYY-MM-DD`。同一孩子、同一 UTC 日、年龄段没变时，复用内存里的 `levelIds`，完成状态按 `Progress.status === "completed"` 现算。
- 每次 `getToday` 都 `persistTodayPlan`。

`completeLevel` 不读题目答案。它只做：

- 关卡必须在内存目录里且 `playable`。
- 若带了 `clientEventId` 且内存里已有同一 id，直接返回 `idempotent: true`，不再加时长。
- 否则按 `(childId, levelId)` 更新或插入。`stars`、`score` 取与旧值的较大者，`durationSec` 累加。星星被夹到 1–3，分数夹到 0–100，时长夹到 0–1800 秒。
- 然后 `persistProgress`。

客户端在 `LevelPlayer.finish` 里自己算分：`score = round((1 - min(mistakes, 2) / 2) * 100)`，`stars = max(1, rewardStars - mistakes)`，`clientEventId` 是进入关卡时的 `crypto.randomUUID()`。再玩一次会换新的 id。离开确认框（「先离开吗？」）不上报完成。

`progressSummary` 只统计当前孩子、状态为 `completed`、且 `isSameWeek` 的行。周起始用运行进程的本地时区（周一为一周开始）。分钟数是本周秒数除以 60，至少显示 1 分钟（秒数为 0 则是 0）。`weakAreaTip` 按四科完成关数和平均星星给一句建议，没有知识点。

连学天数 `streakDaysFor` 用 UTC 日期，和周报的本地时区、游戏次数的客户端本地日期不是同一套日历。

## 8. 游戏次数

`GamesScreen` 先拉 `/api/games` 和 `/api/entitlements`。有 `childId` 时再拉 `/api/games/quota?day=<localDayKey>`。只有响应里 `persisted: true` 才用 `applyServerQuotas` 覆盖本地 `qimeng:plays`。

`changeQuota`（`lib/api/modules/quota.ts`）：

- 没设 `DATABASE_URL`：返回 `{ persisted: false, used: 0, bonus: 0 }`，**不**增加内存计数。客户端因此走 `consumePlay` / `grantBonusPlay`，次数只在这台浏览器。
- 设了：内存行 `used` 或 `bonus` 加 1，再 `persistQuota` upsert 到 `GameQuota`。

扣次发生在一局结束。`GameScreen` 的 `onFinish` 在 `spent` ref 上只发一次；会员（本地 `vip` 标记）不扣。五款游戏的 `end()` 无论赢还是超时都会 `onFinish()`。点关闭走 `onExit`，不扣次。服务端没有幂等键，刷新后再打完一局会再扣一次。

广告加次：先 `POST /api/unlock/ad`（任意非空 `adToken`），再 `POST /api/games/:id/bonus`。无库或请求失败时，客户端自己 `grantBonusPlay`。

游戏成绩不写 `Progress`。结束页星星是 `GameDone` 的本地显示（赢 3 颗、超时 1 颗）。

## 9. 登录、家长锁、短信、后台、支付

全部是演示桩，代码里标了 `TODO`。

- **登录令牌：** `requireUser` 只接受恰好 `stub-parent-token`。`loginSms` 和 `loginWechat` 都返回这同一个字符串。没有 JWT，没有按用户查库。
- **短信：** `sendSms` 不调用短信商。验证码常量 `DEMO_CODE = "000000"`，60 秒冷却，5 分钟过期。手机号要匹配 `^1[3-9]\d{9}$`。登录成功后 `persistPhone` 只更新 `user-demo`。
- **微信：** `loginWechat` 不请求微信，响应带 `todo: "WECHAT_OAUTH"`。
- **家长锁：** `lib/api/modules/parent-lock.ts` 比对内存里的明文 `pin`。初始值是 `process.env.PARENT_LOCK_PIN || "2580"`（`memory.ts`）。连续错 5 次锁定 60 秒。通过后发 `plock-...` 会话，10 分钟，存在内存和本地 `parentToken`。改密写回内存明文，不写数据库。`ensureDemoFamily` 在库里放的 `pinHash` 是固定字符串 `"stub-not-a-real-hash"`，之后没有代码更新它。
- **后台：** `requireAdmin` 比对请求头 `x-admin-token` 与 `process.env.ADMIN_TOKEN || "dev-admin"`，或者 Bearer `admin-stub`。`admin.ts` 的增删改只改内存，创建响应带 `todo: "CMS_PERSIST"`。没有管理界面。
- **支付：** `lib/billing/skus.ts` 三个 SKU：`no-ads-month`（1800 分）、`subject-pack`（3000 分，权益范围硬编码 `eng-starter`）、`all-year`（12800 分）。`confirmOrder` 必须 `stubPaid === true` 才把订单标为已支付并往内存 `entitlements` 推一条。订单和权益都不入库。
- **广告：** `unlockWithAd` 不校验广告平台。同一 scope 未过期则 409。权益 24 小时，只在内存。

设置页（`SettingsScreen`）有一句：「隐私政策与儿童个人信息规则还没定稿。正式上线前需要勾选同意、可撤回授权。」家长中心「隐私与注销」写明注销、撤回授权、日志脱敏都还是待办。没有同意勾选，也没有把同意时间存下来。

## 10. 跟读与评分数据流

跟读只在浏览器里发生，应用服务器收不到音频，也没有评分接口。

1. 关卡步骤 `type === "speak"` 时，`LevelPlayer` 渲染 `SpeakBoard`。
2. `SpeakBoard` 先 `playPromptAsync(step.promptAudio, promptLine)`。`lib/client/speech.ts` 的 `playPrompt`：地址以 `http(s):` 或 `/` 开头就播文件；失败再用 `speechSynthesis`。中文语速 0.92，英文 0.86。夹具音频是站内 mp3，例如 `/audio/eng-starter-03/q5.mp3`。
3. 然后 `listenForSpeech`（`lib/client/listen-mic.ts`）使用 `SpeechRecognition` 或 `webkitSpeechRecognition`，默认 7 秒。没有把音频 POST 到本应用。
4. 识别文本交给 `speechMatches`（`lib/client/speech-match.ts`）。对照目标是 `step.speakText || step.promptSpeak`，不是步骤上的 `answer`。跟读夹具里 `answer` 常为字面量 `"spoken"`。匹配规则是宽松的：忽略大小写和标点，允许包含关系、编辑距离和大约一半词命中。文件头注释写「不上传录音」，指的是这个函数本身不上传。
5. 对上了调用 `onPass()` → `LevelPlayer.succeed()`。没对上调用 `onMiss()`，`mistakes` 加 1。跟读错满 2 次时，`miss()` 会再播一遍示范并在 900ms 后自动 `succeed()`。
6. **空识别：** `listenForSpeech` 返回 `{ ok: false, reason: "empty" }`（超时无字、`no-speech`、识别结束但没有字）。`SpeakBoard` 把提示设为「没听清，再试一次。」然后 return，**不**调用 `onMiss()`，因此不加错、不掉星。`app/`、`components/`、`lib/`、`prisma/`、`content/`、`scripts/` 里没有字符串 `no_hearing`，没有对应事件类型、字段或接口。
7. **没有麦克风或被拒绝：** 提示改为可以点「我说完了」。该按钮直接 `onPass()`，不经过识别，算作这一步通过。
8. 整关结束才把客户端算好的 `score` / `stars` 交给 `completeLevel`。服务端不重算，也不知道哪一步是跟读、哪一步是空听。

点选、拖拽、排序同样在浏览器里对答案（`LevelPlayer.choose`、`DragBoard.drop`、`SortBoard`），错了就 `mistakes += 1`。`GET /api/levels/:id` 的 `getLevel` 返回完整 `LevelDocument`，里面包含 `answer`。客观题现在也不是服务端权威分。

听一听阶段不判分。`playIntro` 播 `audioIntro`，失败才系统朗读；再失败用 `voiceCaption` 提示看屏幕上的字。用户点「我听完了」进入题目。

年龄过滤在 `LevelPlayer.stepsFor`：步骤带 `ages` 时只留给包含当前年龄段的步骤；滤完为空则退回全部步骤。夹具里跟读步骤多数标了 `B` 或 `C`，没有标 `A`。这是内容约定，不是服务端拒绝 A 段跟读。

## 11. 课文音频从哪来

`scripts/generate-audio.mjs` 调用本机 `piper`（可用 `PIPER_BIN`），中文模型 `zh_CN-huayan-medium`，英文模型 `en_US-lessac-medium`，`--length-scale 1.15`，再经 ffmpeg 写成 `public/audio/<关卡 id>/*.mp3`。孩子端播这些文件，不请求 TTS 接口。模型下到临时目录，不进仓库。`scripts/generate-art.mjs` 生成 `public/art/` 的 SVG。这两支脚本不在运行时调用。

## 12. 源码里没有的能力

下面这些在 `prisma/schema.prisma` 和 `lib/`、`app/` 中都不存在，后续文档把它们当作待建，而不是现成模块：`KnowledgePoint`、`Course`（规划里的专题，不是现有 `Pack`）、`KnowledgeDependency`、`Question`、`LearningEvent`、`LearningSession`、`KnowledgeMastery`、`ReviewPlan`、`GamePlugin`。也没有同意记录、生产环境密钥隔离、服务端客观题判分。
