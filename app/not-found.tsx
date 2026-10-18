import { BigButton } from "@/components/big-button";

export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center px-6 text-center">
      <div>
        <h1 className="text-2xl font-black">这页走丢了</h1>
        <div className="mt-6">
          <BigButton href="/today">回今日</BigButton>
        </div>
      </div>
    </div>
  );
}
