import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { dateFromDeadline } from "@/lib/datetime";
import { listEventDetails } from "@/lib/events/service";
import { readContent } from "@/lib/invitations/content";
import { getMusic } from "@/lib/music/service";
import { listPhotos } from "@/lib/photos/service";
import { isRsvpClosed } from "@/lib/rsvp/shared";
import { requireInvitationById, requireUser } from "@/lib/session";
import { contohTemplateView } from "@/templates/bersama/contoh";
import { semuaUcapan } from "@/templates/bersama/ucapan-server";
import { isTemplateKey, templateInfo } from "@/templates/registry";
import { renderTemplate } from "@/templates/render";
import type { InvitationView } from "@/templates/types";

export async function generateMetadata({
  params,
}: PageProps<"/pratinjau/[template]">): Promise<Metadata> {
  const { template } = await params;
  return {
    title: `Pratinjau ${templateInfo(template).label}`,
    robots: { index: false, follow: false },
  };
}

export default async function PratinjauPage({ params, searchParams }: PageProps<"/pratinjau/[template]">) {
  const { template } = await params;
  if (!isTemplateKey(template)) notFound();
  await requireUser();
  const sp = await searchParams;
  const now = new Date();
  if (sp.undangan === undefined) return renderTemplate(template, contohTemplateView(template, now.getTime()));
  const { invitation } = await requireInvitationById(sp.undangan);

  const content = readContent(invitation.content);
  const [events, photos, music, wishes] = await Promise.all([
    listEventDetails(db, invitation.id),
    listPhotos(db, invitation.id),
    content.musik.aktif ? getMusic(db, invitation.id) : Promise.resolve(null),
    content.ucapan.tampil ? semuaUcapan(db, invitation.id, now) : Promise.resolve(null),
  ]);

  const view: InvitationView = {
    mode: "pratinjau",
    slug: invitation.slug,
    token: "",
    title: invitation.title,
    guest: {
      name: "Nama Tamu",
      maxAdults: invitation.defaultMaxAdults,
      maxChildren: invitation.defaultMaxChildren,
    },
    content,
    events: events.map((e) => ({ ...e, response: null })),
    photos,
    rsvp: {
      closed: isRsvpClosed(invitation.rsvpDeadline),
      deadline: dateFromDeadline(invitation.rsvpDeadline) || null,
    },
    wishes,
    musicId: music?.id ?? null,
    now: now.getTime(),
  };
  return renderTemplate(template, view);
}
