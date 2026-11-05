import { randomUUID } from "node:crypto";
import {
  and,
  asc,
  eq,
  ilike,
  inArray,
  like,
  ne,
  notInArray,
  or,
  sql,
} from "drizzle-orm";
import {
  event,
  guest,
  guestEvent,
  guestGroup,
  invitation,
  rsvp,
} from "@/db/schema";
import type { AppDb } from "@/db/types";
import { phoneSearchNeedle } from "@/lib/phone";
import { newGuestToken } from "@/lib/token";
import {
  validateImportRows,
  type ImportContext,
  type RawRow,
} from "./import";

export type GuestFilters = {
  id?: string;
  q?: string;
  groupId?: string;
  eventId?: string;
};

export type GuestRow = {
  id: string;
  name: string;
  phone: string;
  token: string;
  groupId: string | null;
  groupName: string | null;
  maxAttendees: number;
  sentAt: Date | null;
  eventIds: string[];
};

function escapeLike(text: string): string {
  return text.replace(/[\\%_]/g, (c) => `\\${c}`);
}

export async function listGuests(
  db: AppDb,
  invitationId: string,
  filters: GuestFilters = {},
): Promise<GuestRow[]> {
  const conditions = [eq(guest.invitationId, invitationId)];

  if (filters.id) conditions.push(eq(guest.id, filters.id));
  const q = filters.q?.trim();
  if (q) {
    const needle = phoneSearchNeedle(q);
    conditions.push(
      or(
        ilike(guest.name, `%${escapeLike(q)}%`),
        needle ? like(guest.phone, `%${needle}%`) : undefined,
      )!,
    );
  }
  if (filters.groupId) conditions.push(eq(guest.groupId, filters.groupId));
  if (filters.eventId) {
    conditions.push(
      inArray(
        guest.id,
        db
          .select({ id: guestEvent.guestId })
          .from(guestEvent)
          .where(eq(guestEvent.eventId, filters.eventId)),
      ),
    );
  }

  const rows = await db
    .select({
      id: guest.id,
      name: guest.name,
      phone: guest.phone,
      token: guest.token,
      groupId: guest.groupId,
      groupName: guestGroup.name,
      maxAttendees: guest.maxAttendees,
      sentAt: guest.sentAt,
    })
    .from(guest)
    .leftJoin(guestGroup, eq(guest.groupId, guestGroup.id))
    .where(and(...conditions))
    .orderBy(asc(guest.createdAt), asc(guest.name));

  if (rows.length === 0) return [];

  const links = await db
    .select({ guestId: guestEvent.guestId, eventId: guestEvent.eventId })
    .from(guestEvent)
    .where(
      inArray(
        guestEvent.guestId,
        rows.map((r) => r.id),
      ),
    );
  const eventsByGuest = new Map<string, string[]>();
  for (const link of links) {
    const list = eventsByGuest.get(link.guestId) ?? [];
    list.push(link.eventId);
    eventsByGuest.set(link.guestId, list);
  }

  return rows.map((r) => ({ ...r, eventIds: eventsByGuest.get(r.id) ?? [] }));
}

export async function firstGuestToken(
  db: AppDb,
  invitationId: string,
): Promise<string | null> {
  const [row] = await db
    .select({ token: guest.token })
    .from(guest)
    .where(eq(guest.invitationId, invitationId))
    .orderBy(asc(guest.createdAt), asc(guest.name))
    .limit(1);
  return row?.token ?? null;
}

export async function countGuests(db: AppDb, invitationId: string) {
  const [row] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(guest)
    .where(eq(guest.invitationId, invitationId));
  return row?.total ?? 0;
}

export async function listEvents(db: AppDb, invitationId: string) {
  return db
    .select({ id: event.id, key: event.key, name: event.name })
    .from(event)
    .where(eq(event.invitationId, invitationId))
    .orderBy(asc(event.sortOrder), asc(event.name));
}

export async function listGroups(db: AppDb, invitationId: string) {
  return db
    .select({ id: guestGroup.id, name: guestGroup.name })
    .from(guestGroup)
    .where(eq(guestGroup.invitationId, invitationId))
    .orderBy(asc(guestGroup.name));
}

export async function findPhoneConflict(
  db: AppDb,
  invitationId: string,
  phone: string,
  excludeGuestId?: string,
): Promise<{ id: string; name: string } | null> {
  const conditions = [
    eq(guest.invitationId, invitationId),
    eq(guest.phone, phone),
  ];
  if (excludeGuestId) conditions.push(ne(guest.id, excludeGuestId));
  const [row] = await db
    .select({ id: guest.id, name: guest.name })
    .from(guest)
    .where(and(...conditions))
    .orderBy(asc(guest.createdAt))
    .limit(1);
  return row ?? null;
}

async function ensureGroupId(
  tx: AppDb,
  invitationId: string,
  name: string | null,
): Promise<string | null> {
  if (!name) return null;
  const [existing] = await tx
    .select({ id: guestGroup.id })
    .from(guestGroup)
    .where(
      and(
        eq(guestGroup.invitationId, invitationId),
        sql`lower(${guestGroup.name}) = lower(${name})`,
      ),
    )
    .limit(1);
  if (existing) return existing.id;
  const [created] = await tx
    .insert(guestGroup)
    .values({ invitationId, name })
    .returning({ id: guestGroup.id });
  return created.id;
}

async function ownEventIds(
  tx: AppDb,
  invitationId: string,
  eventIds: string[],
): Promise<string[]> {
  if (eventIds.length === 0) return [];
  const rows = await tx
    .select({ id: event.id })
    .from(event)
    .where(
      and(eq(event.invitationId, invitationId), inArray(event.id, eventIds)),
    );
  return rows.map((r) => r.id);
}

