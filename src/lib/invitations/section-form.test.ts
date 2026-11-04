import { describe, expect, it } from "vitest";
import { DEFAULT_SUSUNAN, readContent } from "./content";
import {
  accountDigits,
  parseAmplopForm,
  parseCeritaForm,
  parseHitungMundurForm,
  parseCheckinForm,
  parseMusikForm,
  parseSusunanForm,
  parseUcapanForm,
} from "./section-form";

function form(entries: [string, string][]): FormData {
  const data = new FormData();
  for (const [key, value] of entries) data.append(key, value);
  return data;
}

describe("parseAmplopForm", () => {
  it("menyimpan rekening yang terisi dan melewati slot kosong", () => {
    const parsed = parseAmplopForm(
      form([
        ["bank1", "BCA"],
        ["nomor1", "123 456 7890"],
        ["nama1", "Raka Pratama"],
        ["bank2", ""],
        ["nomor2", ""],
        ["nama2", ""],
      ]),
    );
    expect(parsed).toEqual({
      ok: true,
      input: { amplop: [{ bank: "BCA", nomor: "123 456 7890", atasNama: "Raka Pratama" }] },
    });
  });

  it("mewajibkan ketiga isian bila salah satunya diisi", () => {
    const parsed = parseAmplopForm(form([["bank1", "BCA"]]));
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) {
      expect(Object.keys(parsed.errors).sort()).toEqual(["nama1", "nomor1"]);
    }
  });

  it("menolak nomor rekening yang bukan angka atau terlalu pendek", () => {
    for (const nomor of ["abc12345", "1234", "12 34 x"]) {
      const parsed = parseAmplopForm(
        form([
          ["bank1", "BCA"],
          ["nomor1", nomor],
          ["nama1", "Raka"],
        ]),
      );
      expect(parsed.ok, nomor).toBe(false);
    }
  });

  it("kosong sepenuhnya berarti tidak ada rekening", () => {
    expect(parseAmplopForm(form([]))).toEqual({ ok: true, input: { amplop: [] } });
  });

  it("accountDigits hanya menyisakan angka", () => {
    expect(accountDigits("123-456 78.9")).toBe("123456789");
  });
});

describe("parseCeritaForm", () => {
  it("memetakan momen berurutan dan melewati yang kosong", () => {
    const parsed = parseCeritaForm(
      form([
        ["tahun", "2019"],
        ["judul", "Pertama bertemu"],
        ["teks", "Di kampus.\r\n\r\n\r\nLucu."],
        ["tahun", ""],
        ["judul", ""],
        ["teks", ""],
        ["tahun", "2026"],
        ["judul", "Lamaran"],
        ["teks", ""],
      ]),
    );
    expect(parsed).toEqual({
      ok: true,
      input: {
        cerita: [
          { tahun: "2019", judul: "Pertama bertemu", teks: "Di kampus.\n\nLucu." },
          { tahun: "2026", judul: "Lamaran", teks: "" },
        ],
      },
    });
  });

  it("mewajibkan judul dan melaporkan galat menurut urutan di formulir", () => {
    const parsed = parseCeritaForm(
      form([
        ["tahun", "2019"],
        ["judul", ""],
        ["teks", "tanpa judul"],
      ]),
    );
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.errors["judul-0"]).toBe("Judul momen wajib diisi");
  });

  it("membatasi jumlah momen dan panjang isian", () => {
    const many = Array.from({ length: 7 }, (_, i) => [
      ["tahun", String(2000 + i)],
      ["judul", `Momen ${i}`],
      ["teks", ""],
    ]).flat() as [string, string][];
    const tooMany = parseCeritaForm(form(many));
    expect(tooMany.ok).toBe(false);

    const tooLong = parseCeritaForm(
      form([
        ["tahun", "x"],
        ["judul", "y"],
        ["teks", "a".repeat(401)],
      ]),
    );
    expect(tooLong.ok).toBe(false);
    if (!tooLong.ok) expect(tooLong.errors["teks-0"]).toContain("400");
  });
});

describe("pengaturan saklar", () => {
  it("membaca saklar yang dicentang sebagai true dan sisanya false", () => {
    expect(parseUcapanForm(form([["tampil", "on"]]))).toEqual({
      ok: true,
      input: { ucapan: { tampil: true, tahan: false } },
    });
    expect(parseHitungMundurForm(form([["aktif", "on"], ["detik", "on"]]))).toEqual({
      ok: true,
      input: { hitungMundur: { aktif: true, detik: true } },
    });
    expect(parseMusikForm(form([]))).toEqual({ ok: true, input: { musik: { aktif: false } } });
    expect(parseCheckinForm(form([["aktif", "on"]]))).toEqual({
      ok: true,
      input: { checkin: { aktif: true } },
    });
    expect(parseCheckinForm(form([]))).toEqual({ ok: true, input: { checkin: { aktif: false } } });
  });
});

describe("readContent untuk bagian tambahan", () => {
  it("memakai nilai bawaan untuk data yang hilang atau rusak", () => {
    const content = readContent({
      amplop: "bukan daftar",
      cerita: [1, null, { judul: "ok", tahun: 5 }],
      ucapan: { tampil: "ya" },
      hitungMundur: [],
      musik: { aktif: true },
    });
    expect(content.amplop).toEqual([]);
    expect(content.cerita).toEqual([{ tahun: "", judul: "ok", teks: "" }]);
    expect(content.ucapan).toEqual({ tampil: true, tahan: false });
    expect(content.hitungMundur).toEqual({ aktif: true, detik: true });
    expect(content.musik).toEqual({ aktif: true });
    expect(content.checkin).toEqual({ aktif: true });
    expect(readContent({ checkin: { aktif: false } }).checkin).toEqual({ aktif: false });
  });

  it("memotong daftar yang melebihi batas", () => {
    const content = readContent({
      amplop: [{}, {}, {}, {}],
      cerita: Array.from({ length: 10 }, () => ({ judul: "x" })),
    });
    expect(content.amplop).toHaveLength(2);
    expect(content.cerita).toHaveLength(6);
  });
});

describe("susunan bagian", () => {
  it("menormalkan urutan: sampul selalu pertama, penutup terakhir, bagian hilang dilengkapi", () => {
    const parsed = parseSusunanForm(
      form([
        ["urutan", "penutup"],
        ["urutan", "galeri"],
        ["urutan", "acara"],
        ["urutan", "sampul"],
        ["urutan", "tidak-ada"],
        ["urutan", "galeri"],
      ]),
    );
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const { urutan } = parsed.input.susunan;
    expect(urutan[0]).toBe("sampul");
    expect(urutan[urutan.length - 1]).toBe("penutup");
    expect(new Set(urutan).size).toBe(12);
    expect(urutan.indexOf("galeri")).toBeLessThan(urutan.indexOf("acara"));
  });

  it("tidak membolehkan menyembunyikan sampul, RSVP, dan penutup", () => {
    const parsed = parseSusunanForm(
      form([
        ["sembunyi", "sampul"],
        ["sembunyi", "rsvp"],
        ["sembunyi", "penutup"],
        ["sembunyi", "galeri"],
        ["sembunyi", "galeri"],
        ["sembunyi", "bukan-bagian"],
      ]),
    );
    expect(parsed).toMatchObject({ ok: true, input: { susunan: { sembunyi: ["galeri"] } } });
  });

  it("susunan kosong menghasilkan urutan bawaan", () => {
    const parsed = parseSusunanForm(form([]));
    expect(parsed).toMatchObject({ ok: true, input: { susunan: DEFAULT_SUSUNAN } });
  });
});
