import { and, eq, sql } from "drizzle-orm";
import { invitation, photo } from "@/db/schema";
import type { AppDb } from "@/db/types";
import { MAX_PHOTO_BYTES, sniffImageType } from "@/lib/images";
import { readContent } from "@/lib/invitations/content";
import { isUuid } from "@/lib/uuid";
import { measureImage, type PhotoInfo } from "./service";

type Result = { ok: true; photo: PhotoInfo | null } | { ok: false; error: "pengisi" | "format" | "terlalu-besar" | "kosong" };

export async function setPengisiPhoto(db: AppDb, invitationId: string, pengisiId: string, input: { fileName: string; bytes: Buffer } | null): Promise<Result> {
  if (!isUuid(pengisiId)) return { ok: false, error: "pengisi" };
  if (input && input.bytes.length === 0) return { ok: false, error: "kosong" };
  if (input && input.bytes.length > MAX_PHOTO_BYTES) return { ok: false, error: "terlalu-besar" };
  const contentType = input ? sniffImageType(input.bytes) : null;
  const size = input ? await measureImage(input.bytes) : null;
  if (input && (!contentType || !size?.width || !size.height)) return { ok: false, error: "format" };
  return db.transaction(async tx => {
    const [current] = await tx.select({ content: invitation.content }).from(invitation).where(eq(invitation.id, invitationId)).for("update");
    if (!current) return { ok: false, error: "pengisi" };
    const items = readContent(current.content).pengisiAcara;
    const index = items.findIndex(item => item.id === pengisiId);
    const item = items[index];
    if (!item) return { ok: false, error: "pengisi" };
    if (item.fotoId) await tx.delete(photo).where(and(eq(photo.id, item.fotoId), eq(photo.invitationId, invitationId), eq(photo.kind, "pengisi_acara")));
    let saved: PhotoInfo | null = null;
    if (input && contentType && size) {
      const [created] = await tx.insert(photo).values({ invitationId, kind: "pengisi_acara", sortOrder: index, fileName: input.fileName.replace(/[^\w.\- ]+/g, "").trim().slice(0, 80) || "foto-pengisi", contentType, sizeBytes: input.bytes.length, width: size.width, height: size.height, data: input.bytes }).returning({ id: photo.id, kind: photo.kind, sortOrder: photo.sortOrder, fileName: photo.fileName, sizeBytes: photo.sizeBytes, width: photo.width, height: photo.height });
      saved = created;
    }
    items[index] = { ...item, fotoId: saved?.id };
    await tx.update(invitation).set({ content: sql`${invitation.content} || ${JSON.stringify({ pengisiAcara: items })}::jsonb` }).where(eq(invitation.id, invitationId));
    return { ok: true, photo: saved };
  });
}
