"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BigButton } from "@/components/big-button";
import { Screen } from "@/components/screen";
import { Input } from "@/components/ui/input";
import { AGE_OPTIONS, type AgeBand } from "@/lib/age";
import { api } from "@/lib/client/api";
import { readStore, saveChild, setPendingAge } from "@/lib/client/store";
import { cn } from "@/lib/utils";

export function AgeScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<AgeBand | null>(null);
  return (
    <Screen className="flex flex-col px-5 pt-16 pb-8">
      <h1 className="text-center text-3xl font-black">宝宝几岁啦？</h1>
      <div className="mt-8 grid gap-3">
        {AGE_OPTIONS.map((option) => (
          <button
            key={option.code}
            type="button"
            aria-pressed={selected === option.code}
            onClick={() => setSelected(option.code)}
            className={cn(
              "h-16 rounded-[24px] bg-white text-xl font-black shadow-sm",
              selected === option.code && "ring-4 ring-primary",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
      <div className="mt-auto">
        <BigButton
          disabled={!selected}
          onClick={() => {
            if (!selected) return;
            setPendingAge(selected);
            router.push("/onboarding/profile");
          }}
        >
          下一步
        </BigButton>
      </div>
    </Screen>
  );
}

export function ProfileScreen() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const ageBand = readStore().pendingAge;

  async function create(name: string) {
    if (!ageBand) {
      router.replace("/onboarding/age");
      return;
    }
    setPending(true);
    setError("");
    try {
      const data = await api<{ child: { id: string; nickname: string; ageBand: AgeBand } }>("/api/children", {
        method: "POST",
        body: JSON.stringify({ nickname: name, ageBand, avatar: "sprout" }),
      });
      saveChild({
        id: data.child.id,
        nickname: data.child.nickname,
        ageBand: data.child.ageBand,
      });
      router.replace("/today");
    } catch {
      setError("网络不太好");
      setPending(false);
    }
  }

  return (
    <Screen className="flex flex-col px-5 pt-16 pb-8">
      <h1 className="text-center text-3xl font-black">给宝宝起个名字</h1>
      <Input
        className="mt-8"
        placeholder="小名"
        maxLength={8}
        value={nickname}
        onChange={(event) => setNickname(event.target.value)}
        aria-label="小名"
      />
      {error ? <p className="mt-3 text-center font-bold text-primary">{error}</p> : null}
      <div className="mt-auto space-y-3">
        <BigButton disabled={!nickname.trim() || pending} onClick={() => void create(nickname.trim())}>
          开始玩
        </BigButton>
        <button
          type="button"
          className="w-full py-2 text-sm font-bold text-muted-foreground"
          disabled={pending}
          onClick={() => void create("宝宝")}
        >
          稍后设置
        </button>
      </div>
    </Screen>
  );
}
