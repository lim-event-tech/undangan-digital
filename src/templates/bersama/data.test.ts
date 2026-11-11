import { describe, expect, it } from "vitest";
import { readContent } from "@/lib/invitations/content";
import type { InvitationView } from "@/templates/types";
import { contohView } from "./contoh";
import { siapkanData } from "./data";

const SEKARANG = Date.parse("2026-11-01T05:00:00Z");

function tamu(ubah: Partial<InvitationView> = {}): InvitationView {
  return { ...contohView(SEKARANG), mode: "tamu", token: "AbCdEfGh", ...ubah };
}

describe("siapkanData", () => {
  it("menampilkan foto pengisi yang tersedia pada undangan dan tidak memakai cover atau foto yang hilang", () => {
    const view = tamu();
    const fotoId = "30000000-0000-4000-8000-000000000001";
    view.content.pengisiAcara[0].fotoId = fotoId;
    const p = { id: fotoId, kind: "pengisi_acara" as const, sortOrder: 0, fileName: "foto.png", sizeBytes: 200, width: 300, height: 500 };
    view.photos = [p];
    expect(siapkanData(view).pengisiAcara[0].foto).toEqual({ src: `/foto/${fotoId}`, width: 300, height: 500 });
    expect(siapkanData(view).pengisiAcara[1].foto).toBeNull();
    view.photos = [{ ...p, kind: "cover" }];
    expect(siapkanData(view).pengisiAcara[0].foto).toBeNull();
    view.photos = [];
    expect(siapkanData(view).pengisiAcara[0].foto).toBeNull();
  });

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
  });

  it("memberi tautan kalender dan QR hanya untuk tamu sungguhan", () => {
    const asli = siapkanData(tamu());
    expect(asli.kalender).toBe("/AbCdEfGh/kalender");
    expect(asli.qr).toBe("/AbCdEfGh/qr");

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
      identitas: {}, penyelenggara: {}, pengisiAcara: [], kontak: {},
      susunan: { urutan: ["rsvp", "acara", "pembuka"], sembunyi: ["pembuka"] },
    });
    const data = siapkanData({ ...view, content, events: view.events.map((e) => ({ ...e, agenda: [] })) });
    expect(data.urutan).toEqual(["sampul", "rsvp", "acara", "penutup"]);
    expect(data).not.toHaveProperty("rekening");
  });

  it("menyiapkan poster hanya dari foto cover dan menyembunyikan tulisan sampul hanya bila poster ada", () => {
    const view = tamu();
    const poster = { id: "40000000-0000-4000-8000-000000000001", kind: "cover" as const, sortOrder: 0, fileName: "poster.jpg", sizeBytes: 900, width: 1000, height: 2000 };
    const sembunyi = readContent({ ...view.content, sampul: { sembunyikanTeks: true } });

    const tanpaPoster = siapkanData({ ...view, content: sembunyi });
    expect(tanpaPoster.poster).toBeNull();
    expect(tanpaPoster.sembunyikanTeksSampul).toBe(false);

    const denganPoster = siapkanData({ ...view, content: sembunyi, photos: [poster] });
    expect(denganPoster.poster).toEqual({ src: `/foto/${poster.id}`, width: 1000, height: 2000 });
    expect(denganPoster.sembunyikanTeksSampul).toBe(true);

    const teksTampil = siapkanData({ ...view, photos: [poster] });
    expect(teksTampil.poster).not.toBeNull();
    expect(teksTampil.sembunyikanTeksSampul).toBe(false);
    expect(siapkanData({ ...view, photos: [{ ...poster, kind: "logo_eo" }] }).poster).toBeNull();
  });

  it("meneruskan pengaturan tampilan dan bagian lama tidak pernah muncul", () => {
    const view = tamu();
    const warna = { kertas: "#fbf6ea", teks: "#3d3426", utama: "#8a6420", aksen: "#b8934a" };
    const content = readContent({ ...view.content, tampilan: { hiasan: false, warna, font: "cinzel-jost" } });
    const data = siapkanData({ ...view, content });
    expect(data.tampilan).toEqual({ hiasan: false, warna, font: "cinzel-jost" });
    expect(siapkanData(view).tampilan).toEqual({ hiasan: true, warna: null, font: "bawaan" });
    for (const lama of ["hitung", "galeri", "ucapan", "informasi"]) expect(data.urutan).not.toContain(lama);
    for (const lama of ["hitung", "galeri", "ucapan", "musik", "informasiPeserta"]) expect(data).not.toHaveProperty(lama);
  });

  it("mendahulukan jadwal dan agenda sebelum konfirmasi pada susunan bawaan", () => {
    const { urutan } = siapkanData(contohView(SEKARANG));
    expect(urutan.indexOf("acara")).toBeLessThan(urutan.indexOf("agenda"));
    expect(urutan.indexOf("agenda")).toBeLessThan(urutan.indexOf("rsvp"));
  });

  it("menyiapkan hari, jam khusus, dan pilihan jam datang untuk acara beberapa hari", () => {
    const view = tamu();
    view.events[0] = { ...view.events[0], endDate: "2027-02-22", time: "09:00", endTime: "11:00", dayTimes: [{ date: "2027-02-21", start: "13:00", end: "14:00" }] };
    const acara = siapkanData(view).acara[0];
    expect(acara.tgl).toBe("Sabtu, 20 Februari 2027 – Senin, 22 Februari 2027");
    expect(acara.hari.map((h) => h.date)).toEqual(["2027-02-20", "2027-02-21", "2027-02-22"]);
    expect(acara.hari[0]).toMatchObject({ label: "Sabtu, 20 Februari", mulai: "09:00", jam: "09.00–11.00 WIB", opsi: ["09:00", "09:30", "10:00", "10:30", "11:00"] });
    expect(acara.hari[1]).toMatchObject({ mulai: "13:00", jam: "13.00–14.00 WIB", opsi: ["13:00", "13:30", "14:00"] });
    expect(siapkanData(view).tglPanjang).toBe("20–22 Februari 2027");
  });

  it("mengambil jawaban RSVP tamu dan memakai teks penutup bawaan", () => {
    const view = tamu();
    view.events[0] = { ...view.events[0], response: { attending: true, attendeeCount: 3, note: "Halo", visits: [{ date: "2027-02-20", time: "09:30" }] } };
    const data = siapkanData(view);
    expect(data.jawaban).toEqual({ "contoh-utama": { hadir: true, peserta: 3, pesan: "Halo", kunjungan: [{ date: "2027-02-20", time: "09:30" }] } });
    expect(siapkanData({ ...view, content: readContent({ ...view.content, penutup: "" }) }).penutup).toMatch(/^Merupakan kehormatan/);
  });
});
