import { LogoMark } from "@/components/illustrations";
import { BigButton } from "@/components/big-button";

export function EmptyPanel({
  title,
  body,
  titleAs = "h2",
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
}: {
  title: string;
  body: string;
  titleAs?: "h1" | "h2";
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}) {
  const Title = titleAs;
  return (
    <div className="px-5 py-10 text-center">
      <LogoMark className="mx-auto" />
      <Title className="mt-6 text-2xl font-black">{title}</Title>
      <p className="mt-2 leading-6 text-muted-foreground">{body}</p>
      {primaryHref && primaryLabel ? (
        <div className="mt-8 grid gap-3">
          <BigButton href={primaryHref}>{primaryLabel}</BigButton>
          {secondaryHref && secondaryLabel ? (
            <BigButton href={secondaryHref} variant="secondary">
              {secondaryLabel}
            </BigButton>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
