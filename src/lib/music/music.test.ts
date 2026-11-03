import { beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { invitation, music } from "@/db/schema";
import { createTestDb, seedInvitation, type TestDb } from "@/test/db";
import { MAX_MUSIC_BYTES, parseRange, sniffAudioType } from "./audio";
import { deleteMusic, getMusic, getMusicData, setMusic } from "./service";

let db: TestDb;

beforeAll(async () => {
  db = await createTestDb();
});

function mp3(size = 128, fill = 5): Buffer {
  const bytes = Buffer.alloc(size, fill);
  bytes[0] = 0x49;
  bytes[1] = 0x44;
  bytes[2] = 0x33;
  return bytes;
}

describe("sniffAudioType", () => {
  it("mengenali MP3 (ID3 dan frame), M4A, dan OGG dari byte awal", () => {
    expect(sniffAudioType(Buffer.from([0x49, 0x44, 0x33, 0x04]))).toBe("audio/mpeg");
    expect(sniffAudioType(Buffer.from([0xff, 0xfb, 0x90, 0x00]))).toBe("audio/mpeg");
    expect(sniffAudioType(Buffer.from([0, 0, 0, 0x20, 0x66, 0x74, 0x79, 0x70, 0x4d, 0x34, 0x41]))).toBe(
      "audio/mp4",
    );
    expect(sniffAudioType(Buffer.from("OggS\u0000", "latin1"))).toBe("audio/ogg");
  });

  it("menolak file lain", () => {
    expect(sniffAudioType(Buffer.from("<html></html>"))).toBeNull();
    expect(sniffAudioType(Buffer.from([0xff, 0xd8, 0xff, 0xe0]))).toBeNull();
    expect(sniffAudioType(Buffer.alloc(0))).toBeNull();
  });
});

describe("parseRange", () => {
  it("tanpa header berarti seluruh berkas", () => {
    expect(parseRange(null, 100)).toBeNull();
  });

  it("membaca rentang awal-akhir, awal-saja, dan akhiran", () => {
    expect(parseRange("bytes=0-9", 100)).toEqual({ start: 0, end: 9 });
    expect(parseRange("bytes=50-", 100)).toEqual({ start: 50, end: 99 });
    expect(parseRange("bytes=-10", 100)).toEqual({ start: 90, end: 99 });
    expect(parseRange("bytes=90-500", 100)).toEqual({ start: 90, end: 99 });
    expect(parseRange("bytes=-500", 100)).toEqual({ start: 0, end: 99 });
  });

  it("menolak rentang yang tidak valid", () => {
    for (const header of ["bytes=100-", "bytes=10-5", "bytes=-", "bytes=abc", "items=0-1", "bytes=-0", "bytes=0-1,5-6"]) {
      expect(parseRange(header, 100), header).toBe("tidak-valid");
    }
    expect(parseRange("bytes=0-1", 0)).toBe("tidak-valid");
  });
});

describe("setMusic", () => {
  it("menyimpan musik persis sama dan menggantinya tanpa menambah baris", async () => {
    const { invitation: created } = await seedInvitation(db);
    const first = await setMusic(db, created.id, { fileName: "lagu kami.mp3", bytes: mp3(256, 9) });
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    expect(first.music).toMatchObject({ fileName: "lagu kami.mp3", sizeBytes: 256 });

    const stored = await getMusicData(db, first.music.id);
    expect(stored?.contentType).toBe("audio/mpeg");
    expect(stored?.data.equals(mp3(256, 9))).toBe(true);

    const second = await setMusic(db, created.id, { fileName: "baru.mp3", bytes: mp3(64) });
    expect(second.ok).toBe(true);
    expect(await db.select().from(music).where(eq(music.invitationId, created.id))).toHaveLength(1);
    expect((await getMusic(db, created.id))?.fileName).toBe("baru.mp3");
  });

  it("menolak file kosong, bukan musik, atau terlalu besar", async () => {
    const { invitation: created } = await seedInvitation(db);
    expect(await setMusic(db, created.id, { fileName: "a.mp3", bytes: Buffer.alloc(0) })).toEqual({
      ok: false,
      error: "kosong",
    });
    expect(await setMusic(db, created.id, { fileName: "a.mp3", bytes: Buffer.from("bukan musik") })).toEqual({
      ok: false,
      error: "format",
    });
    expect(
      await setMusic(db, created.id, { fileName: "a.mp3", bytes: mp3(MAX_MUSIC_BYTES + 1) }),
    ).toEqual({ ok: false, error: "terlalu-besar" });
    expect(await getMusic(db, created.id)).toBeNull();
  });

  it("hanya menghapus musik milik undangan itu dan ikut terhapus bersama undangan", async () => {
    const mine = await seedInvitation(db);
    const other = await seedInvitation(db);
    await setMusic(db, mine.invitation.id, { fileName: "a.mp3", bytes: mp3() });
    await setMusic(db, other.invitation.id, { fileName: "b.mp3", bytes: mp3() });

    expect(await deleteMusic(db, mine.invitation.id)).toBe(true);
    expect(await deleteMusic(db, mine.invitation.id)).toBe(false);
    expect(await getMusic(db, other.invitation.id)).not.toBeNull();

    await db.delete(invitation).where(eq(invitation.id, other.invitation.id));
    expect(await db.select().from(music).where(eq(music.invitationId, other.invitation.id))).toHaveLength(0);
  });
});
