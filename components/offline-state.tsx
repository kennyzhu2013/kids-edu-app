import { OfflineCloud } from "@/components/illustrations";
import { BigButton } from "@/components/big-button";
import { Screen } from "@/components/screen";
import type { FailureKind } from "@/lib/client/api";

const COPY: Record<FailureKind, { title: string; body: string }> = {
  offline: {
    title: "网络不太好",
    body: "先检查一下网络，再点重试。已经打开的页面可以先留着。",
  },
  error: {
    title: "这一页没打开",
    body: "服务器暂时没回应。过一会儿再试一次。",
  },
  missing: {
    title: "找不到内容",
    body: "这一页可能还没放上来，或者链接写错了。",
  },
};

export function OfflineState({
  onRetry,
  tabs = false,
  kind = "offline",
  title,
  body,
  backHref,
  backLabel = "返回",
}: {
  onRetry?: () => void;
  tabs?: boolean;
  kind?: FailureKind;
  title?: string;
  body?: string;
  backHref?: string;
  backLabel?: string;
}) {
  const copy = COPY[kind];
  return (
    <Screen tabs={tabs} className="grid place-items-center px-6 py-16 text-center">
      <div className="flex w-full max-w-sm flex-col items-center">
        <OfflineCloud />
        <h1 className="mt-4 text-2xl font-black">{title ?? copy.title}</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{body ?? copy.body}</p>
        <div className="mt-6 grid w-full gap-3">
          {onRetry ? <BigButton onClick={onRetry}>重试</BigButton> : null}
          {backHref ? (
            <BigButton variant="outline" href={backHref}>
              {backLabel}
            </BigButton>
          ) : null}
        </div>
      </div>
    </Screen>
  );
}
