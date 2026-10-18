"use client";

import { ChevronRight, Shield } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { BackLink, Screen } from "@/components/screen";
import { BigButton } from "@/components/big-button";
import { LoadingScreen } from "@/components/loading-screen";
import { OfflineState } from "@/components/offline-state";
import { PinPad } from "@/components/pin-pad";
import { PriceCards } from "@/components/price-cards";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ageLabel } from "@/lib/age";
import { SKUS } from "@/lib/billing/skus";
import { ApiError, api } from "@/lib/client/api";
import {
  clearLocalProfile,
  parentSessionToken,
  readChild,
  readStore,
  saveChild,
  saveEntitlementFlags,
  saveParentSession,
  saveToken,
  setSound,
  useChild,
  useParentUnlocked,
  useSoundPreference,
} from "@/lib/client/store";
import { alignChildSession } from "@/lib/client/session";

function Row({ href, title, hint }: { href: string; title: string; hint?: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 rounded-[22px] bg-white px-4 py-4 shadow-sm">
      <span className="flex-1">
        <span className="block font-black">{title}</span>
        {hint ? <span className="text-sm text-muted-foreground">{hint}</span> : null}
      </span>
      <ChevronRight className="text-muted-foreground" />
    </Link>
  );
}

export function MineScreen() {
  const router = useRouter();
  const child = useChild();
  const [phone, setPhone] = useState<string | null>(null);
  const [children, setChildren] = useState<Array<{ id: string; nickname: string; ageBand: "A" | "B" | "C" }>>([]);
  const [open, setOpen] = useState(false);
  const [switchError, setSwitchError] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!readChild()) router.replace("/onboarding/age");
    }, 0);
    return () => window.clearTimeout(timer);
  }, [child, router]);

  useEffect(() => {
    if (!child) return;
    let ignore = false;
    alignChildSession()
      .catch(() => undefined)
      .then(() => {
        if (ignore) return;
        api<{ user: { phone: string | null } }>("/api/me")
          .then((data) => {
            if (!ignore) setPhone(data.user.phone);
          })
          .catch(() => {
            if (!ignore) setPhone(null);
          });
        api<{ children: Array<{ id: string; nickname: string; ageBand: "A" | "B" | "C" }> }>("/api/children")
          .then((data) => {
            if (!ignore) setChildren(data.children);
          })
          .catch(() => undefined);
      });
    return () => {
      ignore = true;
    };
  }, [child]);

  if (!child) return <LoadingScreen />;

  return (
    <Screen tabs>
      <div className="px-5 pt-8">
        <h1 className="text-3xl font-black">我的</h1>
        <div className="mt-5 flex items-center gap-3 rounded-[28px] bg-white p-4 shadow-sm">
          <span className="grid size-14 place-items-center rounded-full bg-accent text-xl font-black text-primary">
            {child.nickname.slice(0, 1)}
          </span>
          <div className="flex-1">
            <p className="text-xl font-black">{child.nickname}</p>
            <p className="text-sm text-muted-foreground">{ageLabel(child.ageBand)}</p>
          </div>
          <button type="button" className="font-black text-primary" onClick={() => setOpen(true)}>
            切换
          </button>
        </div>
        <div className="mt-4 grid gap-3">
          <Row href="/report" title="学习报告" />
          <Row href="/membership" title="会员与内购" hint={phone ? `已登录 ${phone}` : "未绑定手机"} />
          <Row href="/lock?next=/parent" title="家长中心" hint="需要家长密码" />
          <Row href="/settings" title="设置" />
        </div>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogTitle>切换孩子</DialogTitle>
          <DialogDescription>选择已有档案，或再建立一个。</DialogDescription>
          <div className="mt-4 grid gap-2">
            {children.map((item) => {
              const current = item.id === child.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`rounded-2xl px-4 py-3 text-left font-black ${current ? "bg-accent ring-2 ring-primary" : "bg-muted"}`}
                  onClick={() => {
                    if (current) {
                      setOpen(false);
                      return;
                    }
                    const next = { id: item.id, nickname: item.nickname, ageBand: item.ageBand };
                    setSwitchError("");
                    void api(`/api/children/${item.id}/switch`, { method: "POST" })
                      .then(() => {
                        saveChild(next);
                        setOpen(false);
                      })
                      .catch((error: unknown) => {
                        setSwitchError(error instanceof ApiError ? error.message : "切换失败，请再试一次");
                      });
                  }}
                >
                  {item.nickname} · {ageLabel(item.ageBand)}
                  {current ? " · 当前" : ""}
                </button>
              );
            })}
            {switchError ? <p className="text-sm font-bold text-primary">{switchError}</p> : null}
            <BigButton href="/onboarding/age">新建</BigButton>
          </div>
        </DialogContent>
      </Dialog>
    </Screen>
  );
}

