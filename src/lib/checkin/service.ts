import { randomBytes } from "node:crypto";
import { and, asc, eq, ilike, isNull, or, sql } from "drizzle-orm";
import { guest, guestGroup, invitation, rsvp } from "@/db/schema";
import type { AppDb } from "@/db/types";
import { parseCheckinCode } from "./code";

export function newCheckinKey(): string {
  return randomBytes(15).toString("base64url");
}

export async function getOrCreateCheckinKey(db: AppDb, invitationId: string): Promise<string | null> {
  const [current] = await db
    .select({ key: invitation.checkinKey })
    .from(invitation)
    .where(eq(invitation.id, invitationId));
  if (!current) return null;
  if (current.key) return current.key;

  const created = await db
    .update(invitation)
    .set({ checkinKey: newCheckinKey() })
    .where(and(eq(invitation.id, invitationId), isNull(invitation.checkinKey)))
    .returning({ key: invitation.checkinKey });
  if (created[0]?.key) return created[0].key;

  const [again] = await db
    .select({ key: invitation.checkinKey })
    .from(invitation)
    .where(eq(invitation.id, invitationId));
  return again?.key ?? null;
}

export async function regenerateCheckinKey(db: AppDb, invitationId: string): Promise<string | null> {
  const rows = await db
    .update(invitation)
    .set({ checkinKey: newCheckinKey() })
    .where(eq(invitation.id, invitationId))
    .returning({ key: invitation.checkinKey });
  return rows[0]?.key ?? null;
}

export type UsherInvitation = {
  id: string;
  slug: string;
  title: string;
};

export async function findInvitationByKey(
  db: AppDb,
  slug: string,
  key: string,
): Promise<UsherInvitation | null> {
  const [row] = await db
    .select({
      id: invitation.id,
      slug: invitation.slug,
      title: invitation.title,
    })
    .from(invitation)
    .where(
      and(
        eq(invitation.slug, slug),
        eq(invitation.checkinKey, key),
        sql`coalesce((${invitation.content} -> 'checkin' ->> 'aktif')::boolean, true)`,
      ),
    )
    .limit(1);
  return row ?? null;
}

const ATTENDING = sql<boolean>`coalesce((select bool_or(rsvp.attending) from rsvp where rsvp.guest_id = ${guest.id}), false)`;
const ATTENDEES = sql<number>`coalesce((select max(rsvp.attendee_count) from rsvp where rsvp.guest_id = ${guest.id} and rsvp.attending), 0)::int`;

export type CheckinGuest = {
  id: string;
  name: string;
  groupName: string | null;
  attending: boolean;
  attendeeCount: number;
  checkedInAt: Date | null;
};

export type ScanResult =
  | { result: "kode-tidak-valid" | "undangan-lain" | "tidak-dikenal" }
  | { result: "belum-konfirmasi"; guest: CheckinGuest }
  | { result: "sudah-masuk"; guest: CheckinGuest }
  | { result: "masuk"; guest: CheckinGuest };

async function loadGuest(
  db: AppDb,
  invitationId: string,
  match: ReturnType<typeof eq>,
): Promise<CheckinGuest | null> {
  const [row] = await db
    .select({
      id: guest.id,
      name: guest.name,
      groupName: guestGroup.name,
      attending: ATTENDING,
      attendeeCount: ATTENDEES,
      checkedInAt: guest.checkedInAt,
    })
    .from(guest)
    .leftJoin(guestGroup, eq(guestGroup.id, guest.groupId))
    .where(and(eq(guest.invitationId, invitationId), match))
    .limit(1);
  return row ?? null;
}

export async function markCheckedIn(
  db: AppDb,
  invitationId: string,
  guestId: string,
  now: Date = new Date(),
): Promise<"masuk" | "sudah-masuk" | "tidak-ada"> {
  const updated = await db
    .update(guest)
    .set({ checkedInAt: now })
    .where(
      and(eq(guest.id, guestId), eq(guest.invitationId, invitationId), isNull(guest.checkedInAt)),
    )
    .returning({ id: guest.id });
  if (updated.length > 0) return "masuk";
  const existing = await loadGuest(db, invitationId, eq(guest.id, guestId));
  return existing ? "sudah-masuk" : "tidak-ada";
}

