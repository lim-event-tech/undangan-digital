import { and, asc, eq, inArray } from "drizzle-orm";
import sharp from "sharp";
import { invitation, photo } from "@/db/schema";
import type { AppDb } from "@/db/types";
import {
  MAX_GALLERY_PHOTOS,
  MAX_PHOTO_BYTES,
  sniffImageType,
  type ImageType,
} from "@/lib/images";

export type PhotoKind = "cover" | "galeri" | "logo_penyelenggara" | "logo_eo";

export const SINGLE_PHOTO_KINDS: readonly PhotoKind[] = ["cover", "logo_penyelenggara", "logo_eo"];

export type PhotoInfo = {
  id: string;
  kind: PhotoKind;
  sortOrder: number;
  fileName: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
};

export type AddPhotoResult =
  | { ok: true; photo: PhotoInfo }
  | { ok: false; error: "penuh" | "format" | "terlalu-besar" | "kosong" };

const INFO_COLUMNS = {
  id: photo.id,
  kind: photo.kind,
  sortOrder: photo.sortOrder,
  fileName: photo.fileName,
  sizeBytes: photo.sizeBytes,
  width: photo.width,
  height: photo.height,
};

function cleanFileName(name: string): string {
  const cleaned = name.replace(/[^\w.\- ]+/g, "").trim().slice(0, 80);
  return cleaned || "foto";
}

export async function measureImage(bytes: Buffer): Promise<{ width: number; height: number }> {
  try {
    const meta = await sharp(bytes).metadata();
    if (!meta.width || !meta.height) return { width: 0, height: 0 };
    const rotated = (meta.orientation ?? 1) >= 5;
    return rotated ? { width: meta.height, height: meta.width } : { width: meta.width, height: meta.height };
  } catch {
    return { width: 0, height: 0 };
  }
}

async function fillMissingSizes(db: AppDb, rows: PhotoInfo[]): Promise<PhotoInfo[]> {
  const missing = rows.filter((r) => r.width === null || r.height === null).map((r) => r.id);
  if (missing.length === 0) return rows;
  const stored = await db
    .select({ id: photo.id, data: photo.data })
    .from(photo)
    .where(inArray(photo.id, missing));
  const sizes = new Map<string, { width: number; height: number }>();
  for (const row of stored) {
    const size = await measureImage(row.data);
    sizes.set(row.id, size);
    await db.update(photo).set(size).where(eq(photo.id, row.id));
  }
  return rows.map((r) => {
    const size = sizes.get(r.id);
    return size ? { ...r, ...size } : r;
  });
}

export async function listPhotos(
  db: AppDb,
  invitationId: string,
): Promise<PhotoInfo[]> {
  const rows = await db
    .select(INFO_COLUMNS)
    .from(photo)
    .where(eq(photo.invitationId, invitationId))
    .orderBy(asc(photo.sortOrder), asc(photo.createdAt));
  return fillMissingSizes(db, rows);
}

export async function addPhoto(
  db: AppDb,
  invitationId: string,
  input: { kind: PhotoKind; fileName: string; bytes: Buffer },
): Promise<AddPhotoResult> {
  if (input.kind !== "cover" && input.kind !== "galeri" && input.kind !== "logo_penyelenggara" && input.kind !== "logo_eo") {
    return { ok: false, error: "format" };
  }
  if (input.bytes.length === 0) return { ok: false, error: "kosong" };
  if (input.bytes.length > MAX_PHOTO_BYTES) {
    return { ok: false, error: "terlalu-besar" };
  }
  const contentType: ImageType | null = sniffImageType(input.bytes);
  if (!contentType) return { ok: false, error: "format" };
  const size = await measureImage(input.bytes);

  return db.transaction(async (tx) => {
    await tx
      .select({ id: invitation.id })
      .from(invitation)
      .where(eq(invitation.id, invitationId))
      .for("update");

    let sortOrder = 0;
    if (SINGLE_PHOTO_KINDS.includes(input.kind)) {
      await tx
        .delete(photo)
        .where(and(eq(photo.invitationId, invitationId), eq(photo.kind, input.kind)));
    } else {
      const existing = await tx
        .select({ sortOrder: photo.sortOrder })
        .from(photo)
        .where(and(eq(photo.invitationId, invitationId), eq(photo.kind, "galeri")));
      if (existing.length >= MAX_GALLERY_PHOTOS) {
        return { ok: false, error: "penuh" } as const;
      }
      sortOrder = existing.reduce((max, p) => Math.max(max, p.sortOrder), -1) + 1;
    }

    const [created] = await tx
      .insert(photo)
      .values({
        invitationId,
        kind: input.kind,
        sortOrder,
        fileName: cleanFileName(input.fileName),
        contentType,
        sizeBytes: input.bytes.length,
        ...size,
        data: input.bytes,
      })
      .returning(INFO_COLUMNS);
    return { ok: true, photo: created } as const;
  });
}

export async function deletePhoto(
  db: AppDb,
  invitationId: string,
  photoId: string,
): Promise<boolean> {
  const rows = await db
    .delete(photo)
    .where(and(eq(photo.id, photoId), eq(photo.invitationId, invitationId)))
    .returning({ id: photo.id });
  return rows.length > 0;
}

export async function getCoverData(db: AppDb, photoId: string): Promise<Buffer | null> {
  const [row] = await db
    .select({ data: photo.data })
    .from(photo)
    .where(and(eq(photo.id, photoId), eq(photo.kind, "cover")))
    .limit(1);
  return row?.data ?? null;
}

export async function getPhotoData(
  db: AppDb,
  photoId: string,
): Promise<{ contentType: string; data: Buffer } | null> {
  const [row] = await db
    .select({ contentType: photo.contentType, data: photo.data })
    .from(photo)
    .where(eq(photo.id, photoId))
    .limit(1);
  return row ?? null;
}
