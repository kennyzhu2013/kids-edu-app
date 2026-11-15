"use client";

import { Mic, Volume2 } from "lucide-react";
import { useState } from "react";
import { TokenArt } from "@/components/illustrations";
import { BigButton } from "@/components/big-button";
import { canListen, listenForSpeech } from "@/lib/client/listen-mic";
import { playCue, playPrompt, voiceCaption, voiceLang } from "@/lib/client/speech";
import { speechMatches } from "@/lib/client/speech-match";
import type { LevelDocument } from "@/lib/content/schemas";
import { cn } from "@/lib/utils";

type Step = LevelDocument["steps"][number];

function promptLine(step: Step) {
  return step.promptSpeak || step.speakText || step.promptText || "";
}

export function SpeakBoard({
  step,
  busy,
  hinted,
  onPass,
  onMiss,
}: {
  step: Step;
  busy: boolean;
  hinted: boolean;
  onPass: () => void;
  onMiss: () => void;
}) {
  const [listening, setListening] = useState(false);
  const [note, setNote] = useState("");
  const [blocked, setBlocked] = useState(!canListen());
  const expected = step.speakText || step.promptSpeak || "";

  function playModel() {
    const result = playPrompt(step.promptAudio, promptLine(step));
    setNote(voiceCaption(result));
  }

  async function hear() {
    if (busy || listening) return;
    playModel();
    setListening(true);
    setNote("正在听…");
    const result = await listenForSpeech(voiceLang(expected));
    setListening(false);
    if (!result.ok) {
      if (result.reason === "denied" || result.reason === "unavailable") {
        setBlocked(true);
        setNote(result.reason === "denied" ? "麦克风没有打开。可以点「我说完了」。" : "这台设备听不了。可以点「我说完了」。");
      } else {
        setNote("没听清，再试一次。");
        onMiss();
      }
      return;
    }
    if (speechMatches(result.text, expected)) {
      playCue("ok");
      setNote("真棒");
      onPass();
      return;
    }
    playCue("again");
    setNote("再试一次");
    onMiss();
  }

  return (
    <div className="flex flex-1 flex-col">
      <button type="button" className="mx-auto mt-5 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 font-black shadow-sm" onClick={playModel}>
        <Volume2 className="size-5 text-primary" />
        再听一遍
      </button>
      <p className="mt-3 text-center font-bold">{step.promptText}</p>
      {hinted ? <p className="mt-4 text-center text-3xl font-black text-primary">{expected}</p> : null}
      <button
        type="button"
        aria-label="跟读"
        disabled={busy || listening || blocked}
        onClick={() => void hear()}
        className={cn(
          "mx-auto mt-6 grid size-28 place-items-center rounded-full bg-primary text-white shadow-md",
          listening && "speaker-live",
          blocked && "opacity-40",
        )}
      >
        <Mic className="size-12" />
      </button>
      <p className="mt-3 text-center text-sm font-bold text-muted-foreground">{listening ? "正在听…" : "点麦克风，跟读这一句"}</p>
      <p className="mt-2 h-7 text-center text-lg font-black text-primary" role="status">
        {note}
      </p>
      {blocked ? (
        <div className="mt-auto pt-6">
          <BigButton disabled={busy} onClick={onPass}>
            我说完了
          </BigButton>
        </div>
      ) : null}
    </div>
  );
}