export async function undoCheckIn(
  db: AppDb,
  invitationId: string,
  guestId: string,
): Promise<boolean> {
  const rows = await db
    .update(guest)
    .set({ checkedInAt: null })
    .where(and(eq(guest.id, guestId), eq(guest.invitationId, invitationId)))
    .returning({ id: guest.id });
  return rows.length > 0;
}

export async function scanCheckin(
  db: AppDb,
  invitation: { id: string },
  code: string,
  now: Date = new Date(),
  addedBy?: string,
): Promise<ScanResult> {
  const parsed = parseCheckinCode(code);
  if (!parsed) return { result: "kode-tidak-valid" };

  const found = await loadGuest(db, invitation.id, and(eq(guest.token, parsed.token), addedBy ? eq(guest.addedBy, addedBy) : undefined)!);
  if (!found) return { result: "tidak-dikenal" };
  if (found.checkedInAt) return { result: "sudah-masuk", guest: found };
  if (!found.attending) return { result: "belum-konfirmasi", guest: found };

  const outcome = await markCheckedIn(db, invitation.id, found.id, now);
  const fresh = (await loadGuest(db, invitation.id, eq(guest.id, found.id))) ?? found;
  return outcome === "masuk" ? { result: "masuk", guest: fresh } : { result: "sudah-masuk", guest: fresh };
}

export async function forceCheckIn(
  db: AppDb,
  invitationId: string,
  guestId: string,
  now: Date = new Date(),
): Promise<ScanResult> {
  const outcome = await markCheckedIn(db, invitationId, guestId, now);
  const found = await loadGuest(db, invitationId, eq(guest.id, guestId));
  if (!found || outcome === "tidak-ada") return { result: "tidak-dikenal" };
  return outcome === "masuk" ? { result: "masuk", guest: found } : { result: "sudah-masuk", guest: found };
}

export async function listCheckinGuests(
  db: AppDb,
  invitationId: string,
  filters: { q?: string; onlyAttending?: boolean; limit?: number; addedBy?: string } = {},
): Promise<(CheckinGuest & { token: string })[]> {
  const conditions = [eq(guest.invitationId, invitationId)];
  if (filters.addedBy) conditions.push(eq(guest.addedBy, filters.addedBy));
  const needle = filters.q?.trim().replace(/[%_\\]/g, "\\$&");
  if (needle) conditions.push(or(ilike(guest.name, `%${needle}%`), ilike(guest.phone, `%${needle}%`))!);
  if (filters.onlyAttending) conditions.push(sql`${ATTENDING}`);

  return db
    .select({
      id: guest.id,
      name: guest.name,
      groupName: guestGroup.name,
      attending: ATTENDING,
      attendeeCount: ATTENDEES,
      checkedInAt: guest.checkedInAt,
      token: guest.token,
    })
    .from(guest)
    .leftJoin(guestGroup, eq(guestGroup.id, guest.groupId))
    .where(and(...conditions))
    .orderBy(sql`${ATTENDING} desc`, asc(guest.name), asc(guest.id))
    .limit(Math.min(filters.limit ?? 300, 1000));
}

export type CheckinCounts = {
  confirmed: number;
  inside: number;
  insidePeople: number;
  other: number;
};

export async function checkinCounts(db: AppDb, invitationId: string, addedBy?: string): Promise<CheckinCounts> {
  const [row] = await db
    .select({
      confirmed: sql<number>`(count(*) filter (where ${ATTENDING}))::int`,
      inside: sql<number>`(count(*) filter (where ${guest.checkedInAt} is not null))::int`,
      insidePeople: sql<number>`coalesce(sum(case when ${guest.checkedInAt} is not null then greatest(${ATTENDEES}, 1) else 0 end), 0)::int`,
      other: sql<number>`(count(*) filter (where ${guest.checkedInAt} is not null and not ${ATTENDING}))::int`,
    })
    .from(guest)
    .where(and(eq(guest.invitationId, invitationId), addedBy ? eq(guest.addedBy, addedBy) : undefined));
  return row ?? { confirmed: 0, inside: 0, insidePeople: 0, other: 0 };
}

export async function isGuestAttending(db: AppDb, guestId: string): Promise<boolean> {
  const [row] = await db
    .select({ attending: sql<boolean>`bool_or(${rsvp.attending})` })
    .from(rsvp)
    .where(eq(rsvp.guestId, guestId));
  return Boolean(row?.attending);
}
