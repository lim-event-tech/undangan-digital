import { and, asc, desc, eq, gte, inArray, notInArray, sql } from "drizzle-orm";
import { guest, invitation, waJob } from "@/db/schema";
import type { AppDb } from "@/db/types";
import { markReminded, markSent } from "@/lib/guests/sending";

export type JobKind = "undangan" | "pengingat";

export type NewJob = { guestId: string; phone: string; message: string; posterId?: string | null; senderUserId?: string | null };

export type ClaimedJob = {
  id: string;
  invitationId: string;
  guestId: string;
  kind: JobKind;
  phone: string;
  message: string;
  posterId: string | null;
  senderUserId: string | null;
  createdAt: Date;
};

export type JobResult = { ok: true } | { ok: false; error: string } | { skipped: string };

export type QueueSummary = {
  menunggu: number;
  mengirim: number;
  terkirim: number;
  gagal: number;
};

const CHUNK = 300;
const DAY_MS = 24 * 60 * 60 * 1000;

export async function enqueueJobs(
  db: AppDb,
  invitationId: string,
  kind: JobKind,
  jobs: NewJob[],
): Promise<number> {
  let added = 0;
  for (let i = 0; i < jobs.length; i += CHUNK) {
    const slice = jobs.slice(i, i + CHUNK);
    const rows = await db
      .insert(waJob)
      .values(slice.map((job) => ({ ...job, invitationId, kind })))
      .onConflictDoNothing()
      .returning({ id: waJob.id });
    added += rows.length;
  }
  return added;
}

export async function claimNextJob(
  db: AppDb,
  skipInvitations: readonly string[] = [],
  senderUserId?: string,
): Promise<ClaimedJob | null> {
  return db.transaction(async (tx) => {
    const [next] = await tx
      .select({ id: waJob.id })
      .from(waJob)
      .where(
        and(
          eq(waJob.status, "menunggu"),
          senderUserId ? eq(waJob.senderUserId, senderUserId) : undefined,
          skipInvitations.length > 0 ? notInArray(waJob.invitationId, [...skipInvitations]) : undefined,
        ),
      )
      .orderBy(asc(waJob.createdAt), asc(waJob.id))
      .limit(1)
      .for("update", { skipLocked: true });
    if (!next) return null;
    const [row] = await tx
      .update(waJob)
      .set({ status: "mengirim" })
      .where(eq(waJob.id, next.id))
      .returning({
        id: waJob.id,
        invitationId: waJob.invitationId,
        guestId: waJob.guestId,
        kind: waJob.kind,
        phone: waJob.phone,
        message: waJob.message,
        posterId: waJob.posterId,
        senderUserId: waJob.senderUserId,
        createdAt: waJob.createdAt,
      });
    return row ?? null;
  });
}

export async function finishJob(
  db: AppDb,
  job: ClaimedJob,
  result: JobResult,
  now: Date = new Date(),
): Promise<void> {
  await db.transaction(async (tx) => {
    if ("skipped" in result) {
      await tx
        .update(waJob)
        .set({ status: "dibatalkan", error: result.skipped, processedAt: now })
        .where(eq(waJob.id, job.id));
      return;
    }
    if (!result.ok) {
      await tx
        .update(waJob)
        .set({ status: "gagal", error: result.error.slice(0, 300), processedAt: now })
        .where(eq(waJob.id, job.id));
      return;
    }
    await tx
      .update(waJob)
      .set({ status: "terkirim", error: null, processedAt: now })
      .where(eq(waJob.id, job.id));
    if (job.kind === "undangan") await markSent(tx, job.invitationId, job.guestId, now);
    else await markReminded(tx, job.invitationId, job.guestId, now);
  });
}

export async function isAlreadyHandled(db: AppDb, job: ClaimedJob): Promise<boolean> {
  const [row] = await db
    .select({ sentAt: guest.sentAt, lastRemindedAt: guest.lastRemindedAt })
    .from(guest)
    .where(eq(guest.id, job.guestId));
  if (!row) return true;
  if (job.kind === "undangan") return row.sentAt !== null;
  return row.lastRemindedAt !== null && row.lastRemindedAt >= job.createdAt;
}

export async function cancelPending(db: AppDb, invitationId: string, senderUserId?: string): Promise<number> {
  const rows = await db
    .update(waJob)
    .set({ status: "dibatalkan", error: "Dibatalkan oleh pengguna", processedAt: new Date() })
    .where(and(eq(waJob.invitationId, invitationId), eq(waJob.status, "menunggu"), senderUserId ? eq(waJob.senderUserId, senderUserId) : undefined))
    .returning({ id: waJob.id });
  return rows.length;
}

export async function recoverInterrupted(db: AppDb): Promise<number> {
  const rows = await db
    .update(waJob)
    .set({
      status: "gagal",
      error: "Terputus saat dikirim. Periksa dulu di WhatsApp sebelum mengirim ulang",
      processedAt: new Date(),
    })
    .where(eq(waJob.status, "mengirim"))
    .returning({ id: waJob.id });
  return rows.length;
}

