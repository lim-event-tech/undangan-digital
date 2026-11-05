import { eq } from "drizzle-orm";
import sharp from "sharp";
import { beforeAll, describe, expect, it } from "vitest";
import { photo } from "@/db/schema";
import { MAX_GALLERY_PHOTOS, MAX_PHOTO_BYTES } from "@/lib/images";
import { createTestDb, seedInvitation, type TestDb } from "@/test/db";
import { addPhoto, deletePhoto, getCoverData, getPhotoData, listPhotos } from "./service";

let db: TestDb;

beforeAll(async () => {
  db = await createTestDb();
});

function jpeg(size = 64, fill = 7): Buffer {
  const bytes = Buffer.alloc(size, fill);
  bytes[0] = 0xff;
  bytes[1] = 0xd8;
  bytes[2] = 0xff;
  return bytes;
}

describe("addPhoto", () => {
  it.each(["pria", "wanita", "lainnya"])("menolak jenis foto yang tidak lagi didukung: %s", async (kind) => {
    const { invitation } = await seedInvitation(db);
    expect(await addPhoto(db, invitation.id, { kind: kind as never, fileName: "foto.jpg", bytes: jpeg() })).toEqual({ ok: false, error: "format" });
    expect(await listPhotos(db, invitation.id)).toEqual([]);
  });
  it("menyimpan foto dan mengembalikan isinya persis sama", async () => {
    const { invitation } = await seedInvitation(db);
    const bytes = jpeg(2048, 42);
    const added = await addPhoto(db, invitation.id, {
      kind: "galeri",
      fileName: "kegiatan.jpg",
      bytes,
    });
    expect(added.ok).toBe(true);
    if (!added.ok) return;
    expect(added.photo).toMatchObject({
      kind: "galeri",
      sortOrder: 0,
      fileName: "kegiatan.jpg",
      sizeBytes: 2048,
    });

    const stored = await getPhotoData(db, added.photo.id);
    expect(stored?.contentType).toBe("image/jpeg");
    expect(stored?.data.equals(bytes)).toBe(true);
  });

  it("mengganti foto cover lama, hanya satu cover tersisa", async () => {
    const { invitation } = await seedInvitation(db);
    const first = await addPhoto(db, invitation.id, { kind: "cover", fileName: "a.jpg", bytes: jpeg() });
    const second = await addPhoto(db, invitation.id, { kind: "cover", fileName: "b.jpg", bytes: jpeg(80) });
    expect(first.ok && second.ok).toBe(true);

    const covers = (await listPhotos(db, invitation.id)).filter((p) => p.kind === "cover");
    expect(covers).toHaveLength(1);
    expect(covers[0].fileName).toBe("b.jpg");
    if (first.ok) expect(await getPhotoData(db, first.photo.id)).toBeNull();
  });

  it("menerima galeri sampai batas 12 foto lalu menolak foto berikutnya", async () => {
    const { invitation } = await seedInvitation(db);
    for (let i = 0; i < MAX_GALLERY_PHOTOS; i++) {
      const added = await addPhoto(db, invitation.id, {
        kind: "galeri",
        fileName: `foto-${i}.jpg`,
        bytes: jpeg(),
      });
      expect(added.ok).toBe(true);
      if (added.ok) expect(added.photo.sortOrder).toBe(i);
    }
    expect(
      await addPhoto(db, invitation.id, { kind: "galeri", fileName: "ke-13.jpg", bytes: jpeg() }),
    ).toEqual({ ok: false, error: "penuh" });
    expect((await listPhotos(db, invitation.id)).filter((p) => p.kind === "galeri")).toHaveLength(12);
  });

  it("tidak menghitung cover ke dalam batas galeri", async () => {
    const { invitation } = await seedInvitation(db);
    await addPhoto(db, invitation.id, { kind: "cover", fileName: "cover.jpg", bytes: jpeg() });
    for (let i = 0; i < MAX_GALLERY_PHOTOS; i++) {
      const added = await addPhoto(db, invitation.id, { kind: "galeri", fileName: "g.jpg", bytes: jpeg() });
      expect(added.ok).toBe(true);
    }
  });

  it("menolak file kosong, bukan gambar, dan terlalu besar", async () => {
    const { invitation } = await seedInvitation(db);
    expect(
      await addPhoto(db, invitation.id, { kind: "cover", fileName: "x.jpg", bytes: Buffer.alloc(0) }),
    ).toEqual({ ok: false, error: "kosong" });
    expect(
      await addPhoto(db, invitation.id, {
        kind: "cover",
        fileName: "x.jpg",
        bytes: Buffer.from("bukan gambar sama sekali"),
      }),
    ).toEqual({ ok: false, error: "format" });
    expect(
      await addPhoto(db, invitation.id, {
        kind: "cover",
        fileName: "x.jpg",
        bytes: jpeg(MAX_PHOTO_BYTES + 1),
      }),
    ).toEqual({ ok: false, error: "terlalu-besar" });
    expect(await listPhotos(db, invitation.id)).toEqual([]);
  });

  it("membersihkan karakter berbahaya dari nama file", async () => {
    const { invitation } = await seedInvitation(db);
    const added = await addPhoto(db, invitation.id, {
      kind: "galeri",
      fileName: "../../etc/<script>.jpg",
      bytes: jpeg(),
    });
    expect(added.ok && added.photo.fileName).toBe("....etcscript.jpg");
  });
});

