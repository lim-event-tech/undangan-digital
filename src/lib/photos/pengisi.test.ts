import { eq } from "drizzle-orm";
import sharp from "sharp";
import { beforeAll, describe, expect, it } from "vitest";
import { invitation } from "@/db/schema";
import { MAX_PHOTO_BYTES } from "@/lib/images";
import { readContent, type PengisiAcara } from "@/lib/invitations/content";
import { saveContentText } from "@/lib/invitations/editor";
import { createTestDb, seedInvitation, type TestDb } from "@/test/db";
import { getPhotoData, listPhotos } from "./service";
import { setPengisiPhoto } from "./pengisi";

let db: TestDb;
let bytes: Buffer;
const A = "10000000-0000-4000-8000-000000000001";
const B = "10000000-0000-4000-8000-000000000002";
const pengisi = (id: string, nama = "Narasumber"): PengisiAcara => ({ id, nama, peran: "Pembicara", instansi: "", profil: "" });
beforeAll(async () => {
  db = await createTestDb();
  bytes = await sharp({ create: { width: 24, height: 40, channels: 4, background: { r: 20, g: 80, b: 40, alpha: .3 } } }).png().toBuffer();
});
const upload = (target: string, id = A) => setPengisiPhoto(db, target, id, { fileName: "pengisi.png", bytes });
async function content(id: string) {
  const [row] = await db.select({ content: invitation.content }).from(invitation).where(eq(invitation.id, id));
  return readContent(row.content);
}
async function target() {
  const { invitation: item } = await seedInvitation(db);
  await saveContentText(db, item.id, { pengisiAcara: [pengisi(A), pengisi(B, "Moderator")] });
  return item.id;
}

describe("foto pengisi acara", () => {
  it("menyimpan PNG transparan tanpa mengubah byte atau rasio, dan menghubungkannya hanya ke pengisi yang dipilih", async () => {
    const id = await target();
    const result = await upload(id);
    expect(result.ok).toBe(true);
    if (!result.ok || !result.photo) return;
    expect(result.photo).toMatchObject({ kind: "pengisi_acara", width: 24, height: 40 });
    expect((await getPhotoData(db, result.photo.id))?.data.equals(bytes)).toBe(true);
    expect((await content(id)).pengisiAcara[0].fotoId).toBe(result.photo.id);
    expect((await content(id)).pengisiAcara[1].fotoId).toBeUndefined();
  });

  it("mengisolasi dua undangan walaupun ID pengisi sama dan menolak target yang tidak ada", async () => {
    const a = await target(), b = await target();
    const first = await upload(a), second = await upload(b);
    expect(first.ok && second.ok && first.photo?.id !== second.photo?.id).toBe(true);
    expect(await upload(a, "10000000-0000-4000-8000-000000000003")).toEqual({ ok: false, error: "pengisi" });
    expect((await listPhotos(db, a)).map(p => p.id)).toEqual(first.ok ? [first.photo?.id] : []);
    expect((await listPhotos(db, b)).map(p => p.id)).toEqual(second.ok ? [second.photo?.id] : []);
  });

  it("mengganti foto atomik dan autosave lama tidak mengembalikan foto yang sudah diganti atau menerima foto asing", async () => {
    const id = await target(), other = await target();
    const first = await upload(id), second = await upload(id), foreign = await upload(other);
    if (!first.ok || !second.ok || !foreign.ok || !first.photo || !second.photo || !foreign.photo) throw Error("Unggah gagal");
    expect(await getPhotoData(db, first.photo.id)).toBeNull();
    await saveContentText(db, id, { pengisiAcara: [{ ...pengisi(B), fotoId: foreign.photo.id }, { ...pengisi(A, "Nama baru"), fotoId: first.photo.id }] });
    const saved = (await content(id)).pengisiAcara;
    expect(saved[0].fotoId).toBeUndefined();
    expect(saved[1]).toMatchObject({ nama: "Nama baru", fotoId: second.photo.id });
    expect((await listPhotos(db, id)).map(p => p.id)).toEqual([second.photo.id]);
  });

  it("menghapus foto tanpa menghapus profil, dan menghapus baris membersihkan foto miliknya saja", async () => {
    const id = await target();
    const first = await upload(id), second = await upload(id, B);
    if (!first.ok || !second.ok || !first.photo || !second.photo) throw Error("Unggah gagal");
    expect(await setPengisiPhoto(db, id, A, null)).toEqual({ ok: true, photo: null });
    expect((await content(id)).pengisiAcara).toHaveLength(2);
    expect((await content(id)).pengisiAcara[0].fotoId).toBeUndefined();
    expect(await getPhotoData(db, first.photo.id)).toBeNull();
    await saveContentText(db, id, { pengisiAcara: [pengisi(A)] });
    expect(await getPhotoData(db, second.photo.id)).toBeNull();
    expect(await listPhotos(db, id)).toEqual([]);
  });

  it("unggahan bersamaan tidak meninggalkan foto yatim dan tidak menimpa suntingan nama", async () => {
    const id = await target();
    await Promise.all([upload(id), saveContentText(db, id, { pengisiAcara: [pengisi(A, "Nama tersimpan"), pengisi(B)] }), upload(id)]);
    const saved = (await content(id)).pengisiAcara[0];
    expect(saved.nama).toBe("Nama tersimpan");
    expect((await listPhotos(db, id)).map(p => p.id)).toEqual([saved.fotoId]);
  });

  it("menolak berkas rusak, kosong, terlalu besar dan ID rusak tanpa menghapus foto lama", async () => {
    const id = await target();
    const result = await upload(id);
    expect(await setPengisiPhoto(db, id, "rusak", { fileName: "x.png", bytes })).toEqual({ ok: false, error: "pengisi" });
    expect(await setPengisiPhoto(db, id, A, { fileName: "x.png", bytes: Buffer.alloc(0) })).toEqual({ ok: false, error: "kosong" });
    expect(await setPengisiPhoto(db, id, A, { fileName: "x.png", bytes: Buffer.from("bukan foto") })).toEqual({ ok: false, error: "format" });
    expect(await setPengisiPhoto(db, id, A, { fileName: "x.png", bytes: Buffer.alloc(MAX_PHOTO_BYTES + 1) })).toEqual({ ok: false, error: "terlalu-besar" });
    expect((await listPhotos(db, id)).map(p => p.id)).toEqual(result.ok ? [result.photo?.id] : []);
  });
});
