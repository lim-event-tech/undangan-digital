import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LIM-RSVP - Lingkar IDE Manajemen",
    short_name: "LIM-RSVP",
    description: "Sistem undangan acara digital dan manajemen RSVP oleh Lingkar IDE Manajemen.",
    start_url: "/",
    display: "standalone",
    background_color: "#FAF7F0",
    theme_color: "#181513",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}

