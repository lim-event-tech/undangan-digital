import { describe, expect, it } from "vitest";
import { BAGIAN, DEFAULT_SUSUNAN, readContent } from "./content";
import {
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
  it("memakai pengaturan formal yang aman untuk data kosong atau rusak", () => {
    const content = readContent({ amplop: [{ nomor: "12345" }], cerita: [{ judul: "Lama" }], kutipan: "Lama", ucapan: { tampil: "ya" }, hitungMundur: [], musik: { aktif: true } });
    expect(content).not.toHaveProperty("amplop");
    expect(content).not.toHaveProperty("cerita");
    expect(content).not.toHaveProperty("kutipan");
    expect(content.ucapan).toEqual({ tampil: false, tahan: false });
    expect(content.hitungMundur).toEqual({ aktif: true, detik: true });
    expect(content.musik).toEqual({ aktif: true });
    expect(content.checkin).toEqual({ aktif: true });
    expect(readContent({ checkin: { aktif: false } }).checkin).toEqual({ aktif: false });
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
    expect(new Set(urutan).size).toBe(BAGIAN.length);
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
