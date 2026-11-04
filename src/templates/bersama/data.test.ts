import { describe, expect, it } from "vitest";
import { readContent } from "@/lib/invitations/content";
import type { InvitationView } from "@/templates/types";
import { contohView } from "./contoh";
import { siapkanData } from "./data";

const SEKARANG = Date.parse("2026-11-01T05:00:00Z");

function tamu(ubah: Partial<InvitationView> = {}): InvitationView {
  return { ...contohView(SEKARANG), mode: "tamu", slug: "raka-dan-nadia", token: "AbCdEfGhIjKlMnOp", ...ubah };
}

describe("siapkanData", () => {
  it("memformat tanggal, nama, dan acara untuk template", () => {
    const data = siapkanData(tamu());
    expect(data).toMatchObject({
      pria: "Raka",
      priaLengkap: "Raka Pratama Putra",
      tglTitik: "12 . 12 . 2026",
      tglTitikTengah: "12 · 12 · 2026",
      tglPanjang: "Sabtu, 12 Desember 2026",
      tglBesar: "SABTU, 12 DESEMBER 2026",
      tglKata: "Sabtu, dua belas Desember 2026",
      tglKota: "12 Desember 2026, Bandung",
      batasRsvp: "5 Desember 2026",
    });
    expect(data.acara[0]).toMatchObject({
      nama: "Akad Nikah",
      tgl: "Sabtu, 12 Desember 2026",
      jam: "08.00 WIB",
      tempat: "Aula Graha Puspa",
    });
    expect(data.acara[0].kalender).toMatch(/^https:\/\/calendar\.google\.com\//);
    expect(data.hitung).toEqual({ target: Date.parse("2026-12-12T01:00:00Z"), detik: true });
  });

  it("memberi tautan kalender dan QR hanya untuk tamu sungguhan", () => {
    const asli = siapkanData(tamu());
    expect(asli.kalender).toBe("/raka-dan-nadia/AbCdEfGhIjKlMnOp/kalender");
    expect(asli.qr).toBe("/raka-dan-nadia/AbCdEfGhIjKlMnOp/qr");

    const contoh = siapkanData(contohView(SEKARANG));
    expect(contoh.kalender).toMatch(/^data:text\/calendar;charset=utf-8,BEGIN%3AVCALENDAR/);
    expect(contoh.qr).toBeNull();
  });

  it("tidak memberi QR bila check-in dimatikan", () => {
    const view = tamu();
    const content = readContent({ ...view.content, checkin: { aktif: false } });
    expect(siapkanData({ ...view, content }).qr).toBeNull();
  });

  it("menyusun bagian sesuai urutan pasangan dan menyembunyikan bagian tanpa isi", () => {
    const view = tamu();
    const content = readContent({
      ...view.content,
      kutipan: "",
      sambutan: "",
      cerita: [],
      amplop: [{ bank: "BCA", nomor: "  ", atasNama: "Raka" }],
      hitungMundur: { aktif: false, detik: true },
      susunan: { urutan: ["rsvp", "acara", "pembuka"], sembunyi: ["pembuka"] },
    });
    const data = siapkanData({ ...view, content });
    expect(data.urutan).toEqual(["sampul", "rsvp", "ucapan", "acara", "mempelai", "penutup"]);
    expect(data.hitung).toBeNull();
    expect(data.rekening).toEqual([]);
  });

  it("menyusun galeri menurut ukuran asli foto dan petak contoh hanya di mode contoh", () => {
    expect(siapkanData(tamu()).galeri).toEqual([]);
    const contoh = siapkanData(contohView(SEKARANG));
    expect(contoh.galeri).toHaveLength(6);
    expect(contoh.galeri[0]).toMatchObject({ src: "", rasio: "3 / 4" });
    expect(contoh.lajurGaleri).toHaveLength(2);

    const photos = [
      { id: "a", width: 1600, height: 1067 },
      { id: "b", width: 1200, height: 1600 },
      { id: "c", width: null, height: null },
    ].map((p, i) => ({ ...p, kind: "galeri" as const, sortOrder: i, fileName: `${p.id}.jpg`, sizeBytes: 10 }));
    const data = siapkanData(tamu({ photos: [...photos, { ...photos[0], id: "p", kind: "pria" }] }));
    expect(data.galeri.map((g) => g.src)).toEqual(["/foto/a", "/foto/b", "/foto/c"]);
    expect(data.galeri.map((g) => g.rasio)).toEqual(["1600 / 1067", "1200 / 1600", "3 / 4"]);
    expect(data.lajurGaleri).toEqual([[0, 2], [1]]);
    expect(data.galeri[0].sizes).toContain("50vw");
    expect(data.fotoPria).toBe("/foto/p");
    expect(data.fotoWanita).toBeNull();

    const satu = siapkanData(tamu({ photos: [photos[0]] }));
    expect(satu.lajurGaleri).toEqual([[0]]);
    expect(satu.galeri[0].sizes).toContain("100vw");
  });

  it("mengambil jawaban RSVP tamu dan memakai teks penutup bawaan", () => {
    const view = tamu();
    view.events[0] = { ...view.events[0], response: { attending: true, adults: 2, children: 1, note: "Halo" } };
    const data = siapkanData(view);
    expect(data.jawaban).toEqual({ "contoh-akad": { hadir: true, dewasa: 2, anak: 1, pesan: "Halo" } });
    expect(data.penutup).toMatch(/^Merupakan kehormatan/);
  });
});
