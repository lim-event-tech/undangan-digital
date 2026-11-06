import { and, eq, inArray, isNotNull, sql } from "drizzle-orm";
import { guest, invitation, photo } from "@/db/schema";
import type { AppDb } from "@/db/types";
import { isUniqueViolation } from "@/lib/db-errors";
import { listEventDetails, type EventDetail } from "@/lib/events/service";
import { listPhotos, type PhotoInfo } from "@/lib/photos/service";
import { readContent, type InvitationContent } from "./content";
import { parseInvitationTitle } from "./title";

export type MissingItem = { id: string; label: string; anchor: string };

export async function saveTitle(db: AppDb, invitationId: string, input: { title: string }): Promise<boolean> {
  const parsed = parseInvitationTitle(input.title);
  if (!parsed.ok) return false;
  const rows = await db.update(invitation).set({ title: parsed.title }).where(eq(invitation.id, invitationId)).returning({ id: invitation.id });
  return rows.length > 0;
}

export async function saveContentText(
  db: AppDb,
  invitationId: string,
  patch: Partial<InvitationContent>,
): Promise<boolean> {
  if (patch.pengisiAcara) {
    return db.transaction(async tx => {
      const [current] = await tx.select({ content: invitation.content }).from(invitation).where(eq(invitation.id, invitationId)).for("update");
      if (!current) return false;
      const old = readContent(current.content).pengisiAcara;
      const next = patch.pengisiAcara!.map(({ id, nama, peran, instansi, profil }) => {
        const fields = { id, nama, peran, instansi, profil };
        const fotoId = old.find(row => row.id === id)?.fotoId;
        return { ...fields, ...(fotoId ? { fotoId } : {}) };
      });
      const removed = old.filter(item => !next.some(row => row.id === item.id)).flatMap(item => item.fotoId ? [item.fotoId] : []);
      if (removed.length) await tx.delete(photo).where(and(eq(photo.invitationId, invitationId), eq(photo.kind, "pengisi_acara"), inArray(photo.id, removed)));
      await tx.update(invitation).set({ content: sql`${invitation.content} || ${JSON.stringify({ ...patch, pengisiAcara: next })}::jsonb` }).where(eq(invitation.id, invitationId));
      return true;
    });
  }
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
  input: { deadline: Date | null; maxAttendees: number },
): Promise<boolean> {
  const rows = await db
    .update(invitation)
    .set({
      rsvpDeadline: input.deadline,
      defaultMaxAttendees: input.maxAttendees,
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
  identity: { title: string; content: unknown },
): MissingItem[] {
  const missing: MissingItem[] = [];
  if (!parseInvitationTitle(identity.title).ok) missing.push({ id: "title", label: "Nama event", anchor: "identitas-event" });
  if (!readContent(identity.content).penyelenggara.nama.trim()) missing.push({ id: "penyelenggara", label: "Nama penyelenggara", anchor: "penyelenggara" });
  if (!events.length) missing.push({ id: "acara", label: "Minimal satu sesi acara", anchor: "acara" });
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
  const [events, photos, identity] = await Promise.all([
    listEventDetails(db, invitationId),
    listPhotos(db, invitationId),
    db.select({ title: invitation.title, content: invitation.content }).from(invitation).where(eq(invitation.id, invitationId)),
  ]);
  return findMissing(events, photos, identity[0] ?? { title: "", content: {} });
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
