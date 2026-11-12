import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { listEventDetails } from "@/lib/events/service";
import { readContent } from "@/lib/invitations/content";
import { listPhotos } from "@/lib/photos/service";
import { isRsvpClosed } from "@/lib/rsvp/shared";
import { requireInvitationAccess, requireUser } from "@/lib/session";
import { getMemberContact } from "@/lib/team/service";
import { contohTemplateView } from "@/templates/bersama/contoh";
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
  const { invitation, role, user } = await requireInvitationAccess(sp.undangan);

  const content = readContent(invitation.content);
  let customKontak = content.kontak;
  if (role === "anggota") {
    const memberContact = await getMemberContact(db, invitation.id, user.id);
    if (memberContact && (memberContact.name || memberContact.phone || memberContact.email)) {
      customKontak = {
        nama: memberContact.name || content.kontak.nama,
        telepon: memberContact.phone || content.kontak.telepon,
        email: memberContact.email || content.kontak.email,
      };
    }
  }

  const [events, photos] = await Promise.all([
    listEventDetails(db, invitation.id),
    listPhotos(db, invitation.id),
  ]);

  const view: InvitationView = {
    mode: "pratinjau",
    token: "",
    title: invitation.title,
    guest: {
      name: "Nama Tamu",
      maxAttendees: invitation.defaultMaxAttendees,
    },
    content: {
      ...content,
      kontak: customKontak,
    },
    events: events.map((e) => ({ ...e, response: null })),
    photos,
    rsvp: {
      closed: isRsvpClosed(invitation.rsvpDeadline),
      deadline: invitation.rsvpDeadline ? invitation.rsvpDeadline.toISOString() : null,
    },
    now: now.getTime(),
  };
  return renderTemplate(template, view);
}