describe("getCoverData", () => {
  it("hanya mengembalikan foto cover, tidak foto galeri", async () => {
    const { invitation } = await seedInvitation(db);
    const cover = await addPhoto(db, invitation.id, { kind: "cover", fileName: "c.jpg", bytes: jpeg(100, 1) });
    const gallery = await addPhoto(db, invitation.id, { kind: "galeri", fileName: "g.jpg", bytes: jpeg(100, 2) });
    if (!cover.ok || !gallery.ok) throw new Error("foto gagal ditambah");

    expect((await getCoverData(db, cover.photo.id))?.length).toBe(100);
    expect(await getCoverData(db, gallery.photo.id)).toBeNull();
    expect(await getCoverData(db, "00000000-0000-4000-8000-000000000000")).toBeNull();
  });
});

describe("deletePhoto", () => {
  it("menghapus foto milik undangan sendiri", async () => {
    const { invitation } = await seedInvitation(db);
    const added = await addPhoto(db, invitation.id, { kind: "galeri", fileName: "a.jpg", bytes: jpeg() });
    if (!added.ok) throw new Error("foto gagal ditambah");
    expect(await deletePhoto(db, invitation.id, added.photo.id)).toBe(true);
    expect(await listPhotos(db, invitation.id)).toEqual([]);
  });

  it("tidak menghapus foto milik undangan lain", async () => {
    const owner = await seedInvitation(db);
    const other = await seedInvitation(db);
    const added = await addPhoto(db, owner.invitation.id, { kind: "galeri", fileName: "a.jpg", bytes: jpeg() });
    if (!added.ok) throw new Error("foto gagal ditambah");
    expect(await deletePhoto(db, other.invitation.id, added.photo.id)).toBe(false);
    expect(await listPhotos(db, owner.invitation.id)).toHaveLength(1);
  });
});

describe("addPhoto logo_penyelenggara", () => {
  it("menyimpan satu logo penyelenggara per undangan dan menggantinya tanpa menyentuh cover dan galeri", async () => {
    const { invitation } = await seedInvitation(db);
    await addPhoto(db, invitation.id, { kind: "cover", fileName: "c.jpg", bytes: jpeg() });
    await addPhoto(db, invitation.id, { kind: "galeri", fileName: "g.jpg", bytes: jpeg() });
    const first = await addPhoto(db, invitation.id, { kind: "logo_penyelenggara", fileName: "logo_penyelenggara1.jpg", bytes: jpeg(80, 1) });
    const second = await addPhoto(db, invitation.id, { kind: "logo_penyelenggara", fileName: "logo_penyelenggara2.jpg", bytes: jpeg(90, 2) });
    expect(first.ok && second.ok).toBe(true);

    const kinds = (await listPhotos(db, invitation.id)).map((p) => p.kind).sort();
    expect(kinds).toEqual(["cover", "galeri", "logo_penyelenggara"]);
    const logo_penyelenggara = (await listPhotos(db, invitation.id)).find((p) => p.kind === "logo_penyelenggara");
    expect(logo_penyelenggara?.fileName).toBe("logo_penyelenggara2.jpg");
  });
});

describe("ukuran asli foto", () => {
  const gambar = (width: number, height: number, orientation?: number) => {
    const dasar = sharp({ create: { width, height, channels: 3, background: "#d8c9ac" } }).jpeg();
    return (orientation ? dasar.withMetadata({ orientation }) : dasar).toBuffer();
  };

  it("menyimpan lebar dan tinggi foto saat diunggah, termasuk foto yang diputar EXIF", async () => {
    const { invitation } = await seedInvitation(db);
    const datar = await addPhoto(db, invitation.id, { kind: "galeri", fileName: "datar.jpg", bytes: await gambar(60, 40) });
    const putar = await addPhoto(db, invitation.id, { kind: "galeri", fileName: "putar.jpg", bytes: await gambar(60, 40, 6) });
    expect(datar.ok && datar.photo).toMatchObject({ width: 60, height: 40 });
    expect(putar.ok && putar.photo).toMatchObject({ width: 40, height: 60 });
  });

  it("menandai foto yang tidak bisa dibaca dengan ukuran nol", async () => {
    const { invitation } = await seedInvitation(db);
    const added = await addPhoto(db, invitation.id, { kind: "galeri", fileName: "rusak.jpg", bytes: jpeg() });
    expect(added.ok && added.photo).toMatchObject({ width: 0, height: 0 });
  });

  it("mengukur foto lama yang belum punya ukuran saat daftar foto dibaca", async () => {
    const { invitation } = await seedInvitation(db);
    const bytes = await gambar(50, 80);
    await db.insert(photo).values({
      invitationId: invitation.id,
      kind: "galeri",
      fileName: "lama.jpg",
      contentType: "image/jpeg",
      sizeBytes: bytes.length,
      data: bytes,
    });
    const [lama] = await listPhotos(db, invitation.id);
    expect(lama).toMatchObject({ width: 50, height: 80 });
    const [tersimpan] = await db.select({ width: photo.width, height: photo.height }).from(photo).where(eq(photo.id, lama.id));
    expect(tersimpan).toEqual({ width: 50, height: 80 });
  });
});
