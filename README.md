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

`npm install` 会执行 `prisma generate`。没设 `DATABASE_URL` 时，接口数据在进程内存里，重启会丢掉进度和订单，游戏次数记在浏览器里。

要让进度跨重启保留，用本机 PostgreSQL：

```bash
docker compose up -d
cp .env.example .env
npx prisma migrate deploy
npm run dev
```

`.env` 里的 `DATABASE_URL` 指向 `postgresql://postgres:postgres@localhost:5432/zonghe_qimeng`。这时关卡星星、完成记录、今日任务和每个孩子每天的游戏次数写进数据库。短信、微信、广告和支付仍是桩，订单还在内存里。没装数据库就不要设置 `DATABASE_URL`，`npm run dev` 照旧。

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
| `DATABASE_URL` | 设了就用 PostgreSQL 保存进度、今日任务、游戏次数和课程目录。开发环境不设则只用内存 |
| `PARENT_LOCK_PIN` | 开发环境的家长锁密码，默认 `2580`。生产环境缺省或仍是 `2580` 时家长锁拒绝 |
| `ADMIN_TOKEN` | 后台接口请求头 `x-admin-token`。开发环境默认 `dev-admin`。生产环境缺省或仍是 `dev-admin` 时后台拒绝 |
| `SMS_*` / `WECHAT_*` / `PAY_*` / `AD_*` | 占位。未接入 |

开发环境的演示验证码固定 `000000`。家长登录页会写这句话。Bearer 令牌是 `stub-parent-token`。

生产环境（`NODE_ENV=production`）没有 `DATABASE_URL` 时进程不能对外服务，也不会用内存冒充已经保存。生产环境不接受演示 PIN、演示验证码和 `dev-admin`。监护人同意时间空着时，生产环境的今日页会先要求同意；开发环境可以跳过。

## 内测清单

给内部家长和同事点一遍。进度和订单都在进程内存里，重启 `npm run dev` 会清空。

怎么跑：

```bash
npm install
npm run dev
```

