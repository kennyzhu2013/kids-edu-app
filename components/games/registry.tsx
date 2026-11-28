"use client";

import type { ReactNode } from "react";
import { ColorMatch } from "@/components/color-match";
import { CountDash } from "@/components/games/count-dash";
import { HabitOrder } from "@/components/games/habit-order";
import type { GameResult } from "@/components/games/plugin";
import { ShapeFit } from "@/components/games/shape-fit";
import { SpotAnimal } from "@/components/games/spot-animal";
import type { GameDocument } from "@/lib/content/schemas";

export type GameViewProps = {
  game: GameDocument;
  remaining: string;
  onPlay: () => void;
  onEnd: (result: GameResult) => void;
  onExit: () => void;
};

type GameView = (props: GameViewProps) => ReactNode;

function mount<K extends GameDocument["kind"]>(
  kind: K,
  View: (props: Omit<GameViewProps, "game"> & { game: Extract<GameDocument, { kind: K }> }) => ReactNode,
): GameView {
  return function Mounted(props) {
    if (props.game.kind !== kind) return null;
    const game = props.game as Extract<GameDocument, { kind: K }>;
    return <View {...props} game={game} />;
  };
}

export const GAME_VIEWS: Record<GameDocument["kind"], GameView> = {
  "color-match": mount("color-match", ColorMatch),
  "spot-animal": mount("spot-animal", SpotAnimal),
  "count-dash": mount("count-dash", CountDash),
  "shape-fit": mount("shape-fit", ShapeFit),
  "habit-order": mount("habit-order", HabitOrder),
};
