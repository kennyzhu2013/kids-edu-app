// 直接调用完成接口和生产守卫。最后会把本机 PostgreSQL 里 user-demo 的占位 pinHash 换成一次测试密码的哈希。
// 不放进 npm run check:sprint1，因为那条命令不依赖数据库。
import { HttpError } from "../lib/api/http";
import { resetMemoryForTests, db } from "../lib/api/memory";
import { requireAdmin, sendSms } from "../lib/api/modules/auth";
import { updateParentLock, verifyParentLock } from "../lib/api/modules/parent-lock";
import { completeLevel } from "../lib/api/modules/progress";

function request(headers?: Record<string, string>) {
  return new Request("http://local.test/api", {
    headers: { authorization: "Bearer stub-parent-token", ...headers },
  });
}

type Json = { progress?: { stars?: number }; message?: string; token?: string };

async function bodyOf(response: Response) {
  return response.json() as Promise<Json>;
}

function starsOf(body: Json) {
  return body.progress?.stars;
}

function setEnv(key: string, value: string | undefined) {
  if (value === undefined) delete process.env[key];
  else process.env[key] = value;
}

function updateFromSession(token: string) {
  return updateParentLock(request({ "x-parent-lock": token }), { newPin: "1357" });
}

async function capture(run: () => Promise<Response> | Response) {
  try {
    const response = await run();
    return { status: response.status, body: await bodyOf(response) };
  } catch (error) {
    if (error instanceof HttpError) return { status: error.status, body: { code: error.code, message: error.message } };
    throw error;
  }
}

async function main() {
  resetMemoryForTests();
  db();
  const wrong = await capture(() =>
    completeLevel(request(), "math-starter-01", {
      childId: "child-demo",
      stars: 3,
      score: 100,
      duration: 12,
      clientEventId: "evt-wrong-stars",
      steps: [
        { id: "q1", choice: "two" },
        { id: "q2", choice: "s3" },
        { id: "q3", choice: "n3" },
        { id: "q-drag", placements: { apple: "sky", star: "fruit" } },
      ],
    }),
  );
  if (wrong.status !== 200 || starsOf(wrong.body) !== 0) {
    throw new Error(`forged stars: ${wrong.status} ${JSON.stringify(wrong.body)}`);
  }

  const missing = await capture(() =>
    completeLevel(request(), "math-starter-02", {
      childId: "child-demo",
      stars: 3,
      score: 100,
      duration: 8,
      clientEventId: "evt-missing",
    }),
  );
  if (missing.status !== 400) throw new Error(`missing steps: ${missing.status}`);

  const other = await capture(() =>
    completeLevel(request(), "lang-starter-01", {
      childId: "child-demo",
      stars: 2,
      score: 80,
      duration: 9,
      clientEventId: "evt-lang",
    }),
  );
  if (other.status !== 200 || starsOf(other.body) !== 2) {
    throw new Error(`lang stars: ${JSON.stringify(other.body)}`);
  }

  const life = await capture(() =>
    completeLevel(request(), "life-starter-02", {
      childId: "child-demo",
      stars: 3,
      score: 90,
      duration: 6,
      clientEventId: "evt-life",
    }),
  );
  if (life.status !== 200 || starsOf(life.body) !== 3) throw new Error("life pack rejected the old body");

  const mathLife = await capture(() =>
    completeLevel(request(), "math-life-01", {
      childId: "child-demo",
      stars: 1,
      score: 40,
      duration: 5,
      clientEventId: "evt-math-life",
    }),
  );
  if (mathLife.status !== 200 || starsOf(mathLife.body) !== 1) throw new Error("math-life rejected the old body");

  const unknownChild = await capture(() =>
    completeLevel(request(), "eng-starter-01", {
      childId: "child-does-not-exist",
      stars: 3,
      score: 100,
      duration: 4,
      clientEventId: "evt-missing-child",
    }),
  );
  if (unknownChild.status !== 404) throw new Error(`unknown child: ${unknownChild.status}`);

  setEnv("NODE_ENV", "production");
  setEnv("DATABASE_URL", undefined);
  setEnv("PARENT_LOCK_PIN", "2580");
  setEnv("ADMIN_TOKEN", "dev-admin");
  resetMemoryForTests();
  let databaseBlocked = false;
  try {
    db();
  } catch (error) {
    databaseBlocked = error instanceof Error && error.message.includes("DATABASE_URL");
  }
  if (!databaseBlocked) throw new Error("production without DATABASE_URL created memory");

  setEnv("DATABASE_URL", "postgresql://kids:kids@localhost:5432/zonghe_qimeng?schema=public");
  const sms = await capture(() => sendSms({ phone: "13800138000" }));
  if (sms.status !== 503) throw new Error(`sms: ${sms.status} ${sms.body.message}`);
  const admin = await capture(() => {
    requireAdmin(new Request("http://local.test/admin", { headers: { "x-admin-token": "dev-admin", authorization: "Bearer admin-stub" } }));
    return new Response(null, { status: 200 });
  });
  if (admin.status !== 403) throw new Error(`admin: ${admin.status}`);
  const pin = await capture(() => verifyParentLock(request(), { pin: "2580" }));
  if (pin.status !== 503 && pin.status !== 403) throw new Error(`pin: ${pin.status} ${pin.body.message}`);

  setEnv("PARENT_LOCK_PIN", "2468");
  resetMemoryForTests();
  const opened = await capture(() => verifyParentLock(request(), { pin: "2468" }));
  if (opened.status !== 200) throw new Error(`real pin: ${opened.status} ${opened.body.message}`);
  const demoStillRejected = await capture(() => verifyParentLock(request(), { pin: "2580" }));
  if (demoStillRejected.status === 200) throw new Error("production accepted 2580 after a real pin was configured");
  const changed = await capture(() =>
    verifyParentLock(request(), { pin: "2468" }).then(async (response) => {
      const data = (await response.clone().json()) as { token?: string };
      return updateFromSession(data.token ?? "");
    }),
  );
  if (changed.status !== 200) throw new Error(`pin update: ${changed.status} ${changed.body.message}`);

  console.log("handler checks passed", {
    mathStars: starsOf(wrong.body),
    langStars: starsOf(other.body),
    sms: sms.status,
    admin: admin.status,
    pin: pin.status,
  });
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
