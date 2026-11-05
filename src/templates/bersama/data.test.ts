import { describe, expect, it } from "vitest";
import { readContent } from "@/lib/invitations/content";
import type { InvitationView } from "@/templates/types";
import { contohView } from "./contoh";
import { siapkanData } from "./data";

const SEKARANG = Date.parse("2026-11-01T05:00:00Z");

function tamu(ubah: Partial<InvitationView> = {}): InvitationView {
  return { ...contohView(SEKARANG), mode: "tamu", slug: "gathering-komunitas", token: "AbCdEfGhIjKlMnOp", ...ubah };
}

describe("siapkanData", () => {
  it("memformat tanggal, nama, dan acara untuk template", () => {
    const data = siapkanData(tamu());
    expect(data).toMatchObject({
      judul: "Seminar Kepemimpinan Organisasi",
      tglTitik: "20 . 02 . 2027",
      tglTitikTengah: "20 · 02 · 2027",
      tglPanjang: "Sabtu, 20 Februari 2027",
      tglBesar: "SABTU, 20 FEBRUARI 2027",
      tglKata: "Sabtu, dua puluh Februari 2027",
      tglKota: "20 Februari 2027, Bandung",
      batasRsvp: "15 Februari 2027",
    });
    expect(data.acara[0]).toMatchObject({
      nama: "Sesi utama",
      tgl: "Sabtu, 20 Februari 2027",
      jam: "09:00–11:00 WIB",
      tempat: "Aula Graha Puspa",
    });
    expect(data.acara[0].kalender).toMatch(/^https:\/\/calendar\.google\.com\//);
    expect(data.hitung).toEqual({ target: Date.parse("2027-02-20T02:00:00Z"), detik: true });
  });

  it("memberi tautan kalender dan QR hanya untuk tamu sungguhan", () => {
    const asli = siapkanData(tamu());
    expect(asli.kalender).toBe("/gathering-komunitas/AbCdEfGhIjKlMnOp/kalender");
    expect(asli.qr).toBe("/gathering-komunitas/AbCdEfGhIjKlMnOp/qr");

    const contoh = siapkanData(contohView(SEKARANG));
    expect(contoh.kalender).toMatch(/^data:text\/calendar;charset=utf-8,BEGIN%3AVCALENDAR/);
    expect(contoh.qr).toBeNull();
  });

  it("tidak memberi QR bila check-in dimatikan", () => {
    const view = tamu();
    const content = readContent({ ...view.content, checkin: { aktif: false } });
    expect(siapkanData({ ...view, content }).qr).toBeNull();
  });

  it("menyusun bagian sesuai urutan pengguna dan menyembunyikan bagian tanpa isi", () => {
    const view = tamu();
    const content = readContent({
      ...view.content,
      sambutan: "",
      identitas: {}, penyelenggara: {}, pengisiAcara: [], informasiPeserta: {}, kontak: {},
      hitungMundur: { aktif: false, detik: true },
      susunan: { urutan: ["rsvp", "acara", "pembuka"], sembunyi: ["pembuka"] },
    });
    const data = siapkanData({ ...view, content, events: view.events.map((e) => ({ ...e, agenda: [] })) });
    expect(data.urutan).toEqual(["sampul", "rsvp", "ucapan", "acara", "penutup"]);
    expect(data.hitung).toBeNull();
    expect(data).not.toHaveProperty("rekening");
  });

  it("menyusun galeri menurut ukuran asli dan memakai aset ilustrasi hanya di mode contoh", () => {
    expect(siapkanData(tamu()).galeri).toEqual([]);
    const contoh = siapkanData(contohView(SEKARANG));
    expect(contoh.galeri).toHaveLength(4);
    expect(contoh.galeri[0]).toMatchObject({ src: "/template/assets/melati.webp", rasio: "1051 / 1400" });
    expect(contoh.lajurGaleri).toHaveLength(2);

    const photos = [
      { id: "a", width: 1600, height: 1067 },
      { id: "b", width: 1200, height: 1600 },
      { id: "c", width: null, height: null },
    ].map((p, i) => ({ ...p, kind: "galeri" as const, sortOrder: i, fileName: `${p.id}.jpg`, sizeBytes: 10 }));
    const data = siapkanData(tamu({ photos: [...photos, { ...photos[0], id: "p", kind: "cover" }] }));
    expect(data.galeri.map((g) => g.src)).toEqual(["/foto/a", "/foto/b", "/foto/c"]);
    expect(data.galeri.map((g) => g.rasio)).toEqual(["1600 / 1067", "1200 / 1600", "3 / 4"]);
    expect(data.lajurGaleri).toEqual([[0, 2], [1]]);
    expect(data.galeri[0].sizes).toContain("50vw");

    const satu = siapkanData(tamu({ photos: [photos[0]] }));
    expect(satu.lajurGaleri).toEqual([[0]]);
    expect(satu.galeri[0].sizes).toContain("100vw");
  });

  it("mengutamakan ilustrasi tema pada contoh dan tidak mengisi galeri pengguna", () => {
    expect(siapkanData(tamu(), "bintang").galeri).toEqual([]);
    expect(siapkanData(contohView(SEKARANG), "bintang").galeri[0].src).toBe("/template/assets/bintang.webp");
  });

  it("mendahulukan jadwal, agenda, dan informasi peserta sebelum konfirmasi pada susunan bawaan", () => {
    const { urutan } = siapkanData(contohView(SEKARANG));
    expect(urutan.indexOf("acara")).toBeLessThan(urutan.indexOf("agenda"));
    expect(urutan.indexOf("agenda")).toBeLessThan(urutan.indexOf("informasi"));
    expect(urutan.indexOf("informasi")).toBeLessThan(urutan.indexOf("rsvp"));
    expect(urutan.indexOf("rsvp")).toBeLessThan(urutan.indexOf("galeri"));
  });

  it("mengambil jawaban RSVP tamu dan memakai teks penutup bawaan", () => {
    const view = tamu();
    view.events[0] = { ...view.events[0], response: { attending: true, attendeeCount: 3,  note: "Halo" } };
    const data = siapkanData(view);
    expect(data.jawaban).toEqual({ "contoh-utama": { hadir: true, peserta: 3, pesan: "Halo" } });
    expect(siapkanData({ ...view, content: readContent({ ...view.content, penutup: "" }) }).penutup).toMatch(/^Merupakan kehormatan/);
  });
});
