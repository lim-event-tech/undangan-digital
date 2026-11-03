import { and, eq, isNotNull, sql } from "drizzle-orm";
import { guest, invitation } from "@/db/schema";
import type { AppDb } from "@/db/types";
import { isUniqueViolation } from "@/lib/db-errors";
import { listEventDetails, type EventDetail } from "@/lib/events/service";
import { listPhotos, type PhotoInfo } from "@/lib/photos/service";
import type { InvitationContent } from "./content";

export type MissingItem = { id: string; label: string; anchor: string };

export async function saveMempelai(
  db: AppDb,
  invitationId: string,
  input: {
    groomName: string;
    brideName: string;
    pria: InvitationContent["pria"];
    wanita: InvitationContent["wanita"];
  },
): Promise<boolean> {
  const patch = JSON.stringify({ pria: input.pria, wanita: input.wanita });
  const rows = await db
    .update(invitation)
    .set({
      groomName: input.groomName,
      brideName: input.brideName,
      content: sql`${invitation.content} || ${patch}::jsonb`,
    })
    .where(eq(invitation.id, invitationId))
    .returning({ id: invitation.id });
  return rows.length > 0;
}

export async function saveContentText(
  db: AppDb,
  invitationId: string,
  patch: Partial<Omit<InvitationContent, "pria" | "wanita">>,
): Promise<boolean> {
  const rows = await db
    .update(invitation)
    .set({ content: sql`${invitation.content} || ${JSON.stringify(patch)}::jsonb` })
    .where(eq(invitation.id, invitationId))
    .returning({ id: invitation.id });
  return rows.length > 0;
}

export async function saveRsvpSettings(
  db: AppDb,
  invitationId: string,
  input: { deadline: Date | null; maxAdults: number; maxChildren: number },
): Promise<boolean> {
  const rows = await db
    .update(invitation)
    .set({
      rsvpDeadline: input.deadline,
      defaultMaxAdults: input.maxAdults,
      defaultMaxChildren: input.maxChildren,
    })
    .where(eq(invitation.id, invitationId))
    .returning({ id: invitation.id });
  return rows.length > 0;
}

export type ChangeSlugResult =
  | { ok: true; slug: string }
  | { ok: false; reason: "terkunci" | "dipakai" | "tidak-ada" };

export async function changeSlug(
  db: AppDb,
  invitationId: string,
  slug: string,
  options: { ignoreLock?: boolean } = {},
): Promise<ChangeSlugResult> {
  try {
    return await db.transaction(async (tx): Promise<ChangeSlugResult> => {
      const [current] = await tx
        .select({ slug: invitation.slug })
        .from(invitation)
        .where(eq(invitation.id, invitationId))
        .for("update");
      if (!current) return { ok: false, reason: "tidak-ada" };
      if (current.slug === slug) return { ok: true, slug };

      const [sent] = await tx
        .select({ id: guest.id })
        .from(guest)
        .where(and(eq(guest.invitationId, invitationId), isNotNull(guest.sentAt)))
        .limit(1);
      if (sent && !options.ignoreLock) return { ok: false, reason: "terkunci" };

      const [taken] = await tx
        .select({ id: invitation.id })
        .from(invitation)
        .where(eq(invitation.slug, slug))
        .limit(1);
      if (taken) return { ok: false, reason: "dipakai" };

      await tx.update(invitation).set({ slug }).where(eq(invitation.id, invitationId));
      return { ok: true, slug };
    });
  } catch (error) {
    if (isUniqueViolation(error)) return { ok: false, reason: "dipakai" };
    throw error;
  }
}

export async function isSlugLocked(db: AppDb, invitationId: string): Promise<boolean> {
  const [sent] = await db
    .select({ id: guest.id })
    .from(guest)
    .where(and(eq(guest.invitationId, invitationId), isNotNull(guest.sentAt)))
    .limit(1);
  return Boolean(sent);
}

export function findMissing(
  events: EventDetail[],
  photos: PhotoInfo[],
): MissingItem[] {
  const missing: MissingItem[] = [];
  if (!photos.some((p) => p.kind === "cover")) {
    missing.push({ id: "cover", label: "Foto cover", anchor: "sampul" });
  }
  for (const e of events) {
    const anchor = `acara-${e.id}`;
    if (!e.date) {
      missing.push({ id: `tanggal-${e.id}`, label: `Tanggal ${e.name}`, anchor });
    }
    if (!e.time) {
      missing.push({ id: `jam-${e.id}`, label: `Jam ${e.name}`, anchor });
    }
    if (!e.mapsUrl) {
      missing.push({ id: `maps-${e.id}`, label: `Link Maps ${e.name}`, anchor });
    }
  }
  return missing;
}

export async function getMissingForPublish(
  db: AppDb,
  invitationId: string,
): Promise<MissingItem[]> {
  const [events, photos] = await Promise.all([
    listEventDetails(db, invitationId),
    listPhotos(db, invitationId),
  ]);
  return findMissing(events, photos);
}

export type PublishResult =
  | { ok: true }
  | { ok: false; reason: "ditangguhkan" }
  | { ok: false; reason: "belum-lengkap"; missing: MissingItem[] }
  | { ok: false; reason: "tidak-ada" };

export async function publishInvitation(
  db: AppDb,
  invitationId: string,
): Promise<PublishResult> {
  const [current] = await db
    .select({ status: invitation.status })
    .from(invitation)
    .where(eq(invitation.id, invitationId));
  if (!current) return { ok: false, reason: "tidak-ada" };
  if (current.status === "ditangguhkan") return { ok: false, reason: "ditangguhkan" };

  const missing = await getMissingForPublish(db, invitationId);
  if (missing.length > 0) return { ok: false, reason: "belum-lengkap", missing };

  await db
    .update(invitation)
    .set({ status: "terbit" })
    .where(and(eq(invitation.id, invitationId), eq(invitation.status, "draf")));
  return { ok: true };
}

export async function unpublishInvitation(
  db: AppDb,
  invitationId: string,
): Promise<boolean> {
  const rows = await db
    .update(invitation)
    .set({ status: "draf" })
    .where(and(eq(invitation.id, invitationId), eq(invitation.status, "terbit")))
    .returning({ id: invitation.id });
  return rows.length > 0;
}

export async function deleteInvitation(
  db: AppDb,
  invitationId: string,
  ownerId: string,
): Promise<boolean> {
  const rows = await db
    .delete(invitation)
    .where(and(eq(invitation.id, invitationId), eq(invitation.ownerId, ownerId)))
    .returning({ id: invitation.id });
  return rows.length > 0;
}
