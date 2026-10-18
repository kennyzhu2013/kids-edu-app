import type { Metadata, Viewport } from "next";
import { Noto_Sans_SC, Nunito } from "next/font/google";
import { Suspense } from "react";
import { LoadingScreen } from "@/components/loading-screen";
import { NativeShell } from "@/components/native-shell";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin"],
  weight: "700",
  variable: "--font-nunito",
  display: "swap",
});

const noto = Noto_Sans_SC({
  subsets: ["latin"],
  weight: "700",
  variable: "--font-noto",
  display: "swap",
});

export const metadata: Metadata = {
  title: "综合启蒙",
  description: "3–6 岁中英启蒙。听一听，点一点。",
};

export const viewport: Viewport = {
  themeColor: "#fff8ef",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className={`${nunito.variable} ${noto.variable} h-full antialiased`}>
      <body className="min-h-dvh">
        <div className="mx-auto min-h-dvh w-full max-w-[430px] bg-background pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)] pl-[env(safe-area-inset-left)] md:shadow-[0_0_0_1px_#f0dcc8]">
          <NativeShell />
          <Suspense fallback={<LoadingScreen />}>{children}</Suspense>
        </div>
      </body>
    </html>
  );
}
