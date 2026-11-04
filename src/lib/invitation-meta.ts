import type { Metadata } from "next";
import { formatLongDate } from "@/lib/datetime";

export type MetaEvent = {
  date: string | null;
  venueName: string | null;
};

export type MetaInput = {
  title: string;
  events: MetaEvent[];
  coverPhotoId: string | null;
};

export const GENERIC_TITLE = "Undangan event";

export function buildInvitationMeta(input: MetaInput): Metadata {
  const title = `Undangan ${input.title}`;
  const first = input.events.find((e) => e.date);
  const parts = [first?.date ? formatLongDate(first.date) : null, first?.venueName ?? null];
  const description = parts.filter(Boolean).join(" · ") || "Anda diundang untuk menghadiri acara ini.";

  const images = input.coverPhotoId
    ? [
        {
          url: `/og/${input.coverPhotoId}`,
          width: 1200,
          height: 630,
          alt: `${input.title}`,
        },
      ]
    : [];

  return {
    title: { absolute: title },
    description,
    openGraph: {
      type: "website",
      siteName: "UndanganDigital",
      locale: "id_ID",
      title,
      description,
      images,
    },
    twitter: {
      card: images.length > 0 ? "summary_large_image" : "summary",
      title,
      description,
      images: images.map((image) => image.url),
    },
  };
}
