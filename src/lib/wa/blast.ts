import type { AppDb } from "@/db/types";
import { guestLink } from "@/lib/app-url";
import { dateFromDeadline, formatDate } from "@/lib/datetime";
import { listGuests } from "@/lib/guests/service";
import { readContent } from "@/lib/invitations/content";
import type { Invitation } from "@/lib/invitations/service";
import { listPhotos } from "@/lib/photos/service";
import { getSettings } from "@/lib/platform/service";
import { getDashboard } from "@/lib/rsvp/dashboard";
import { deadlinePhrase, pickTemplate, renderMessage } from "@/lib/whatsapp";
import { enqueueJobs, queuedGuestIds, type JobKind, type NewJob } from "./queue";

const REMINDER_COOLDOWN_MS = 24 * 60 * 60 * 1000;

export type TargetGuest = {
  id: string;
  name: string;
  phone: string;
  token: string;
  sentAt: Date | null;
  remindedAt: Date | null;
  answered: boolean;
};

export function pickTargets(
  kind: JobKind,
  guests: TargetGuest[],
  queued: ReadonlySet<string>,
  now: Date = new Date(),
): TargetGuest[] {
  return guests.filter((g) => {
    if (queued.has(g.id)) return false;
    if (kind === "undangan") return g.sentAt === null;
    if (g.sentAt === null || g.answered) return false;
    return !g.remindedAt || now.getTime() - g.remindedAt.getTime() >= REMINDER_COOLDOWN_MS;
  });
}

async function loadTargets(
  db: AppDb,
  invitationId: string,
  kind: JobKind,
  now: Date,
  addedBy?: string,
): Promise<TargetGuest[]> {
  const [guests, dashboard, queued] = await Promise.all([
    listGuests(db, invitationId, { addedBy }),
    getDashboard(db, invitationId, {}, addedBy),
    queuedGuestIds(db, invitationId, kind),
  ]);
  const detail = new Map(dashboard.guests.map((g) => [g.id, g]));
  const all: TargetGuest[] = guests.map((g) => ({
    id: g.id,
    name: g.name,
    phone: g.phone,
    token: g.token,
    sentAt: g.sentAt,
    remindedAt: detail.get(g.id)?.remindedAt ?? null,
    answered: detail.get(g.id)?.status !== "belum",
  }));
  return pickTargets(kind, all, queued, now);
}

export async function countTargets(
  db: AppDb,
  invitationId: string,
  kind: JobKind,
  now: Date = new Date(),
  addedBy?: string,
): Promise<number> {
  return (await loadTargets(db, invitationId, kind, now, addedBy)).length;
}

export type BlastResult = { ok: true; added: number } | { ok: false; error: string };

export async function queueBlast(
  db: AppDb,
  invitation: Invitation,
  kind: JobKind,
  now: Date = new Date(),
  options: { senderUserId?: string; addedBy?: string } = {},
): Promise<BlastResult> {
  if (invitation.status !== "terbit") {
    return { ok: false, error: "Undangan belum terbit, jadi link tamu belum bisa dibuka." };
  }
  const targets = await loadTargets(db, invitation.id, kind, now, options.addedBy);
  if (targets.length === 0) {
    return { ok: false, error: "Tidak ada tamu yang perlu dikirimi." };
  }

  const content = readContent(invitation.content);
  let posterId: string | null = null;
  if (kind === "undangan" && content.waPoster.kirim) {
    const wanted = content.waPoster.sumber === "khusus" ? "poster_wa" : "cover";
    posterId = (await listPhotos(db, invitation.id)).find((p) => p.kind === wanted)?.id ?? null;
    if (!posterId) {
      return {
        ok: false,
        error: content.waPoster.sumber === "khusus"
          ? "Poster khusus WhatsApp belum diunggah. Unggah dulu atau matikan pilihan poster."
          : "Poster di Isi undangan belum diunggah. Unggah dulu atau matikan pilihan poster.",
      };
    }
  }
  const settings = await getSettings(db);
  const template = pickTemplate(kind, content, settings.pesanWaBawaan);
  const eventTitle = `${invitation.title}`;
  const deadlineText = invitation.rsvpDeadline
    ? formatDate(dateFromDeadline(invitation.rsvpDeadline))
    : null;
  const phrase = deadlinePhrase(deadlineText);

  const jobs: NewJob[] = targets.map((g) => ({
    guestId: g.id,
    phone: g.phone,
    posterId,
    senderUserId: options.senderUserId ?? null,
    message: renderMessage(template, {
      nama: g.name,
      link: guestLink(g.token),
      batas_rsvp: phrase,
      event: eventTitle,
    }),
  }));
  const added = await enqueueJobs(db, invitation.id, kind, jobs);
  return { ok: true, added };
}