export function LoginScreen() {
  const router = useRouter();
  const [phone, setPhone] = useState("13800138000");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("短信尚未接入。演示验证码是 000000。");
  const [pending, setPending] = useState(false);

  function finishLogin(token: string) {
    saveToken(token);
    void alignChildSession()
      .catch(() => undefined)
      .finally(() => router.replace("/mine"));
  }

  return (
    <Screen className="px-5 pt-4 pb-8">
      <BackLink href="/mine" />
      <h1 className="mt-6 text-3xl font-black">家长登录</h1>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{message}</p>
      <label className="mt-6 block text-sm font-bold" htmlFor="phone">
        手机号
      </label>
      <Input id="phone" className="mt-2" inputMode="numeric" value={phone} onChange={(event) => setPhone(event.target.value)} />
      <BigButton
        className="mt-4"
        variant="secondary"
        disabled={pending}
        onClick={() => {
          setPending(true);
          void api<{ cooldownSec: number }>("/api/auth/sms/send", {
            method: "POST",
            body: JSON.stringify({ phone }),
          })
            .then(() => setMessage("验证码已记下（桩）。请填写 000000。"))
            .catch((error: unknown) => setMessage(error instanceof ApiError ? error.message : "发送失败"))
            .finally(() => setPending(false));
        }}
      >
        获取验证码
      </BigButton>
      <label className="mt-4 block text-sm font-bold" htmlFor="code">
        验证码
      </label>
      <Input id="code" className="mt-2" inputMode="numeric" value={code} onChange={(event) => setCode(event.target.value)} placeholder="000000" />
      <div className="mt-4 grid gap-3">
        <BigButton
          disabled={pending}
          onClick={() => {
            setPending(true);
            void api<{ token: string }>("/api/auth/sms/login", {
              method: "POST",
              body: JSON.stringify({ phone, code }),
            })
              .then((data) => {
                finishLogin(data.token);
              })
              .catch((error: unknown) => {
                setMessage(error instanceof ApiError ? error.message : "登录失败");
                setPending(false);
              });
          }}
        >
          登录
        </BigButton>
        <BigButton
          variant="outline"
          onClick={() => {
            void api<{ token?: string; message?: string }>("/api/auth/wechat", {
              method: "POST",
              body: JSON.stringify({ code: "stub" }),
            })
              .then((data) => {
                setMessage(data.message ?? "微信登录尚未接入");
                if (data.token) finishLogin(data.token);
              })
              .catch((error: unknown) => setMessage(error instanceof ApiError ? error.message : "微信登录失败"));
          }}
        >
          微信登录（未接入）
        </BigButton>
      </div>
    </Screen>
  );
}

export function SettingsScreen() {
  const router = useRouter();
  const sound = useSoundPreference();
  return (
    <Screen className="px-5 pt-4 pb-8">
      <BackLink href="/mine" />
      <h1 className="mt-6 text-3xl font-black">设置</h1>
      <button
        type="button"
        className="mt-6 flex w-full items-center justify-between rounded-[22px] bg-white px-4 py-4 font-black shadow-sm"
        onClick={() => setSound(!sound)}
      >
        朗读
        <span className="text-primary">{sound ? "开" : "关"}</span>
      </button>
      <div className="mt-3 grid gap-3">
        <Row href="/login" title="手机号登录" hint="短信为桩" />
        <Row href="/offline" title="网络不太好" hint="预览断网页" />
        <Row href="/preview/empty" title="今天任务稍后就来" hint="预览空状态" />
      </div>
      <p className="mt-6 text-sm leading-6 text-muted-foreground">
        隐私政策与儿童个人信息规则还没定稿。正式上线前需要勾选同意、可撤回授权。
      </p>
      <div className="mt-6">
        <BigButton
          variant="outline"
          onClick={() => {
            clearLocalProfile();
            router.replace("/");
          }}
        >
          清除本机档案
        </BigButton>
      </div>
    </Screen>
  );
}

type ReportPayload = {
  nickname?: string;
  minutes: number;
  completedLevels: number;
  suggestion: string;
  subjects?: Array<{ id: string; name: string; completed: number }>;
};

