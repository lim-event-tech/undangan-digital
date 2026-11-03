import type { MetadataRoute } from "next";

const PRIBADI = ["/undangan", "/admin", "/api", "/pratinjau", "/petugas", "/masuk", "/daftar", "/foto", "/musik", "/contoh"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: ["facebookexternalhit", "WhatsApp", "Twitterbot", "TelegramBot", "LinkedInBot"],
        allow: ["/"],
        disallow: PRIBADI,
      },
      { userAgent: "*", disallow: "/" },
    ],
  };
}
