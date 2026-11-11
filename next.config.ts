import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  serverExternalPackages: ["baileys"],
  output: process.env.NEXT_OUTPUT === "standalone" ? "standalone" : undefined,
  images: {
    localPatterns: [{ pathname: "/foto/**" }, { pathname: "/template/assets/**", search: "" }, { pathname: "/brand/logolim.png", search: "" }],
    formats: ["image/webp"],
    minimumCacheTTL: 2592000,
  },
  async redirects() {
    return [
      { source: "/u/:slug/:token/:path*", destination: "/:token/:path*", permanent: true },
      { source: "/:slug([a-z0-9-]+)/:token([A-Za-z0-9_-]{16})/:path*", destination: "/:token/:path*", permanent: true },
      ...["isi", "tamu", "ringkasan", "kirim", "ucapan", "checkin", "template"].map((section) => ({
        source: `/undangan/${section}/:path*`, destination: "/undangan", permanent: false,
      })),
    ];
  },
  async headers() {
    const noindex = { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" };
    return [
      {
        source: "/:token([A-Za-z0-9_-]{8}|[A-Za-z0-9_-]{16})/:path*",
        headers: [noindex, { key: "Referrer-Policy", value: "no-referrer" }],
      },
      { source: "/petugas/:path*", headers: [noindex, { key: "Referrer-Policy", value: "no-referrer" }] },
      { source: "/foto/:path*", headers: [noindex] },
      { source: "/musik/:path*", headers: [noindex] },
      { source: "/og/:path*", headers: [noindex] },
      { source: "/undangan/:path*", headers: [noindex] },
      { source: "/pratinjau/:path*", headers: [noindex] },
      { source: "/contoh/:path*", headers: [noindex] },
      { source: "/admin/:path*", headers: [noindex] },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