export type GuestInput = {
  name: string;
  phone: string;
  groupName: string | null;
  eventIds: string[];
  maxAttendees: number;
};

export async function createGuest(
  db: AppDb,
  invitationId: string,
  input: GuestInput,
) {
  return db.transaction(async (tx) => {
    const eventIds = await ownEventIds(tx, invitationId, input.eventIds);
    const groupId = await ensureGroupId(tx, invitationId, input.groupName);
    const [created] = await tx
      .insert(guest)
      .values({
        invitationId,
        groupId,
        name: input.name,
        phone: input.phone,
        token: newGuestToken(),
        maxAttendees: input.maxAttendees,
      })
      .returning();
    if (eventIds.length > 0) {
      await tx
        .insert(guestEvent)
        .values(eventIds.map((eventId) => ({ guestId: created.id, eventId })));
    }
    return created;
  });
}

export async function updateGuest(
  db: AppDb,
  invitationId: string,
  guestId: string,
  input: GuestInput,
) {
  return db.transaction(async (tx) => {
    const eventIds = await ownEventIds(tx, invitationId, input.eventIds);
    const groupId = await ensureGroupId(tx, invitationId, input.groupName);
    const [updated] = await tx
      .update(guest)
      .set({
        groupId,
        name: input.name,
        phone: input.phone,
        maxAttendees: input.maxAttendees,
      })
      .where(and(eq(guest.id, guestId), eq(guest.invitationId, invitationId)))
      .returning();
    if (!updated) return null;

    await tx.delete(guestEvent).where(eq(guestEvent.guestId, guestId));
    if (eventIds.length > 0) {
      await tx
        .insert(guestEvent)
        .values(eventIds.map((eventId) => ({ guestId, eventId })));
    }
    await tx
      .delete(rsvp)
      .where(
        eventIds.length > 0
          ? and(eq(rsvp.guestId, guestId), notInArray(rsvp.eventId, eventIds))
          : eq(rsvp.guestId, guestId),
      );
    return updated;
  });
}

export async function deleteGuest(
  db: AppDb,
  invitationId: string,
  guestId: string,
): Promise<boolean> {
  const rows = await db
    .delete(guest)
    .where(and(eq(guest.id, guestId), eq(guest.invitationId, invitationId)))
    .returning({ id: guest.id });
  return rows.length > 0;
}

export async function getGuest(
  db: AppDb,
  invitationId: string,
  guestId: string,
): Promise<GuestRow | null> {
  const rows = await listGuests(db, invitationId, { id: guestId });
  return rows[0] ?? null;
}

export async function getImportContext(
  db: AppDb,
  invitationId: string,
): Promise<ImportContext> {
  const [inv] = await db
    .select({
      maxAttendees: invitation.defaultMaxAttendees,
    })
    .from(invitation)
    .where(eq(invitation.id, invitationId));
  if (!inv) throw new Error("Undangan tidak ditemukan.");

  const [events, groups, existing] = await Promise.all([
    listEvents(db, invitationId),
    listGroups(db, invitationId),
    db
      .select({ name: guest.name, phone: guest.phone })
      .from(guest)
      .where(eq(guest.invitationId, invitationId))
      .orderBy(asc(guest.createdAt)),
  ]);

  return {
    events,
    groups: groups.map((g) => g.name),
    existing,
    defaults: { maxAttendees: inv.maxAttendees },
  };
}

export type CommitImportResult =
  | { ok: true; imported: number; skipped: number }
  | { ok: false; error: string };

export async function commitImport(
  db: AppDb,
  invitationId: string,
  rows: RawRow[],
  skipProblems: boolean,
): Promise<CommitImportResult> {
  const context = await getImportContext(db, invitationId);
  const validated = validateImportRows(rows, context);
  const ready = validated.filter((r) => r.status === "siap");
  const problems = validated.length - ready.length;

  if (problems > 0 && !skipProblems) {
    return {
      ok: false,
      error: `${problems} baris masih bermasalah. Perbaiki, atau pilih untuk melewati baris bermasalah.`,
    };
  }
  if (ready.length === 0) {
    return { ok: false, error: "Tidak ada baris yang siap diimpor." };
  }

  await db.transaction(async (tx) => {
    const groupIds = new Map<string, string>();
    const existingGroups = await tx
      .select({ id: guestGroup.id, name: guestGroup.name })
      .from(guestGroup)
      .where(eq(guestGroup.invitationId, invitationId));
    for (const g of existingGroups) groupIds.set(g.name.toLowerCase(), g.id);

    for (const row of ready) {
      if (!row.groupName) continue;
      const key = row.groupName.toLowerCase();
      if (groupIds.has(key)) continue;
      const [created] = await tx
        .insert(guestGroup)
        .values({ invitationId, name: row.groupName })
        .returning({ id: guestGroup.id });
      groupIds.set(key, created.id);
    }

    const CHUNK = 300;
    for (let start = 0; start < ready.length; start += CHUNK) {
      const chunk = ready.slice(start, start + CHUNK).map((row) => ({
        row,
        id: randomUUID(),
      }));
      await tx.insert(guest).values(
        chunk.map(({ row, id }) => ({
          id,
          invitationId,
          groupId: row.groupName
            ? (groupIds.get(row.groupName.toLowerCase()) ?? null)
            : null,
          name: row.name,
          phone: row.phone!,
          token: newGuestToken(),
          maxAttendees: row.maxAttendees,
        })),
      );
      const links = chunk.flatMap(({ row, id }) =>
        row.eventIds.map((eventId) => ({ guestId: id, eventId })),
      );
      if (links.length > 0) await tx.insert(guestEvent).values(links);
    }
  });

  return { ok: true, imported: ready.length, skipped: problems };
}