export async function sentLastDay(
  db: AppDb,
  invitationId: string,
  now: Date = new Date(),
): Promise<number> {
  const since = new Date(now.getTime() - DAY_MS);
  const [row] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(waJob)
    .where(
      and(
        eq(waJob.status, "terkirim"),
        eq(waJob.invitationId, invitationId),
        gte(waJob.processedAt, since),
      ),
    );
  return row?.total ?? 0;
}

export async function senderSentLastDay(db: AppDb, senderUserId: string, now: Date = new Date()): Promise<number> {
  const since = new Date(now.getTime() - DAY_MS);
  const [row] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(waJob)
    .where(and(eq(waJob.status, "terkirim"), eq(waJob.senderUserId, senderUserId), gte(waJob.processedAt, since)));
  return row?.total ?? 0;
}

export async function invitationsAtLimit(
  db: AppDb,
  limit: number,
  now: Date = new Date(),
): Promise<string[]> {
  const since = new Date(now.getTime() - DAY_MS);
  const rows = await db
    .select({ invitationId: waJob.invitationId })
    .from(waJob)
    .where(and(eq(waJob.status, "terkirim"), gte(waJob.processedAt, since)))
    .groupBy(waJob.invitationId)
    .having(sql`count(*) >= ${limit}`);
  return rows.map((row) => row.invitationId);
}

export async function hasWaitingJobs(db: AppDb, senderUserId?: string): Promise<boolean> {
  const [row] = await db
    .select({ id: waJob.id })
    .from(waJob)
    .where(and(eq(waJob.status, "menunggu"), senderUserId ? eq(waJob.senderUserId, senderUserId) : undefined))
    .limit(1);
  return row !== undefined;
}

async function summarize(
  db: AppDb,
  invitationId: string | null,
  now: Date,
  senderUserId?: string,
): Promise<QueueSummary> {
  const since = new Date(now.getTime() - DAY_MS);
  const rows = await db
    .select({ status: waJob.status, total: sql<number>`count(*)::int` })
    .from(waJob)
    .where(
      and(
        invitationId ? eq(waJob.invitationId, invitationId) : undefined,
        senderUserId ? eq(waJob.senderUserId, senderUserId) : undefined,
        sql`(${waJob.status} in ('menunggu', 'mengirim') or ${waJob.createdAt} >= ${since.toISOString()}::timestamptz)`,
      ),
    )
    .groupBy(waJob.status);
  const count = (status: string) => rows.find((row) => row.status === status)?.total ?? 0;
  return {
    menunggu: count("menunggu"),
    mengirim: count("mengirim"),
    terkirim: count("terkirim"),
    gagal: count("gagal"),
  };
}

export function invitationSummary(db: AppDb, invitationId: string, now: Date = new Date(), senderUserId?: string) {
  return summarize(db, invitationId, now, senderUserId);
}

export function senderSummary(db: AppDb, senderUserId: string, now: Date = new Date()) {
  return summarize(db, null, now, senderUserId);
}

export function platformSummary(db: AppDb, now: Date = new Date()) {
  return summarize(db, null, now);
}

export async function queuedGuestIds(
  db: AppDb,
  invitationId: string,
  kind: JobKind,
): Promise<Set<string>> {
  const rows = await db
    .select({ guestId: waJob.guestId })
    .from(waJob)
    .where(
      and(
        eq(waJob.invitationId, invitationId),
        eq(waJob.kind, kind),
        inArray(waJob.status, ["menunggu", "mengirim"]),
      ),
    );
  return new Set(rows.map((row) => row.guestId));
}

export type FailureRow = {
  id: string;
  guestName: string;
  phone: string;
  eventTitle: string;
  error: string;
  at: Date | null;
};

export async function recentFailures(
  db: AppDb,
  options: { invitationId?: string; senderUserId?: string; limit?: number } = {},
): Promise<FailureRow[]> {
  const rows = await db
    .select({
      id: waJob.id,
      guestName: guest.name,
      phone: waJob.phone,
      title: invitation.title,
      error: waJob.error,
      at: waJob.processedAt,
    })
    .from(waJob)
    .innerJoin(guest, eq(guest.id, waJob.guestId))
    .innerJoin(invitation, eq(invitation.id, waJob.invitationId))
    .where(
      and(
        eq(waJob.status, "gagal"),
        options.invitationId ? eq(waJob.invitationId, options.invitationId) : undefined,
        options.senderUserId ? eq(waJob.senderUserId, options.senderUserId) : undefined,
      ),
    )
    .orderBy(desc(waJob.processedAt))
    .limit(options.limit ?? 10);
  return rows.map((row) => ({
    id: row.id,
    guestName: row.guestName,
    phone: row.phone,
    eventTitle: row.title,
    error: row.error ?? "Gagal dikirim",
    at: row.at,
  }));
}