export function DragBoard({
  step,
  busy,
  hinted,
  onPass,
  onMiss,
}: {
  step: Step;
  busy: boolean;
  hinted: boolean;
  onPass: () => void;
  onMiss: () => void;
}) {
  const baskets = step.baskets ?? [];
  const [placed, setPlaced] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const remaining = (step.choices ?? []).filter((choice) => !placed[choice.id]);

  function drop(choiceId: string, basketId: string) {
    if (busy) return;
    const choice = step.choices?.find((item) => item.id === choiceId);
    if (!choice) return;
    if (choice.basket !== basketId) {
      playCue("again");
      setNote("再试一次");
      setSelected(choiceId);
      onMiss();
      return;
    }
    const next = { ...placed, [choiceId]: basketId };
    setPlaced(next);
    setSelected(null);
    playCue("ok");
    setNote("真棒");
    if ((step.choices ?? []).every((item) => next[item.id])) onPass();
  }

  return (
    <div className="flex flex-1 flex-col">
      <p className="mt-4 text-center font-bold">{step.promptText}</p>
      <p className="mt-2 h-7 text-center text-lg font-black text-primary" role="status">
        {note}
      </p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {baskets.map((basket) => (
          <button
            key={basket.id}
            type="button"
            data-basket={basket.id}
            aria-label={basket.label}
            onClick={() => selected && drop(selected, basket.id)}
            className={cn(
              "min-h-28 rounded-[22px] bg-white p-2 text-center shadow-sm",
              hinted && selected && step.choices?.find((item) => item.id === selected)?.basket === basket.id && "ring-4 ring-sun",
            )}
          >
            {basket.visual ? <TokenArt token={basket.visual} className="mx-auto size-12" /> : null}
            <span className="mt-1 block font-black">{basket.label}</span>
            <span className="mt-1 block text-xs text-muted-foreground">
              {(step.choices ?? [])
                .filter((item) => placed[item.id] === basket.id)
                .map((item) => item.label)
                .join(" ")}
            </span>
          </button>
        ))}
      </div>
      <div className="mt-auto grid grid-cols-2 gap-2 pt-4">
        {remaining.map((choice) => (
          <button
            key={choice.id}
            type="button"
            aria-label={choice.label}
            onPointerUp={(event) => {
              const hit = document.elementFromPoint(event.clientX, event.clientY)?.closest("[data-basket]");
              const basketId = hit?.getAttribute("data-basket");
              if (basketId) drop(choice.id, basketId);
            }}
            onClick={() => setSelected(choice.id)}
            className={cn(
              "flex items-center gap-2 rounded-[18px] bg-white p-2 text-left shadow-sm",
              selected === choice.id && "ring-4 ring-primary",
            )}
          >
            {choice.visual ? <TokenArt token={choice.visual} className="size-10" /> : null}
            <span className="font-black">{choice.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function SortBoard({
  step,
  busy,
  hinted,
  onPass,
  onMiss,
}: {
  step: Step;
  busy: boolean;
  hinted: boolean;
  onPass: () => void;
  onMiss: () => void;
}) {
  const order = Array.isArray(step.answer) ? step.answer : [];
  const [pool, setPool] = useState(() => shuffle(step.choices ?? []));
  const [placed, setPlaced] = useState<Array<NonNullable<Step["choices"]>[number] | null>>(() => order.map(() => null));
  const [note, setNote] = useState("");

  function place(choice: NonNullable<Step["choices"]>[number], index?: number) {
    if (busy) return;
    const slot = index ?? placed.findIndex((item) => !item);
    if (slot < 0 || placed[slot]) return;
    const next = placed.slice();
    next[slot] = choice;
    setPool(pool.filter((item) => item.id !== choice.id));
    setPlaced(next);
    if (next.some((item) => !item)) return;
    const correct = next.every((item, itemIndex) => item?.id === order[itemIndex]);
    if (!correct) {
      playCue("again");
      setNote("再试一次");
      setPool(shuffle(step.choices ?? []));
      setPlaced(order.map(() => null));
      onMiss();
      return;
    }
    playCue("ok");
    setNote("真棒");
    onPass();
  }

  return (
    <div className="flex flex-1 flex-col">
      <p className="mt-4 text-center font-bold">{step.promptText}</p>
      <ol className="mt-3 grid gap-2">
        {placed.map((choice, index) => (
          <li key={order[index] ?? index} data-slot={index} className="flex h-14 items-center gap-3 rounded-[18px] bg-white px-3 shadow-sm">
            <span className="grid size-8 place-items-center rounded-full bg-accent font-black">{index + 1}</span>
            {choice ? (
              <>
                {choice.visual ? <TokenArt token={choice.visual} className="size-10" /> : null}
                <span className="font-black">{choice.label}</span>
              </>
            ) : (
              <span className="text-sm text-muted-foreground">{hinted ? orderLabel(step, order[index]) : "点下面的卡片"}</span>
            )}
          </li>
        ))}
      </ol>
      <p className="mt-3 h-7 text-center text-lg font-black text-primary" role="status">
        {note}
      </p>
      <div className="mt-auto grid grid-cols-2 gap-2">
        {pool.map((choice) => (
          <button
            key={choice.id}
            type="button"
            aria-label={choice.label}
            onPointerUp={(event) => {
              const hit = document.elementFromPoint(event.clientX, event.clientY)?.closest("[data-slot]");
              const index = hit ? Number(hit.getAttribute("data-slot")) : Number.NaN;
              if (Number.isInteger(index)) place(choice, index);
            }}
            onClick={() => place(choice)}
            className="flex items-center gap-2 rounded-[18px] bg-white p-2 text-left shadow-sm"
          >
            {choice.visual ? <TokenArt token={choice.visual} className="size-10" /> : null}
            <span className="font-black">{choice.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function orderLabel(step: Step, id: string | undefined) {
  return step.choices?.find((choice) => choice.id === id)?.label ?? "";
}

function shuffle<T extends { id: string }>(items: T[]) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = (index * 3 + 1) % (index + 1);
    const current = copy[index];
    copy[index] = copy[swap] as T;
    copy[swap] = current as T;
  }
  if (copy.every((item, index) => item.id === items[index]?.id) && copy.length > 1) {
    const first = copy[0];
    copy[0] = copy[1] as T;
    copy[1] = first as T;
  }
  return copy;
}
