import { OfflineCloud } from "@/components/illustrations";
import { Button } from "@/components/ui/button";

export function OfflineState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="grid min-h-dvh place-items-center px-6 py-16 text-center">
      <div className="flex flex-col items-center">
        <OfflineCloud />
        <h1 className="mt-4 text-2xl font-black">网络不太好</h1>
        <Button className="mt-6 w-40" type="button" onClick={onRetry}>
          重试
        </Button>
      </div>
    </div>
  );
}
