import { and, eq, isNull, sql } from "drizzle-orm";
import { guest } from "@/db/schema";
import type { AppDb } from "@/db/types";

export async function markSent(
  db: AppDb,
  invitationId: string,
  guestId: string,
  now: Date = new Date(),
): Promise<boolean> {
  const rows = await db
    .update(guest)
    .set({ sentAt: sql`coalesce(${guest.sentAt}, ${now.toISOString()}::timestamptz)` })
    .where(and(eq(guest.id, guestId), eq(guest.invitationId, invitationId)))
    .returning({ id: guest.id });
  return rows.length > 0;
}

export async function markUnsent(
  db: AppDb,
  invitationId: string,
  guestId: string,
): Promise<boolean> {
  const rows = await db
    .update(guest)
    .set({ sentAt: null })
    .where(and(eq(guest.id, guestId), eq(guest.invitationId, invitationId)))
    .returning({ id: guest.id });
  return rows.length > 0;
}

export async function countSent(db: AppDb, invitationId: string) {
  const [row] = await db
    .select({
      total: sql<number>`count(*)::int`,
      sent: sql<number>`count(${guest.sentAt})::int`,
    })
    .from(guest)
    .where(eq(guest.invitationId, invitationId));
  return { total: row?.total ?? 0, sent: row?.sent ?? 0 };
}

export async function markReminded(
  db: AppDb,
  invitationId: string,
  guestId: string,
  now: Date = new Date(),
): Promise<boolean> {
  const rows = await db
    .update(guest)
    .set({ lastRemindedAt: now })
    .where(and(eq(guest.id, guestId), eq(guest.invitationId, invitationId)))
    .returning({ id: guest.id });
  return rows.length > 0;
}

export async function markOpened(
  db: AppDb,
  guestId: string,
  now: Date = new Date(),
): Promise<boolean> {
  const rows = await db
    .update(guest)
    .set({ firstOpenedAt: now })
    .where(and(eq(guest.id, guestId), isNull(guest.firstOpenedAt)))
    .returning({ id: guest.id });
  return rows.length > 0;
}

const CRAWLER_PATTERN =
  /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|telegram|linkedin|embedly|skypeuripreview|curl|wget|python-requests|headless/i;

export function isLinkCrawler(userAgent: string | null | undefined): boolean {
  if (!userAgent) return true;
  return CRAWLER_PATTERN.test(userAgent);
}
