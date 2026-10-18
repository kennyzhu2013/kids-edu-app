import type { CapacitorConfig } from "@capacitor/cli";

// 这套 Web 用了 Route Handlers，不能打成纯静态包。
// 设了 CAPACITOR_SERVER_URL 时，iOS / Android WebView 直接打开正在跑的 Next 站点。
// 没设时，`npx cap sync` 只拷贝 capacitor/www 里的说明页。
const serverUrl = process.env.CAPACITOR_SERVER_URL?.trim();

const config: CapacitorConfig = {
  appId: "com.qimeng.kids",
  appName: "综合启蒙",
  webDir: "capacitor/www",
  backgroundColor: "#fff8ef",
  server: {
    androidScheme: "https",
    ...(serverUrl
      ? {
          url: serverUrl,
          cleartext: serverUrl.startsWith("http://"),
        }
      : {}),
  },
};

export default config;
