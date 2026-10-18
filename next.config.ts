import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  allowedDevOrigins: ["127.0.0.1"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async rewrites() {
    return [
      { source: "/auth/:path*", destination: "/api/auth/:path*" },
      { source: "/me", destination: "/api/me" },
      { source: "/children", destination: "/api/children" },
      { source: "/children/:path*", destination: "/api/children/:path*" },
      { source: "/progress/:path*", destination: "/api/progress/:path*" },
      { source: "/subjects", destination: "/api/subjects" },
      { source: "/packs", destination: "/api/packs" },
      { source: "/packs/:path*", destination: "/api/packs/:path*" },
      { source: "/levels/:path*", destination: "/api/levels/:path*" },
      { source: "/unlock/:path*", destination: "/api/unlock/:path*" },
      { source: "/entitlements", destination: "/api/entitlements" },
      { source: "/orders", destination: "/api/orders" },
      { source: "/orders/:path*", destination: "/api/orders/:path*" },
      { source: "/parent-lock", destination: "/api/parent-lock" },
      { source: "/parent-lock/:path*", destination: "/api/parent-lock/:path*" },
      { source: "/admin/:path*", destination: "/api/admin/:path*" },
    ];
  },
};

export default nextConfig;
