import { Suspense } from "react";
import catalog from "@/content/fixtures/catalog.json";
import { LoadingScreen } from "@/components/loading-screen";
import { PlayRoute } from "@/components/screens/play-route";

export function generateStaticParams() {
  return catalog.levels.map((level) => ({ levelId: level.id }));
}

export default function Page() {
  return (
    <Suspense fallback={<LoadingScreen label="准备这一关…" />}>
      <PlayRoute />
    </Suspense>
  );
}
