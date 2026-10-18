import catalog from "@/content/fixtures/catalog.json";
import { GameScreen } from "@/components/screens/game-screens";

export function generateStaticParams() {
  return catalog.games.map((game) => ({ gameId: game.gameId }));
}

export default function Page() {
  return <GameScreen />;
}
