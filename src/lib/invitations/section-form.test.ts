import { describe, expect, it } from "vitest";
import { BAGIAN, DEFAULT_SUSUNAN, readContent } from "./content";
import {
  parseCheckinForm,
  parseSampulForm,
  parseSusunanForm,
  parseTampilanForm,
  parseWaPosterForm,
} from "./section-form";

function form(entries: [string, string][]): FormData {
  const data = new FormData();
  for (const [key, value] of entries) data.append(key, value);
  return data;
}

const WARNA: [string, string][] = [["kertas", "#FBF6EA"], ["teks", "#3d3426"], ["utama", "#8a6420"], ["aksen", "#b8934a"]];

describe("pengaturan saklar", () => {
  it("membaca saklar yang dicentang sebagai true dan sisanya false", () => {
    expect(parseCheckinForm(form([["aktif", "on"]]))).toEqual({
      ok: true,
      input: { checkin: { aktif: true } },
    });
    expect(parseCheckinForm(form([]))).toEqual({ ok: true, input: { checkin: { aktif: false } } });
    expect(parseSampulForm(form([["sembunyikanTeks", "on"]]))).toEqual({
      ok: true,
      input: { sampul: { sembunyikanTeks: true } },
    });
    expect(parseSampulForm(form([]))).toEqual({ ok: true, input: { sampul: { sembunyikanTeks: false } } });
  });
});

describe("pengaturan tampilan", () => {
  it("menyimpan hiasan, font, dan palet kustom dengan kode warna huruf kecil", () => {
    const parsed = parseTampilanForm(form([["hiasan", "on"], ["warnaKustom", "on"], ["font", "lora-mulish"], ...WARNA]));
    expect(parsed).toEqual({
      ok: true,
      input: { tampilan: { hiasan: true, font: "lora-mulish", warna: { kertas: "#fbf6ea", teks: "#3d3426", utama: "#8a6420", aksen: "#b8934a" } } },
    });
  });

  it("memakai warna bawaan template bila palet kustom dimatikan dan hiasan tidak dicentang", () => {
    expect(parseTampilanForm(form([["font", "bawaan"], ...WARNA]))).toEqual({
      ok: true,
      input: { tampilan: { hiasan: false, font: "bawaan", warna: null } },
    });
  });

  it("menolak font tak dikenal dan kode warna rusak", () => {
    expect(parseTampilanForm(form([["font", "comic"]]))).toMatchObject({ ok: false, errors: { font: expect.any(String) } });
    const rusak = parseTampilanForm(form([["warnaKustom", "on"], ["font", "bawaan"], ["kertas", "merah"], ["teks", "#000000"], ["utama", "#12"], ["aksen", "#ffffff"]]));
    expect(rusak).toMatchObject({ ok: false, errors: { kertas: expect.any(String), utama: expect.any(String) } });
    expect(rusak.ok === false && rusak.errors.teks).toBeUndefined();
  });
});

describe("readContent untuk bagian tambahan", () => {
  it("memakai pengaturan formal yang aman untuk data kosong atau rusak", () => {
    const content = readContent({ amplop: [{ nomor: "12345" }], cerita: [{ judul: "Lama" }], kutipan: "Lama", ucapan: { tampil: true }, hitungMundur: [], musik: { aktif: true }, informasiPeserta: { dressCode: "Batik" }, identitas: { subjudul: "Lama" } });
    for (const key of ["amplop", "cerita", "kutipan", "ucapan", "hitungMundur", "musik", "informasiPeserta"]) expect(content).not.toHaveProperty(key);
    expect(content.identitas).not.toHaveProperty("subjudul");
    expect(content.checkin).toEqual({ aktif: true });
    expect(readContent({ checkin: { aktif: false } }).checkin).toEqual({ aktif: false });
  });

  it("membaca pengaturan sampul dan tampilan dengan bawaan yang aman", () => {
    const kosong = readContent({});
    expect(kosong.sampul).toEqual({ sembunyikanTeks: false });
    expect(kosong.tampilan).toEqual({ hiasan: true, warna: null, font: "bawaan" });
    const rusak = readContent({ sampul: { sembunyikanTeks: "ya" }, tampilan: { hiasan: false, warna: { kertas: "#fff", teks: "x", utama: "#000000", aksen: "#000000" }, font: "tidak-ada" } });
    expect(rusak.sampul).toEqual({ sembunyikanTeks: false });
    expect(rusak.tampilan).toEqual({ hiasan: false, warna: null, font: "bawaan" });
  });
});

describe("susunan bagian", () => {
  it("menormalkan urutan: sampul selalu pertama, penutup terakhir, bagian hilang dilengkapi", () => {
    const parsed = parseSusunanForm(
      form([
        ["urutan", "penutup"],
        ["urutan", "kontak"],
        ["urutan", "acara"],
        ["urutan", "sampul"],
        ["urutan", "tidak-ada"],
        ["urutan", "kontak"],
      ]),
    );
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const { urutan } = parsed.input.susunan;
    expect(urutan[0]).toBe("sampul");
    expect(urutan[urutan.length - 1]).toBe("penutup");
    expect(new Set(urutan).size).toBe(BAGIAN.length);
    expect(urutan.indexOf("kontak")).toBeLessThan(urutan.indexOf("acara"));
  });

  it("tidak membolehkan menyembunyikan sampul, RSVP, dan penutup", () => {
    const parsed = parseSusunanForm(
      form([
        ["sembunyi", "sampul"],
        ["sembunyi", "rsvp"],
        ["sembunyi", "penutup"],
        ["sembunyi", "kontak"],
        ["sembunyi", "kontak"],
        ["sembunyi", "bukan-bagian"],
      ]),
    );
    expect(parsed).toMatchObject({ ok: true, input: { susunan: { sembunyi: ["kontak"] } } });
  });

  it("membuang bagian lama yang sudah dihapus dari susunan tersimpan", () => {
    const parsed = parseSusunanForm(form([["urutan", "galeri"], ["urutan", "hitung"], ["urutan", "acara"], ["sembunyi", "ucapan"]]));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    for (const lama of ["galeri", "hitung", "informasi", "ucapan"]) {
      expect(parsed.input.susunan.urutan).not.toContain(lama);
      expect(parsed.input.susunan.sembunyi).not.toContain(lama);
    }
  });

  it("susunan kosong menghasilkan urutan bawaan", () => {
    const parsed = parseSusunanForm(form([]));
    expect(parsed).toMatchObject({ ok: true, input: { susunan: DEFAULT_SUSUNAN } });
  });
});

describe("poster WhatsApp", () => {
  it("membaca pilihan kirim dan sumber poster, bawaan memakai poster Isi undangan", () => {
    expect(parseWaPosterForm(form([["kirim", "on"], ["sumber", "khusus"]]))).toEqual({ ok: true, input: { waPoster: { kirim: true, sumber: "khusus" } } });
    expect(parseWaPosterForm(form([["sumber", "aneh"]]))).toEqual({ ok: true, input: { waPoster: { kirim: false, sumber: "sama" } } });
    expect(readContent({}).waPoster).toEqual({ kirim: false, sumber: "sama" });
    expect(readContent({ waPoster: { kirim: "ya", sumber: "khusus" } }).waPoster).toEqual({ kirim: false, sumber: "khusus" });
  });
});
