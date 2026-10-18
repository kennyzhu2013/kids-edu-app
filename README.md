# 综合启蒙

3–6 岁中英启蒙的 Web MVP 脚手架。孩子端四栏是「今日 / 课程 / 游戏 / 我的」。这一版能本地跑起来，并用英语第 1 关走完「听一听 → 点选 → 星星」。

短信、微信登录、激励广告、微信支付和 Apple 内购都是桩，代码里标了 `TODO`，没有接真 SDK。

## 本地运行

需要 Node.js 22。

```bash
npm install
npm run dev
```

浏览器打开 [http://127.0.0.1:41731](http://127.0.0.1:41731)。

`npm install` 会执行 `prisma generate`。开发服务器不连接 PostgreSQL，接口数据在进程内存里，刷新进程会丢掉订单和进度。

校验内容夹具：

```bash
npm run seed
```

有数据库时再写入：

```bash
cp .env.example .env
npx prisma migrate dev --name init
SEED_DATABASE=1 npm run seed
```

## 环境变量

见 `.env.example`。

| 变量 | 现在的作用 |
| --- | --- |
| `DATABASE_URL` | 只有 `SEED_DATABASE=1` 或执行迁移时用到 |
| `PARENT_LOCK_PIN` | 家长锁演示密码，默认 `2580` |
| `ADMIN_TOKEN` | 后台接口请求头 `x-admin-token`，默认 `dev-admin` |
| `SMS_*` / `WECHAT_*` / `PAY_*` / `AD_*` | 占位。未接入 |

演示验证码固定 `000000`。家长登录页写了这句话。Bearer 令牌是 `stub-parent-token`。

## 先体验哪条路径

1. 闪屏后选年龄，给宝宝起名，进入今日。
2. 点「开始挑战」，听一听，点选题，看到星星。答错会显示「再试一次」，可以再点。
3. 课程馆 → 英语 → English Starter，五关都能玩：Hello & Bye、Colors、Animals、Numbers 1-5、Body。结算页的「下一关」会进下一关。
4. 其它学科仍带锁。广告、支付、短信和微信都还是桩。
5. 游戏乐园里「颜色配对」可玩，每天 3 次。用完后弹层可以模拟「看广告再玩 1 次」。
6. 我的 → 家长中心，密码 `2580`。会员页可以模拟开通，订单会出现在家长中心。

## 目录

```text
app/                  页面与 Route Handlers
  api/                与《MVP接口清单》相同的路径，前面加 /api
components/           底栏、大按钮、星星、锁标、家长锁键盘、价卡、关卡播放器
content/fixtures/     eng-starter-01、颜色配对、四科大纲
content/schemas/      关卡 JSON Schema
lib/api/modules/      按账号、孩子、内容、进度、解锁、订单、家长锁、后台拆开的桩
lib/content/          Zod 校验
prisma/schema.prisma  User / Child / Subject / Pack / Level / Game / Progress / Order / Entitlement / ParentLock / Asset
scripts/seed.ts       校验夹具，可选写入数据库
docs/source/          关卡脚本、接口清单、任务看板、Figma 打勾表
```

页面路径和接口路径撞车的两处，请走带 `/api` 的地址：`GET /api/today`、`GET /api/games`。其余清单路径也做了 rewrite，例如 `POST /auth/sms/send` 会进 `POST /api/auth/sms/send`。

## 接口桩

成功响应都带 `stub: true`。错误体是 `{ code, message, details? }`。

- 短信：不发真短信。60 秒内重复发送返回 409。
- 微信：`POST /api/auth/wechat` 不请求微信，返回演示会话和 `todo: WECHAT_OAUTH`。
- 广告：`POST /api/unlock/ad` 只要有非空 `adToken` 就记一条 24 小时解锁。不校验广告平台。
- 支付：`POST /api/orders` 只创建待支付订单。`confirm` 必须带 `{ "stubPaid": true }` 才会入账。
- 家长锁：比对 `PARENT_LOCK_PIN`，连续错 5 次冷却 60 秒。还没有做密码哈希。
- 后台：请求头 `x-admin-token: dev-admin`。改动只留在内存里。

## 内容

可玩样例是 `content/fixtures/levels/eng-starter-01.json`（Hello & Bye）。听讲稿来自英语课包第 1 关，A 龄只做听和点选。B/C 的跟读还没做。

颜色配对配置在 `content/fixtures/games/game-color-match.json`。音频字段是 `asset:` 占位，播放器用浏览器朗读顶上，没有 CDN 音频。

课包大纲覆盖英语、数学数感、数学生活、语文、生活认知，各 5 关，外加 5 个游戏位。除上面两个样例，其余不能通关。

## 这一版没有做

对照 8 周看板，这里只覆盖可运行的地基和一关播放器骨架：

- 真实验证码、微信 OAuth、JWT
- 激励视频 SDK、服务端广告验签
- 微信支付、Apple IAP、恢复购买
- 跟读评测、拖拽题、另外四关英语和其余学科的完整步骤
- Capacitor / App 壳
- 把进度写进 PostgreSQL（表结构已经在 Prisma schema 里）
