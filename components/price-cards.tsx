"use client";

import { SKUS } from "@/lib/billing/skus";
import { cn } from "@/lib/utils";

export function PriceCards({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="grid gap-3">
      {SKUS.map((sku) => {
        const active = selected === sku.id;
        return (
          <button
            key={sku.id}
            type="button"
            onClick={() => onSelect(sku.id)}
            className={cn(
              "relative rounded-[24px] border-2 bg-white p-4 text-left",
              active ? "border-primary" : "border-transparent shadow-sm",
            )}
            aria-pressed={active}
          >
            {sku.best ? (
              <span className="absolute top-3 right-3 rounded-full bg-sun px-2 py-1 text-xs font-black">
                最划算
              </span>
            ) : null}
            <p className="text-sm font-bold text-muted-foreground">{sku.subtitle}</p>
            <div className="mt-1 flex items-end justify-between gap-3">
              <h2 className="text-xl font-black">{sku.title}</h2>
              <p className="text-2xl font-black text-primary">{sku.priceLabel}</p>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {sku.period} · {sku.perk}
            </p>
          </button>
        );
      })}
    </div>
  );
}
