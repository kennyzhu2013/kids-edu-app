# 当前数据库与持久化

- **审查基线：** `d1f84de49a8753115f47006f0dd1616bc53ca1c0`
- **结论先行：** Prisma 模型比运行时真正落库的数据多。请求始终经 `lib/api/memory.ts` 的内存工作集。只有设置了 `DATABASE_URL` 时，进度、今日任务、游戏次数、孩子档案和演示用户手机号会回写 PostgreSQL。订单、权益、家长锁改密、短信、后台编辑不入库。

## 1. Schema 与迁移

模型都在 `prisma/schema.prisma`。数据源是 PostgreSQL，`url = env("DATABASE_URL")`。

已有迁移：

| 目录 | 作用 |
|---|---|
| `prisma/migrations/20261018120000_init` | 建 `User`、`Child`、`Subject`、`Pack`、`Level`、`Game`、`Progress`、`Order`、`Entitlement`、`ParentLock`、`Asset` 及索引、外键 |
| `prisma/migrations/20261114160000_progress_state` | 建 `TodayPlan`、`GameQuota` |
| `prisma/migrations/migration_lock.toml` | `provider = "postgresql"` |

`package.json` 没有 `migrate` 脚本。README 写的启用方式是：`docker compose up -d`，复制 `.env.example`，再 `npx prisma migrate deploy`。`schema.prisma` 顶部注释仍写 `npx prisma migrate dev --name init`，那是另一条命令；现有迁移已经覆盖当前 schema，Sprint 0 不执行其中任何一条。

`docker-compose.yml` 的服务 `db` 使用 `postgres:16`，用户 / 密码 / 库名都是 `postgres` / `postgres` / `zonghe_qimeng`，端口 `5432`，卷 `qimeng-pg`。`.env.example` 的 `DATABASE_URL` 指向这条连接，并写明本地 `npm run dev` 可以不连数据库。

`scripts/seed.ts` 默认只做夹具校验。`SEED_DATABASE=1` 时才 `new PrismaClient()`，调用 `syncCatalog` 和 `ensureDemoFamily`。`postinstall` 只跑 `prisma generate`。

`scripts/smoke-persist.ts` 是手工脚本：没有 `DATABASE_URL` 会直接抛错。它打完一关、扣一次颜色配对，再重置内存并 `ensureReady()`，检查进度、今日勾选和配额还在。它不是测试套件的一部分。

## 2. 模型与运行时是否使用

| 模型 | 关键约束 | 运行时谁写 | 运行时谁读 |
|---|---|---|---|
| `User` | `phone`、`wechatOpenId` 可空且唯一 | `ensureDemoFamily` 保证 `id = "user-demo"`；`persistPhone` 更新其 `phone` | `loadFromDatabase` 只读这个 id 的 `phone` |
| `Child` | `userId` 外键，删除用户则级联 | 创建 / 修改 / 切换当前孩子时 `persistChild`、`persistCurrentChild`；空账号时 `ensureDemoFamily` 插入 `child-demo` | 启动时按 `userId = "user-demo"` 整表替换内存 `children` |
| `Subject` | 主键是业务 id（`lang` / `math` / `eng` / `life`） | `syncCatalog` 的 `createMany({ skipDuplicates: true })`，不更新已有行 | API 不读这张表，读内存里的夹具 |
| `Pack` | `subjectId` 外键 | `syncCatalog` upsert。更新标题、简介、关数、年龄、`access`、`accent` | API 不读 |
| `Level` | `@@unique([packId, order])`，`config Json` | upsert。更新 `title`、`goal`、`playable`、`rewardCopy`、`config`。**不**更新 `order`、`packId`、`ageBand`、`vocab`、`types`、`minutes`、`status` | API 不读。播放用的是内存 `playableLevels` |
| `Game` | `knowledgeTags String[]`，`config Json` | upsert。更新 `title`、`playable`、`config`。**不**更新 `knowledgeTags`、`dailyFree` 等 | API 不读 |
| `Progress` | `@@unique([childId, levelId])`，`clientEventId String? @unique` | `persistProgress` upsert | 启动时灌入内存。完成接口只查内存 |
| `TodayPlan` | `@@unique([childId, day])`，`levelIds String[]` | `persistTodayPlan` | 启动时灌入，见下文顺序问题 |
| `GameQuota` | `@@unique([childId, gameId, day])`。`gameId` **没有**到 `Game` 的外键 | `persistQuota` | 启动时灌入。无 `DATABASE_URL` 时接口不加计数 |
| `Order` | `amount` 为分，`channel` 自由字符串 | **没有写库函数** | 不读。订单只在内存 |
| `Entitlement` | `type` 自由字符串 | **没有写库函数** | 不读。广告解锁和支付入账只在内存，重启即失 |
| `ParentLock` | `userId` 唯一，字段是 `pinHash` | 只在 `ensureDemoFamily` 创建时写入 `pinHash = "stub-not-a-real-hash"`，`update: {}` 不再改 | 校验不读这张表。明文 PIN 在内存 |
| `Asset` | `cdnUrl` 可空 | 不写库。内存里的 `asset-mia` 已发布，地址是 `/art/mia.svg` | 后台列表读内存 |

