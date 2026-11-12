import { asc, eq } from "drizzle-orm";
import { event, guest, guestEvent, invitation, rsvp } from "@/db/schema";
import type { AppDb } from "@/db/types";
import { dayWindow, eventDays, isTimeInWindow, readVisits, type Visit } from "@/lib/events/days";
import { toEventDetail, type EventDetail } from "@/lib/events/service";
import { readContent, type InvitationContent } from "@/lib/invitations/content";
import { listPhotos, type PhotoInfo } from "@/lib/photos/service";
import { getMemberContact } from "@/lib/team/service";
import { RSVP_NOTE_MAX, isRsvpClosed, type RsvpResponse } from "./shared";

export type GuestEvent = EventDetail & { response: RsvpResponse | null };

export type InvitationStatus = "draf" | "terbit" | "ditangguhkan";

export type GuestPage = {
  invitation: {
    id: string;
    slug: string;
    ownerId: string;
    status: InvitationStatus;
    title: string;
    templateKey: string;
    content: InvitationContent;
    rsvpDeadline: Date | null;
  };
  guest: {
    id: string;
    name: string;
    maxAttendees: number;
    firstOpenedAt: Date | null;
  };
  events: GuestEvent[];
  photos: PhotoInfo[];
};

const GUEST_COLUMNS = {
  guestId: guest.id,
  guestName: guest.name,
  maxAttendees: guest.maxAttendees,
  firstOpenedAt: guest.firstOpenedAt,
  addedBy: guest.addedBy,
  invitationId: invitation.id,
  slug: invitation.slug,
  ownerId: invitation.ownerId,
  status: invitation.status,
  title: invitation.title,
  templateKey: invitation.templateKey,
  content: invitation.content,
  rsvpDeadline: invitation.rsvpDeadline,
};

export async function findGuestRow(db: AppDb, token: string) {
  const [row] = await db
    .select(GUEST_COLUMNS)
    .from(guest)
    .innerJoin(invitation, eq(guest.invitationId, invitation.id))
    .where(eq(guest.token, token))
    .limit(1);
  return row ?? null;
}

export async function findGuestPage(
  db: AppDb,
  token: string,
): Promise<GuestPage | null> {
  const row = await findGuestRow(db, token);
  if (!row) return null;

  const [eventRows, responses, photos, memberContact] = await Promise.all([
    db
      .select({ ev: event })
      .from(event)
      .innerJoin(guestEvent, eq(guestEvent.eventId, event.id))
      .where(eq(guestEvent.guestId, row.guestId))
      .orderBy(asc(event.sortOrder), asc(event.createdAt)),
    db.select().from(rsvp).where(eq(rsvp.guestId, row.guestId)),
    listPhotos(db, row.invitationId),
    row.addedBy ? getMemberContact(db, row.invitationId, row.addedBy) : Promise.resolve(null),
  ]);

  const content = readContent(row.content);
  if (memberContact && (memberContact.name || memberContact.phone || memberContact.email)) {
    content.kontak = {
      nama: memberContact.name || content.kontak.nama,
      telepon: memberContact.phone || content.kontak.telepon,
      email: memberContact.email || content.kontak.email,
    };
  }

  const byEvent = new Map(responses.map((r) => [r.eventId, r]));
  return {
    invitation: {
      id: row.invitationId,
      slug: row.slug,
      ownerId: row.ownerId,
      status: row.status,
      title: row.title,
      templateKey: row.templateKey,
      content,
      rsvpDeadline: row.rsvpDeadline,
    },
    guest: {
      id: row.guestId,
      name: row.guestName,
      maxAttendees: row.maxAttendees,
      firstOpenedAt: row.firstOpenedAt,
    },
    events: eventRows.map(({ ev }) => {
      const response = byEvent.get(ev.id);
      return {
        ...toEventDetail(ev),
        response: response
          ? {
              attending: response.attending,
              attendeeCount: response.attendeeCount,
              note: response.note ?? "",
              visits: readVisits(response.visits),
            }
          : null,
      };
    }),
    photos,
  };
}

export type RawAnswer = {
  attending: string | null;
  attendeeCount: string;
  note: string;
  days?: string[];
  times?: Record<string, string>;
};

type Answer = {
  eventId: string;
  attending: boolean;
  attendeeCount: number;
  note: string | null;
  visits: Visit[];
};

export type SubmitRsvpResult =
  | { ok: true }
  | { ok: false; error: "tidak-ditemukan" | "belum-terbit" | "ditutup" }
  | { ok: false; error: "tidak-valid"; errors: Record<string, string> };

