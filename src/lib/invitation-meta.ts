import type { Metadata } from "next";
import { formatLongDate } from "@/lib/datetime";

export type MetaEvent = {
  date: string | null;
  venueName: string | null;
};

export type MetaInput = {
  groomName: string;
  brideName: string;
  events: MetaEvent[];
  coverPhotoId: string | null;
};

export const GENERIC_TITLE = "Undangan pernikahan";

export function buildInvitationMeta(input: MetaInput): Metadata {
  const title = `Undangan Pernikahan ${input.groomName} & ${input.brideName}`;
  const first = input.events.find((e) => e.date);
  const parts = [first?.date ? formatLongDate(first.date) : null, first?.venueName ?? null];
  const description = parts.filter(Boolean).join(" · ") || "Anda diundang ke pernikahan kami.";

  const images = input.coverPhotoId
    ? [
        {
          url: `/og/${input.coverPhotoId}`,
          width: 1200,
          height: 630,
          alt: `${input.groomName} & ${input.brideName}`,
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
