import { EmptyPanel } from "@/components/empty-panel";

export function EmptyToday() {
  return (
    <EmptyPanel
      titleAs="h1"
      title="今天任务稍后就来"
      body="今天的四科任务还没排好。可以先去课程馆看看，或者玩一局游戏。"
      primaryHref="/courses"
      primaryLabel="去课程馆"
      secondaryHref="/games"
      secondaryLabel="去游戏乐园"
    />
  );
}