Schema 注释写「运行时接口仍走内存 + JSON 夹具」。对请求路径这仍然成立。注释没有写明：有 `DATABASE_URL` 时进度、今日、配额、孩子和手机号会回写。以 `persist.ts` 为准。

不存在的表：`KnowledgePoint`、`CourseKnowledgePoint`、`KnowledgeDependency`、`Question`、`LearningEvent`、`LearningSession`、`KnowledgeMastery`、`ReviewPlan`，以及任何同意 / 审计表。

## 3. 有库与无库两条路径

```text
请求
  → dispatch
    → ensureReady()
         DATABASE_URL 空：跳过
         DATABASE_URL 有：syncCatalog + ensureDemoFamily + 把 user-demo 的进度灌进内存
    → 模块只读写 db()
    → 少数 persist* 再 upsert 回 PostgreSQL
```

无库时进程重启会丢掉：新孩子、进度、今日计划、订单、权益、改过的 PIN、短信冷却、后台编辑。游戏次数还在浏览器 `localStorage` 的 `qimeng:plays`。README「内测清单」把进度和订单都说成内存，这和没设 `DATABASE_URL` 的路径一致。README 后文又写：设了库之后星星、完成记录、今日任务和每个孩子每天的游戏次数进数据库，订单仍在内存。这和 `persist.ts`、`orders.ts` 一致。

README 目录说明里还有一句「每日次数记在浏览器里」。那只覆盖无库路径。有库时浏览器里的次数会被 `applyServerQuotas` / `mergeServerQuota` 盖成服务端数字。

没有「生产环境禁止内存」的分支。生产如果漏配 `DATABASE_URL`，会以内存桩对外，重启即丢数据，和开发机相同。

设了 `DATABASE_URL` 但数据库不可达：`ensureReady` 失败，`dispatch` 返回 500 `INTERNAL`。不会静默退回内存。

## 4. 进度幂等

`Progress.clientEventId` 在 schema 和 init 迁移里都是唯一索引。

`completeLevel` 的内存逻辑：

1. 非空 `clientEventId` 若已在 `state.progress` 里，返回原行，带 `idempotent: true`，不累加时长。
2. 同一孩子同一关已有行、但事件 id 不同：更新该行，时长相加，星星和分数取较大值，并换成新的 `clientEventId`。
3. 否则插入。

因此「同一次结算重试」不会重复计时；「再玩一次」（新 UUID）会加时长、抬高星星，不会多出一行。这是关卡完成的幂等，不是逐步学习事件的幂等。

幂等检查在内存，唯一约束在数据库。两个并发请求带着同一个新 `clientEventId` 时，内存检查可能都看不到对方，后一次 `upsert` 会撞上 `clientEventId` 唯一索引并变成 500。正常界面一次只发一个请求，这个窗口现在没有被事务包住。

`GameQuota` 没有事件 id。`changeQuota` 每次把 `used` 或 `bonus` 加 1。客户端用组件实例上的 `spent` ref 避免同一挂载扣两次，刷新后的新一局会再扣。

`TodayPlan` 没有单独的幂等键，靠 `@@unique([childId, day])` 的 upsert。