export function ReportScreen() {
  const router = useRouter();
  const [failedChildId, setFailedChildId] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [data, setData] = useState<(ReportPayload & { childId: string }) | null>(null);
  const child = useChild();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!readChild()) router.replace("/onboarding/age");
    }, 0);
    return () => window.clearTimeout(timer);
  }, [child, router]);

  useEffect(() => {
    if (!child) return;
    const childId = child.id;
    let ignore = false;
    api<ReportPayload>(`/api/progress/summary?childId=${encodeURIComponent(childId)}`)
      .then((payload) => {
        if (!ignore) setData({ ...payload, childId });
      })
      .catch(() => {
        if (!ignore) setFailedChildId(childId);
      });
    return () => {
      ignore = true;
    };
  }, [attempt, child]);

  if (!child) return <LoadingScreen />;

  const failed = failedChildId === child.id;
  const report = data?.childId === child.id ? data : null;

  if (failed) {
    return (
      <OfflineState
        onRetry={() => {
          setFailedChildId(null);
          setAttempt((value) => value + 1);
        }}
      />
    );
  }
  const name = report?.nickname || child.nickname;
  return (
    <Screen className="px-5 pt-4 pb-8">
      <BackLink href="/mine" />
      <h1 className="mt-6 text-3xl font-black">学习报告</h1>
      <p className="mt-2 text-sm font-bold text-muted-foreground">{name} · 本周</p>
      {!report ? (
        <p className="mt-8 font-bold text-muted-foreground">加载中…</p>
      ) : (
        <div className="mt-6 grid gap-3">
          <article className="rounded-[24px] bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-muted-foreground">学习时长</p>
            <p className="mt-1 text-3xl font-black">本周学了 {report.minutes} 分钟</p>
          </article>
          <article className="rounded-[24px] bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-muted-foreground">完成关卡</p>
            <p className="mt-1 text-3xl font-black">完成 {report.completedLevels} 关</p>
            {report.subjects && report.subjects.length > 0 ? (
              <p className="mt-2 text-sm font-bold text-muted-foreground">
                {report.subjects.map((item) => `${item.name} ${item.completed}`).join(" · ")}
              </p>
            ) : null}
          </article>
          <article className="rounded-[24px] bg-[#fff3da] p-5">
            <p className="text-xl font-black leading-8">{report.suggestion}</p>
          </article>
          {report.completedLevels === 0 ? (
            <p className="text-sm leading-6 text-muted-foreground">玩完今日的一关，分钟和关数会记在这里。</p>
          ) : null}
        </div>
      )}
    </Screen>
  );
}

function safeInternalPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("://")) return "/mine";
  return value;
}

export function MembershipScreen() {
  const search = useSearchParams();
  const backHref = safeInternalPath(search.get("from"));
  const [selected, setSelected] = useState<string>(SKUS[2].id);
  const [message, setMessage] = useState("价格是示意。微信支付和 Apple 内购都还没接。");
  const [pending, setPending] = useState(false);
  const [restoreOpen, setRestoreOpen] = useState(false);

  return (
    <Screen className="px-5 pt-4 pb-8">
      <BackLink href={backHref} />
      <h1 className="mt-6 text-3xl font-black">会员</h1>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{message}</p>
      <div className="mt-5">
        <PriceCards selected={selected} onSelect={setSelected} />
      </div>
      <div className="mt-5 grid gap-3">
        <BigButton
          disabled={pending}
          onClick={() => {
            setPending(true);
            void api<{ orderId: string }>("/api/orders", {
              method: "POST",
              body: JSON.stringify({ skuId: selected, channel: "stub" }),
            })
              .then((order) =>
                api("/api/orders/" + order.orderId + "/confirm", {
                  method: "POST",
                  body: JSON.stringify({ stubPaid: true }),
                }),
              )
              .then(() => {
                const vip = selected === "all-year";
                const noAds = vip || selected === "no-ads-month";
                saveEntitlementFlags({ vip: readStore().vip || vip, noAds: readStore().noAds || noAds });
                setMessage(vip ? "已模拟开通全科会员。" : noAds ? "已模拟开通去广告。" : "已模拟记下单科包。");
              })
              .catch((error: unknown) => setMessage(error instanceof ApiError ? error.message : "下单失败"))
              .finally(() => setPending(false));
          }}
        >
          立即开通
        </BigButton>
        <button type="button" className="py-2 text-sm font-bold text-muted-foreground" onClick={() => setRestoreOpen(true)}>
          恢复购买
        </button>
      </div>
      <Dialog open={restoreOpen} onOpenChange={setRestoreOpen}>
        <DialogContent>
          <DialogTitle>恢复购买</DialogTitle>
          <DialogDescription>商店恢复购买还没接。TODO: Apple IAP 与微信支付查单。</DialogDescription>
        </DialogContent>
      </Dialog>
    </Screen>
  );
}

