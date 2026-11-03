import { eq } from "drizzle-orm";
import { music } from "@/db/schema";
import type { AppDb } from "@/db/types";
import { MAX_MUSIC_BYTES, sniffAudioType } from "./audio";

export type MusicInfo = { id: string; fileName: string; sizeBytes: number };

export type SetMusicResult =
  | { ok: true; music: MusicInfo }
  | { ok: false; error: "format" | "terlalu-besar" | "kosong" };

const INFO_COLUMNS = {
  id: music.id,
  fileName: music.fileName,
  sizeBytes: music.sizeBytes,
};

function cleanFileName(name: string): string {
  const cleaned = name.replace(/[^\w.\- ]+/g, "").trim().slice(0, 80);
  return cleaned || "musik";
}

export async function getMusic(db: AppDb, invitationId: string): Promise<MusicInfo | null> {
  const [row] = await db
    .select(INFO_COLUMNS)
    .from(music)
    .where(eq(music.invitationId, invitationId))
    .limit(1);
  return row ?? null;
}

export async function setMusic(
  db: AppDb,
  invitationId: string,
  input: { fileName: string; bytes: Buffer },
): Promise<SetMusicResult> {
  if (input.bytes.length === 0) return { ok: false, error: "kosong" };
  if (input.bytes.length > MAX_MUSIC_BYTES) return { ok: false, error: "terlalu-besar" };
  const contentType = sniffAudioType(input.bytes);
  if (!contentType) return { ok: false, error: "format" };

  const values = {
    fileName: cleanFileName(input.fileName),
    contentType,
    sizeBytes: input.bytes.length,
    data: input.bytes,
  };
  const [saved] = await db
    .insert(music)
    .values({ invitationId, ...values })
    .onConflictDoUpdate({ target: music.invitationId, set: { ...values, createdAt: new Date() } })
    .returning(INFO_COLUMNS);
  return { ok: true, music: saved };
}

export async function deleteMusic(db: AppDb, invitationId: string): Promise<boolean> {
  const rows = await db
    .delete(music)
    .where(eq(music.invitationId, invitationId))
    .returning({ id: music.id });
  return rows.length > 0;
}

export async function getMusicData(
  db: AppDb,
  musicId: string,
): Promise<{ contentType: string; data: Buffer } | null> {
  const [row] = await db
    .select({ contentType: music.contentType, data: music.data })
    .from(music)
    .where(eq(music.id, musicId))
    .limit(1);
  return row ?? null;
}