function parseCount(value: string): number | null {
  const text = value.trim();
  if (text === "") return 0;
  return /^\d{1,3}$/.test(text) ? Number(text) : null;
}

function validateVisits(ev: EventDetail, raw: RawAnswer): { visits: Visit[] } | { error: string } {
  const days = eventDays(ev);
  let chosen: string[];
  if (days.length <= 1) chosen = days;
  else {
    chosen = [...new Set(raw.days ?? [])];
    if (chosen.length === 0) return { error: "Pilih minimal satu hari kehadiran." };
    if (ev.singleDayOnly && chosen.length > 1) {
      return { error: "Anda hanya dapat memilih satu hari kedatangan untuk acara ini." };
    }
    if (chosen.some((date) => !days.includes(date))) return { error: "Hari yang dipilih tidak sesuai jadwal acara." };
  }
  const visits: Visit[] = [];
  for (const date of chosen.sort()) {
    const window = dayWindow(ev, date);
    if (!window.start) {
      visits.push({ date, time: null });
      continue;
    }
    const time = raw.times?.[date] || window.start;
    if (!isTimeInWindow(time, window.start, window.end)) return { error: "Jam datang harus berada dalam jam acara pada hari yang dipilih." };
    visits.push({ date, time });
  }
  return { visits };
}

function validateAnswer(
  ev: EventDetail,
  raw: RawAnswer,
  limits: { maxAttendees: number },
): { answer: Answer } | { error: string } {
  const eventId = ev.id;
  const note = raw.note.replace(/\r\n?/g, "\n").trim();
  if (note.length > RSVP_NOTE_MAX) return { error: `Pesan maksimal ${RSVP_NOTE_MAX} karakter.` };
  if (raw.attending === "tidak") return { answer: { eventId, attending: false, attendeeCount: 0, note: note || null, visits: [] } };
  if (raw.attending !== "ya") return { error: "Pilih hadir atau tidak hadir." };
  const attendeeCount = parseCount(raw.attendeeCount);
  if (attendeeCount === null || attendeeCount < 1 || attendeeCount > limits.maxAttendees) {
    return { error: `Jumlah peserta harus 1 sampai ${limits.maxAttendees}.` };
  }
  const visits = validateVisits(ev, raw);
  if ("error" in visits) return { error: visits.error };
  return { answer: { eventId, attending: true, attendeeCount, note: note || null, visits: visits.visits } };
}

export async function submitRsvp(
  db: AppDb,
  input: {
    token: string;
    read: (eventId: string) => RawAnswer;
    now?: Date;
  },
): Promise<SubmitRsvpResult> {
  const now = input.now ?? new Date();
  const row = await findGuestRow(db, input.token);
  if (!row) return { ok: false, error: "tidak-ditemukan" };
  if (row.status !== "terbit") return { ok: false, error: "belum-terbit" };
  if (isRsvpClosed(row.rsvpDeadline, now)) return { ok: false, error: "ditutup" };

  const invited = (
    await db
      .select({ ev: event })
      .from(guestEvent)
      .innerJoin(event, eq(guestEvent.eventId, event.id))
      .where(eq(guestEvent.guestId, row.guestId))
  ).map(({ ev }) => toEventDetail(ev));
  if (invited.length === 0) return { ok: false, error: "tidak-ditemukan" };

  const answers: Answer[] = [];
  const errors: Record<string, string> = {};
  for (const ev of invited) {
    const id = ev.id;
    const result = validateAnswer(ev, input.read(id), {
      maxAttendees: row.maxAttendees,
    });
    if ("error" in result) errors[id] = result.error;
    else answers.push(result.answer);
  }
  if (Object.keys(errors).length > 0) return { ok: false, error: "tidak-valid", errors };

  await db.transaction(async (tx) => {
    for (const answer of answers) {
      await tx
        .insert(rsvp)
        .values({
          guestId: row.guestId,
          eventId: answer.eventId,
          attending: answer.attending,
          attendeeCount: answer.attendeeCount,
          note: answer.note,
          visits: answer.visits,
          respondedAt: now,
        })
        .onConflictDoUpdate({
          target: [rsvp.guestId, rsvp.eventId],
          set: {
            attending: answer.attending,
            attendeeCount: answer.attendeeCount,
            note: answer.note,
            visits: answer.visits,
            respondedAt: now,
            updatedAt: now,
          },
        });
    }
  });
  return { ok: true };
}
