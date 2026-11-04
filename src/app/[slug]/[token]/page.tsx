import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { after } from "next/server";
import { cache } from "react";
import { db } from "@/db";
import { appBaseUrl } from "@/lib/app-url";
import { dateFromDeadline } from "@/lib/datetime";
import { GENERIC_TITLE, buildInvitationMeta } from "@/lib/invitation-meta";
import { isLinkCrawler, markOpened } from "@/lib/guests/sending";
import { getMusic } from "@/lib/music/service";
import { findGuestPage, type GuestPage } from "@/lib/rsvp/service";
import { isRsvpClosed } from "@/lib/rsvp/shared";
import { getSession } from "@/lib/session";
import { looksLikeGuestToken, looksLikeSlug } from "@/lib/token";
import { currentClientKey, tokenGuard } from "@/lib/token-guard-instance";
import { halamanUcapan, semuaUcapan } from "@/templates/bersama/ucapan-server";
import { renderTemplate } from "@/templates/render";
import type { InvitationView } from "@/templates/types";
import { TerlaluBanyakPercobaan } from "./terlalu-banyak";

type GuestLookup =
  | { kind: "blocked"; retryAfter: number }
  | { kind: "missing" }
  | { kind: "found"; data: GuestPage };

const loadGuestPage = cache(async (slug: string, token: string): Promise<GuestLookup> => {
  const key = await currentClientKey();
  if (tokenGuard.isBlocked(key)) {
    return { kind: "blocked", retryAfter: tokenGuard.retryAfterSeconds(key) };
  }
  const data =
    looksLikeSlug(slug) && looksLikeGuestToken(token) ? await findGuestPage(db, slug, token) : null;
  if (!data) {
    tokenGuard.recordFailure(key);
    return { kind: "missing" };
  }
  return { kind: "found", data };
});

export async function generateMetadata({
  params,
}: PageProps<"/[slug]/[token]">): Promise<Metadata> {
  const { slug, token } = await params;
  const lookup = await loadGuestPage(slug, token);
  const metadataBase = new URL(appBaseUrl());
  if (lookup.kind !== "found" || lookup.data.invitation.status !== "terbit") {
    return { metadataBase, title: { absolute: GENERIC_TITLE } };
  }
  const data = lookup.data;
  return {
    metadataBase,
    ...buildInvitationMeta({
      title: data.invitation.title,
      events: data.events.map((e) => ({ date: e.date, venueName: e.venueName })),
      coverPhotoId: data.photos.find((p) => p.kind === "cover")?.id ?? null,
    }),
  };
}

export default async function UndanganTamuPage({ params }: PageProps<"/[slug]/[token]">) {
  const { slug, token } = await params;
  const lookup = await loadGuestPage(slug, token);
  if (lookup.kind === "blocked") return <TerlaluBanyakPercobaan detik={lookup.retryAfter} />;
  if (lookup.kind === "missing") notFound();

  const { invitation, guest, events, photos } = lookup.data;
  const session = await getSession();
  const isOwner = session?.user.id === invitation.ownerId;
  const preview = invitation.status === "draf" && isOwner;
  if (invitation.status !== "terbit" && !preview) notFound();

  if (invitation.status === "terbit" && !isOwner && !guest.firstOpenedAt) {
    const userAgent = (await headers()).get("user-agent");
    if (!isLinkCrawler(userAgent)) {
      const guestId = guest.id;
      after(async () => {
        await markOpened(db, guestId);
      });
    }
  }

  const now = new Date();
  const content = invitation.content;
  const [wishes, music] = await Promise.all([
    content.ucapan.tampil
      ? preview
        ? semuaUcapan(db, invitation.id, now)
        : halamanUcapan(db, invitation.id, 1, now).then((h) => ({ ...h, lokal: null }))
      : Promise.resolve(null),
    content.musik.aktif ? getMusic(db, invitation.id) : Promise.resolve(null),
  ]);

  const view: InvitationView = {
    mode: preview ? "pratinjau" : "tamu",
    slug: invitation.slug,
    token,
    title: invitation.title,
    guest: {
      name: guest.name,
      maxAdults: guest.maxAdults,
      maxChildren: guest.maxChildren,
    },
    content,
    events,
    photos,
    rsvp: {
      closed: isRsvpClosed(invitation.rsvpDeadline),
      deadline: dateFromDeadline(invitation.rsvpDeadline) || null,
    },
    wishes,
    musicId: music?.id ?? null,
    now: now.getTime(),
  };

  return renderTemplate(invitation.templateKey, view);
}
