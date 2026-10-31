import { and, asc, eq } from "drizzle-orm";
import { event, invitation } from "@/db/schema";
import type { AppDb } from "@/db/types";
import { shortTime, type Zone } from "@/lib/datetime";
import type { EventInput } from "./form";

export const MAX_EVENTS = 8;

export type EventDetail = {
  id: string;
  key: string;
  name: string;
  sortOrder: number;
  date: string | null;
  time: string | null;
  timezone: Zone;
  venueName: string | null;
  address: string | null;
  mapsUrl: string | null;
};

type EventRow = typeof event.$inferSelect;

function toDetail(row: EventRow): EventDetail {
  return {
    id: row.id,
    key: row.key,
    name: row.name,
    sortOrder: row.sortOrder,
    date: row.eventDate,
    time: shortTime(row.eventTime),
    timezone: row.timezone,
    venueName: row.venueName,
    address: row.address,
    mapsUrl: row.mapsUrl,
  };
}

export function makeEventKey(name: string): string {
  const base = name
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30)
    .replace(/-+$/g, "");
  return base || "acara";
}

async function lockInvitation(tx: AppDb, invitationId: string) {
  await tx
    .select({ id: invitation.id })
    .from(invitation)
    .where(eq(invitation.id, invitationId))
    .for("update");
}

export async function listEventDetails(
  db: AppDb,
  invitationId: string,
): Promise<EventDetail[]> {
  const rows = await db
    .select()
    .from(event)
    .where(eq(event.invitationId, invitationId))
    .orderBy(asc(event.sortOrder), asc(event.createdAt));
  return rows.map(toDetail);
}

export type CreateEventResult =
  | { ok: true; event: EventDetail }
  | { ok: false; error: "penuh" };

export async function createEvent(
  db: AppDb,
  invitationId: string,
  name: string,
): Promise<CreateEventResult> {
  return db.transaction(async (tx) => {
    await lockInvitation(tx, invitationId);
    const existing = await tx
      .select({ key: event.key, sortOrder: event.sortOrder })
      .from(event)
      .where(eq(event.invitationId, invitationId));
    if (existing.length >= MAX_EVENTS) return { ok: false, error: "penuh" } as const;

    const taken = new Set(existing.map((e) => e.key));
    const base = makeEventKey(name);
    let key = base;
    for (let n = 2; taken.has(key); n++) key = `${base}-${n}`;
    const sortOrder = existing.reduce((max, e) => Math.max(max, e.sortOrder), -1) + 1;

    const [created] = await tx
      .insert(event)
      .values({ invitationId, key, name, sortOrder })
      .returning();
    return { ok: true, event: toDetail(created) } as const;
  });
}

export async function updateEvent(
  db: AppDb,
  invitationId: string,
  eventId: string,
  input: EventInput,
): Promise<EventDetail | null> {
  const [updated] = await db
    .update(event)
    .set({
      name: input.name,
      eventDate: input.date,
      eventTime: input.time,
      timezone: input.timezone,
      venueName: input.venueName,
      address: input.address,
      mapsUrl: input.mapsUrl,
    })
    .where(and(eq(event.id, eventId), eq(event.invitationId, invitationId)))
    .returning();
  return updated ? toDetail(updated) : null;
}

export type DeleteEventResult = "dihapus" | "tidak-ada" | "terakhir";

export async function deleteEvent(
  db: AppDb,
  invitationId: string,
  eventId: string,
): Promise<DeleteEventResult> {
  return db.transaction(async (tx) => {
    await lockInvitation(tx, invitationId);
    const rows = await tx
      .select({ id: event.id })
      .from(event)
      .where(eq(event.invitationId, invitationId));
    if (!rows.some((r) => r.id === eventId)) return "tidak-ada";
    if (rows.length <= 1) return "terakhir";
    await tx
      .delete(event)
      .where(and(eq(event.id, eventId), eq(event.invitationId, invitationId)));
    return "dihapus";
  });
}