export function LockScreen() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") || "/parent";
  const [pin, setPin] = useState("");
  const [message, setMessage] = useState("");
  const [shake, setShake] = useState(false);
  const [forgot, setForgot] = useState(false);

  useEffect(() => {
    if (pin.length < 4) return;
    let ignore = false;
    api<{ token: string; ttlSec: number }>("/api/parent-lock/verify", {
      method: "POST",
      body: JSON.stringify({ pin }),
    })
      .then((data) => {
        if (ignore) return;
        saveParentSession(data.token, data.ttlSec);
        router.replace(next);
      })
      .catch((error: unknown) => {
        if (ignore) return;
        setShake(true);
        setPin("");
        setMessage(error instanceof ApiError ? error.message : "密码不对");
        window.setTimeout(() => setShake(false), 400);
      });
    return () => {
      ignore = true;
    };
  }, [next, pin, router]);

  return (
    <Screen className="px-5 pt-4 pb-8">
      <BackLink href="/mine" />
      <div className="mt-8 flex items-center justify-center gap-2">
        <Shield className="text-primary" />
        <h1 className="text-2xl font-black">请输入家长密码</h1>
      </div>
      <p className="mt-3 text-center text-sm text-muted-foreground">演示密码 2580。正式环境会改成哈希校验。</p>
      {message ? <p className="mt-3 text-center font-bold text-primary">{message}</p> : null}
      <div className="mt-6">
        <PinPad value={pin} shake={shake} onChange={setPin} />
      </div>
      <button type="button" className="mt-4 w-full text-sm font-bold text-muted-foreground" onClick={() => setForgot(true)}>
        忘记密码
      </button>
      <Dialog open={forgot} onOpenChange={setForgot}>
        <DialogContent>
          <DialogTitle>忘记密码</DialogTitle>
          <DialogDescription>客服重置还没做。这台演示机的密码是 2580。</DialogDescription>
        </DialogContent>
      </Dialog>
    </Screen>
  );
}

export function ParentScreen() {
  const router = useRouter();
  const unlocked = useParentUnlocked();
  const [orders, setOrders] = useState<Array<{ id: string; skuId: string; status: string; amount: number }>>([]);
  const [phone, setPhone] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!parentSessionToken()) router.replace("/lock?next=/parent");
    }, 0);
    return () => window.clearTimeout(timer);
  }, [router, unlocked]);

  useEffect(() => {
    if (!unlocked) return;
    let ignore = false;
    api<{ orders: Array<{ id: string; skuId: string; status: string; amount: number }> }>("/api/orders")
      .then((data) => {
        if (!ignore) setOrders(data.orders);
      })
      .catch(() => undefined);
    api<{ user: { phone: string | null } }>("/api/me")
      .then((data) => {
        if (!ignore) setPhone(data.user.phone);
      })
      .catch(() => undefined);
    return () => {
      ignore = true;
    };
  }, [unlocked]);

  if (!unlocked) return <LoadingScreen />;
  return (
    <Screen className="px-5 pt-4 pb-8">
      <BackLink href="/mine" />
      <h1 className="mt-6 text-3xl font-black">家长中心</h1>
      <section className="mt-5 rounded-[24px] bg-white p-4 shadow-sm">
        <h2 className="font-black">账号</h2>
        <p className="mt-1 text-sm text-muted-foreground">{phone ? phone : "还没有绑定手机号"}</p>
        <Link href="/login" className="mt-2 inline-block text-sm font-black text-primary">
          去登录
        </Link>
      </section>
      <section className="mt-3 rounded-[24px] bg-white p-4 shadow-sm">
        <h2 className="font-black">订单</h2>
        {orders.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">还没有订单</p>
        ) : (
          <ul className="mt-2 grid gap-2">
            {orders.map((order) => (
              <li key={order.id} className="text-sm font-bold">
                {order.skuId} · ¥{order.amount / 100} · {order.status === "paid" ? "已支付（桩）" : "待支付"}
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="mt-3 rounded-[24px] bg-white p-4 shadow-sm">
        <h2 className="font-black">通知</h2>
        <p className="mt-2 text-sm text-muted-foreground">推送还没接。这里会放学习提醒。</p>
      </section>
      <section className="mt-3 rounded-[24px] bg-white p-4 shadow-sm">
        <h2 className="font-black">隐私与注销</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          注销账号、撤回授权和日志脱敏都还是待办。清除本机档案只删这台浏览器里的演示数据。
        </p>
      </section>
    </Screen>
  );
}
