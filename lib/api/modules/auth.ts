import { bearer, HttpError, jsonOk, asString } from "@/lib/api/http";
import { activeEntitlements, currentChild, db } from "@/lib/api/memory";
import { persistPhone } from "@/lib/api/persist";
import { DEMO_ADMIN_TOKEN, DEMO_SMS_CODE, isProduction, logConfigOnce } from "@/lib/api/secrets";

const DEMO_CODE = DEMO_SMS_CODE;
const COOLDOWN_MS = 60_000;
const CODE_TTL_MS = 5 * 60_000;
const PHONE_RE = /^1[3-9]\d{9}$/;

export function requireUser(request: Request) {
  const token = bearer(request);
  if (token !== "stub-parent-token") {
    throw new HttpError(401, "UNAUTHENTICATED", "未登录或 token 失效");
  }
  return db().user;
}

export function requireAdmin(request: Request) {
  const header = request.headers.get("x-admin-token") ?? "";
  if (isProduction()) {
    const configured = (process.env.ADMIN_TOKEN ?? "").trim();
    if (!configured || configured === DEMO_ADMIN_TOKEN) {
      logConfigOnce("admin", "生产环境的 ADMIN_TOKEN 未设置，或仍是演示值 dev-admin。后台接口已拒绝。");
      throw new HttpError(403, "FORBIDDEN", "后台令牌未配置");
    }
    if (header !== configured) throw new HttpError(403, "FORBIDDEN", "需要后台令牌");
    return;
  }
  const expected = process.env.ADMIN_TOKEN || DEMO_ADMIN_TOKEN;
  if (header !== expected && bearer(request) !== "admin-stub") {
    throw new HttpError(403, "FORBIDDEN", "需要后台令牌");
  }
}

function publicUser() {
  const user = db().user;
  return {
    id: user.id,
    phone: user.phone,
    wechatOpenId: user.wechatOpenId,
    nickname: user.nickname,
    role: user.role,
    guardianConsentAt: user.guardianConsentAt,
  };
}

function rejectDemoSms() {
  if (!isProduction()) return;
  logConfigOnce("sms", "生产环境未接入短信服务，拒绝发放或接受演示验证码 000000。");
  throw new HttpError(503, "SMS_UNAVAILABLE", "短信登录在生产环境还不能用");
}

export function sendSms(body: Record<string, unknown>) {
  rejectDemoSms();
  const phone = asString(body.phone);
  if (!PHONE_RE.test(phone)) {
    throw new HttpError(400, "PHONE_INVALID", "手机号非法");
  }
  const state = db();
  const existing = state.sms.get(phone);
  const now = Date.now();
  if (existing && now - existing.lastSentAt < COOLDOWN_MS) {
    const cooldownSec = Math.ceil((COOLDOWN_MS - (now - existing.lastSentAt)) / 1000);
    throw new HttpError(409, "TOO_FREQUENT", "发送过频", { cooldownSec });
  }
  // TODO: 接入短信服务商。当前不发真实短信，验证码固定为 000000。
  state.sms.set(phone, {
    code: DEMO_CODE,
    expireAt: now + CODE_TTL_MS,
    lastSentAt: now,
  });
  return jsonOk({
    success: true,
    cooldownSec: 60,
    todo: "SMS_PROVIDER",
  });
}

export async function loginSms(body: Record<string, unknown>) {
  rejectDemoSms();
  const phone = asString(body.phone);
  const code = asString(body.code);
  if (!PHONE_RE.test(phone)) {
    throw new HttpError(400, "PHONE_INVALID", "手机号非法");
  }
  const ticket = db().sms.get(phone);
  if (!ticket || ticket.expireAt < Date.now()) {
    throw new HttpError(401, "CODE_INVALID", "验证码错误或过期");
  }
  if (code !== ticket.code) {
    throw new HttpError(401, "CODE_INVALID", "验证码错误或过期");
  }
  const user = db().user;
  const isNewUser = user.phone === null;
  user.phone = phone;
  db().sms.delete(phone);
  await persistPhone(phone);
  return jsonOk({
    token: "stub-parent-token",
    user: publicUser(),
    isNewUser,
    todo: "SESSION_JWT",
  });
}

export function loginWechat(body: Record<string, unknown>) {
  const code = asString(body.code);
  if (!code) {
    throw new HttpError(400, "CODE_INVALID", "缺少微信 code");
  }
  // TODO: 用 code 换微信 openid，并与手机号账号合并。这里不请求微信。
  return jsonOk({
    token: "stub-parent-token",
    user: publicUser(),
    isNewUser: false,
    todo: "WECHAT_OAUTH",
    message: "微信登录尚未接入，已返回本地演示会话",
  });
}

export function getMe(request: Request) {
  requireUser(request);
  const child = currentChild(db());
  return jsonOk({
    user: publicUser(),
    consentRequired: isProduction(),
    demoCredentials: !isProduction(),
    currentChild: child,
    entitlements: activeEntitlements(db()).map((item) => ({
      type: item.type,
      scope: item.scope,
      expireAt: item.expireAt,
    })),
  });
}