浏览器打开 [http://127.0.0.1:41731](http://127.0.0.1:41731)。

| 用途 | 值 |
| --- | --- |
| 家长锁 | `2580` |
| 手机号 | `13800138000`（任意 `1` 开头的 11 位也可以） |
| 短信验证码 | `000000`，不会真发短信 |
| 登录令牌 | `stub-parent-token`，存在这台浏览器里 |
| 孩子 | 内置「小芽」，也可以自己起名，最多 4 个 |
| 后台 | 请求头 `x-admin-token: dev-admin` |

建议点一遍：

1. 选年龄、起名，今日能看到任务。没有任务时有去课程馆、去游戏的入口。
2. 玩一关：听一听。没有音频文件就用系统朗读；朗读关着或设备读不出来时，屏幕上有字。答错出现「再试一次」，答对有星星。
3. 课程馆四个启蒙包都能打开。找不到的课包会说明，而不是只写网络不好。
4. 五个游戏都能开始。次数用完能看到广告和会员的桩。
5. 我的 → 学习报告：分钟、完成关数、一句薄弱提示。还没玩时有空状态。
6. 切换孩子后，报告跟着变。设置里登录，刷新后仍显示手机号。
7. 家长中心输入 `2580`。
8. 今日、课程、游戏、报告在接口失败时可以重试；带底栏的页面底栏还在。

微信、真短信、真广告、支付都还是桩。

## 先体验哪条路径

1. 闪屏后选年龄，给宝宝起名，进入今日。
2. 点「开始挑战」，听一听，点选题，看到星星。答错会显示「再试一次」，可以再点。
3. 课程馆 → 英语 → English Starter，十关都能玩，从 Hello & Bye 到 Review。结算页的「下一关」会进下一关。
4. 课程馆里语文、数学（数感和生活）、英语、认知四个启蒙包都能玩。未购买课包以后仍会锁，广告、支付、短信和微信都还是桩。
5. 游戏乐园五款都能玩：颜色配对、动物找不同、数一数冲关、形状拼拼乐、洗手顺序挑战。每款每天 3 次，玩完才扣次数。用完后弹层可以模拟「看广告再玩 1 次」，会员不限次数。
6. 我的 → 家长中心，密码 `2580`。会员页可以模拟开通，订单会出现在家长中心。
7. 我的 → 学习报告。本周分钟、完成关数，以及根据已完成关卡算出的一句薄弱提示。设置里可以用手机号 `13800138000`、验证码 `000000` 登录；「切换」会换成另一个孩子，报告跟着变。

## 目录

```text
app/                  页面与 Route Handlers
  api/                与《MVP接口清单》相同的路径，前面加 /api
components/           底栏、大按钮、星星、锁标、家长锁键盘、价卡、关卡播放器
content/fixtures/     语文/英语/认知/数学数感各 10 关，数学生活 5 关，五款小游戏
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

语文、英语、认知和数学数感各 10 关，数学生活仍是 5 关，都在 `content/fixtures/levels/`，目录里标了可玩。跟读用浏览器语音识别，宽松对照，不上传录音；没有麦克风时仍可点「我说完了」。拖拽和排序用点选或手指拖放。今日页按孩子年龄从语言、数学、英语、认知各抽一关，当天固定：3–4 岁从第 1 关起，并且不排数学生活；4–5 岁从第 2 关起；5–6 岁从第 3 关起。玩完的任务显示「完成」，继续卡跳到下一科。听讲稿和点选提示的音频在 `public/audio/<关卡 id>/`。中文用 Piper 的 huayan（女声，稍慢），英文用 Piper 的 lessac（美式女声，稍慢），都在生成内容时写成 mp3，孩子端不请求语音接口。点「听一听」会播这些文件。文件缺失或播不出来时，仍用系统朗读，再不行就看屏幕上的字。插画在 `public/art/`，每关听一听用自己的封面，关卡和五款游戏都引用这些 SVG。对错播放 `public/audio/sfx/` 里的木琴和轻提示。五款游戏的开场和题目语音在 `public/audio/games/`。要重新生成音频：安装 `piper-tts` 和 `ffmpeg` 后运行 `node scripts/generate-audio.mjs`（语音模型会下到临时目录，不进仓库）。只补游戏语音和提示音用 `node scripts/generate-audio.mjs --games`。插画脚本是 `node scripts/generate-art.mjs`。3–4 岁不做跟读，4–5 岁跟短词，5–6 岁跟短句。跟读在浏览器里听，录音不会上传到这个应用。

五款小游戏在 `content/fixtures/games/`。每日次数记在浏览器里，玩完一局减 1，第二天重新计数。看广告和会员都还是桩：广告按钮会加 1 次，不播真广告。

课包大纲：英语、数学数感、语文、生活认知各 10 关，数学生活 5 关。

学习报告读的是当前孩子本周已完成的关卡。有学习秒数时至少显示 1 分钟。一句提示按进度来：还没玩就从语言开始；哪一科还是 0 关就点那一科；四科都玩过就点星星最少的那科。

## 套成 iOS / Android 壳

网页仍然是主体。`capacitor.config.ts` 让以后的 WebView 打开这个 Next 站点，而不是把接口打成静态包。原生工程不在仓库里，需要本机的 Xcode 或 Android Studio 再生成。

```bash
# 开发服先开着
npm run dev

# 另开一个终端。模拟器访问电脑时，把地址改成局域网 IP。
export CAPACITOR_SERVER_URL=http://127.0.0.1:41731
npx cap add ios      # 需要 Xcode，只在本机生成 ios/
npx cap add android  # 需要 Android SDK，只在本机生成 android/
npx cap sync
npx cap open ios     # 或 npx cap open android
```

没设 `CAPACITOR_SERVER_URL` 时，`cap sync` 只会拷贝 `capacitor/www/index.html` 那张说明页。设了之后，WebView 的首页就是网页的 `/`。

状态栏、安全区和 Android 返回键先留在网页侧：页面使用 `viewport-fit=cover` 和 `env(safe-area-inset-*)`，底栏已经避开底部安全区。进了原生壳之后，`NativeShell` 会听返回键并走网页历史，不直接退出。状态栏插件（`@capacitor/status-bar`）和 `@capacitor/app` 等真机工程加上后再接。登录令牌仍是网页里的 `stub-parent-token`，存在本机 `localStorage`；原生安全存储留到接 JWT 时再做。

## 这一版没有做

对照 8 周看板，这里只覆盖可运行的地基和一关播放器骨架：

- 真实验证码、微信 OAuth、JWT
- 激励视频 SDK、服务端广告验签
- 微信支付、Apple IAP、恢复购买
- 启蒙包以外的关卡，以及把跟读录音上传到服务器
- 提交 `ios/`、`android/` 原生工程（配置已经在，本机再 `cap add`）
- 没设 `DATABASE_URL` 时，进度仍只在内存里（设了就会写入 PostgreSQL）