## 5. 今日任务加载顺序

`loadFromDatabase` 对 `todayPlan.findMany` **没有** `orderBy`。内存结构是 `todayPlans[childId]` 只留一份。多天历史都在库里时，最后遍历到的那一行会盖住其他天。

`tasksForToday` 发现这份计划的 `day` 不是今天、或年龄段变了，就重新抽关并 upsert 今天的行。若无序结果里今天的行没有被留在内存里，重启后的第一次 `getToday` 会重新抽题并覆盖今天的 `levelIds`。这和模型注释「当天固定的今日任务」不一致。只有一行（今天）时没有这个问题。

游戏配额按 `childId:gameId:day` 放进字典，多天可以同时在内存里，没有同样的覆盖问题。

## 6. 目录同步不是读取来源

`syncCatalog` 在每次有库进程第一次 `ensureReady` 时跑，也会在 `SEED_DATABASE=1` 时跑。它把夹具 upsert 进 `Subject` / `Pack` / `Level` / `Game`。

关卡 `config`：能在 `loadPlayableLevels()` 里找到的，整份 `LevelDocument` 写入 `config`；找不到的写 `{ outline: true, goal, vocab }`。当前 `lib/content/load.ts` 为目录里的 45 关都 import 了夹具，所以有库同步时 `config` 是完整关卡，含答案。

游戏 `config` 同理，来自 `loadGameConfigs()`。

因为读路径不查询这些表，直接改数据库不会改变正在跑的接口，除非同时改夹具并重启（内存 `CONTENT_REV` 或冷启动会重载夹具）。反过来，后台 `adminUpdate` 改的是内存，不调用 `syncCatalog`，重启后被夹具覆盖。

`Level` / `Game` 的 update 子句字段少于 create。若某行先被种下，后来夹具改了 `order` 或 `knowledgeTags`，再次同步不会把这些列改掉。新环境一次种入则是全量 create。这是以后增量迁移要避开的坑：不要假设库里的目录列永远等于夹具。

## 7. 演示数据与级联

`Child`、`Progress`、`TodayPlan`、`GameQuota`、`Order`、`Entitlement`、`ParentLock` 都 `onDelete: Cascade` 到用户或孩子或关卡。现在只有 `user-demo` 这一条真实写入路径。不存在按手机号注册第二个 `User` 的代码，登录只是给这一行填 `phone`。

`Child.ageBand`、`Progress.status`、`Order.status`、`Entitlement.type` 在库里都是自由 `String`。收窄发生在 TypeScript：`memory.ts` 把年龄段收成 `"A" | "B" | "C"`，进度状态收成 `started | completed`。库里若出现别的字符串，加载时年龄段会落成 A，进度状态会落成 `started`（`persist.ts` 里 `ageBand === "B" || ageBand === "C"`，以及 `status === "completed"`）。

`GameQuota.day` 存的是客户端传来的字符串。`dayFor` 接受 `YYYY-M-D` 这种不补零形式，否则用服务器 UTC 日期。今日计划的 `day` 则一定是 UTC `YYYY-MM-DD`。两种 `day` 不能混用。

## 8. 和后续表的衔接点（只描述，不改 schema）

现有表可以继续当教学组织和演示账本，不需要先拆掉：

- `Pack` / `Level` 继续表示课包和关卡。`Level.config` 已是整份关卡 JSON，新字段可以先加在夹具和 Zod 上，再决定要不要拆列。
- `Game.knowledgeTags` 是 `String[]`，现在的值只有 `colors`、`animals`、`numbers`、`shapes`、`habits`。它不是外键，不能当作正式知识点。
- `Progress` 一行对应「某孩子某关的最好成绩加累计时长」，不是事件流水。新的 `LearningEvent` 应另表追加，不要把逐步作答塞进这一行。
- `Progress.clientEventId` 的唯一约束可以当新事件幂等的先例，但是一关一行，不能直接当成每一步一个事件。
- `TodayPlan` 是「今天四科各一关」的 id 列表，没有复习项，也没有知识点。
- `ParentLock.pinHash` 列已经存在，只是运行时没用它。Sprint 1 若隔离演示 PIN，应改校验路径，而不是再加一张锁表。
