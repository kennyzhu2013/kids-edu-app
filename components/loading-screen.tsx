export function LoadingScreen({ label = "加载中…" }: { label?: string }) {
  return (
    <div className="grid min-h-dvh place-items-center px-6 text-center">
      <p className="text-lg font-black text-muted-foreground">{label}</p>
    </div>
  );
}
