"use client";

import { Delete } from "lucide-react";
import { cn } from "@/lib/utils";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"] as const;

export function PinPad({
  value,
  onChange,
  shake = false,
}: {
  value: string;
  onChange: (next: string) => void;
  shake?: boolean;
}) {
  return (
    <div>
      <div className={cn("mb-6 flex justify-center gap-3", shake && "shake")} aria-label="已输入的密码">
        {Array.from({ length: 4 }, (_, index) => (
          <span
            key={index}
            className={cn("size-4 rounded-full", index < value.length ? "bg-primary" : "bg-muted")}
          />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3">
        {KEYS.map((key) => {
          if (!key) return <span key="blank" />;
          const label = key === "del" ? "删除" : key;
          return (
            <button
              key={key}
              type="button"
              className="grid h-16 place-items-center rounded-2xl bg-white text-2xl font-black shadow-sm active:bg-accent"
              aria-label={label}
              onClick={() => {
                if (key === "del") onChange(value.slice(0, -1));
                else if (value.length < 4) onChange(value + key);
              }}
            >
              {key === "del" ? <Delete /> : key}
            </button>
          );
        })}
      </div>
    </div>
  );
}
