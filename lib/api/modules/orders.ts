import { findSku } from "@/lib/billing/skus";
import { HttpError, jsonOk, asString, pageOf } from "@/lib/api/http";
import { db, uid, type EntitlementRecord, type OrderRecord } from "@/lib/api/memory";
import { requireUser } from "@/lib/api/modules/auth";

const CHANNELS = new Set(["wechat", "apple_iap", "stub"]);

export function createOrder(request: Request, body: Record<string, unknown>) {
  requireUser(request);
  const sku = findSku(asString(body.skuId));
  if (!sku) throw new HttpError(400, "SKU_INVALID", "找不到这个商品");
  const channel = asString(body.channel) || "stub";
  if (!CHANNELS.has(channel)) throw new HttpError(400, "CHANNEL_INVALID", "支付渠道无法识别");
  const pending = db().orders.find((order) => order.userId === db().user.id && order.skuId === sku.id && order.status === "pending");
  if (pending) {
    throw new HttpError(409, "DUPLICATE_ORDER", "已有未支付订单", { orderId: pending.id });
  }
  const order: OrderRecord = {
    id: uid("order"),
    userId: db().user.id,
    skuId: sku.id,
    channel,
    status: "pending",
    amount: sku.amount,
    currency: "CNY",
    // TODO: 微信支付预下单 / Apple IAP。这里只返回桩参数。
    payParams: {
      stub: true,
      todo: "WECHAT_PAY_AND_APPLE_IAP",
      channel,
      message: "支付渠道未接入。确认时请传 stubPaid: true",
    },
    createdAt: new Date().toISOString(),
  };
  db().orders.push(order);
  return jsonOk({ orderId: order.id, payParams: order.payParams, order }, 201);
}

export function confirmOrder(request: Request, id: string, body: Record<string, unknown>) {
  requireUser(request);
  const order = db().orders.find((item) => item.id === id && item.userId === db().user.id);
  if (!order) throw new HttpError(404, "NOT_FOUND", "找不到这笔订单");
  if (order.status === "paid") {
    throw new HttpError(409, "STATE_CONFLICT", "订单已支付");
  }
  if (body.stubPaid !== true) {
    throw new HttpError(409, "STATE_CONFLICT", "没有可入账的支付回执");
  }
  order.status = "paid";
  const entitlement = entitlementFor(order);
  db().entitlements.push(entitlement);
  return jsonOk({ order, entitlements: [entitlement], todo: "PAYMENT_WEBHOOK" });
}

export function listOrders(request: Request, url: URL) {
  requireUser(request);
  const status = url.searchParams.get("status");
  let orders = db().orders.filter((order) => order.userId === db().user.id);
  if (status) orders = orders.filter((order) => order.status === status);
  const page = pageOf(orders, url);
  return jsonOk({ orders: page.items, page: page.page, pageSize: page.pageSize, total: page.total });
}

function entitlementFor(order: OrderRecord): EntitlementRecord {
  const createdAt = new Date().toISOString();
  if (order.skuId === "no-ads-month") {
    return {
      id: uid("ent"),
      userId: order.userId,
      childId: null,
      type: "no_ads",
      scope: null,
      expireAt: new Date(Date.now() + 30 * 86400000).toISOString(),
      source: "order",
      createdAt,
    };
  }
  if (order.skuId === "subject-pack") {
    return {
      id: uid("ent"),
      userId: order.userId,
      childId: null,
      type: "pack",
      scope: "eng-starter",
      expireAt: null,
      source: "order",
      createdAt,
    };
  }
  return {
    id: uid("ent"),
    userId: order.userId,
    childId: null,
    type: "vip_year",
    scope: null,
    expireAt: new Date(Date.now() + 365 * 86400000).toISOString(),
    source: "order",
    createdAt,
  };
}
