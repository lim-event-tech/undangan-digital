import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  parseTitleForm,
  parsePenutupForm,
  parseRsvpForm,
  parseSambutanForm,
} from "./editor-form";

function formOf(values: Record<string, string>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(values)) formData.set(key, value);
  return formData;
}

describe("parseTitleForm", () => {
  it("merapikan spasi pada judul event", () => {
    expect(parseTitleForm(formOf({ title: "  Gathering   Komunitas  " }))).toEqual({ ok: true, input: { title: "Gathering Komunitas" } });
  });
  it("mewajibkan judul dan membatasi panjangnya", () => {
    expect(parseTitleForm(formOf({}))).toMatchObject({ ok: false, errors: { title: expect.any(String) } });
    expect(parseTitleForm(formOf({ title: "a".repeat(121) }))).toMatchObject({ ok: false, errors: { title: expect.stringContaining("120") } });
    expect(parseTitleForm(formOf({ title: "a".repeat(120) })).ok).toBe(true);
  });
});

describe("parseSambutanForm dan parsePenutupForm", () => {
  it("menerima teks kosong dan membatasi panjang", () => {
    expect(parseSambutanForm(formOf({}))).toEqual({ ok: true, input: { kutipan: "", sambutan: "" } });
    expect(parsePenutupForm(formOf({ penutup: "Terima kasih" }))).toEqual({
      ok: true,
      input: { penutup: "Terima kasih" },
    });

    const tooLong = parseSambutanForm(formOf({ kutipan: "K".repeat(301), sambutan: "S".repeat(1201) }));
    expect(tooLong.ok).toBe(false);
    if (!tooLong.ok) expect(Object.keys(tooLong.errors).sort()).toEqual(["kutipan", "sambutan"]);

    expect(parsePenutupForm(formOf({ penutup: "P".repeat(601) })).ok).toBe(false);
  });
});

describe("parseRsvpForm", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-04T03:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("menolak batas RSVP baru sebelum hari ini", () => {
    expect(parseRsvpForm(formOf({ batas: "2026-11-03", maksDewasa: "2", maksAnak: "0" }))).toEqual({
      ok: false,
      errors: { batas: "Batas waktu RSVP tidak boleh sebelum hari ini" },
    });
  });

  it("tetap menyimpan jumlah tamu ketika batas lama yang sudah lewat tidak diubah", () => {
    const deadline = new Date("2026-11-03T16:59:59.000Z");
    const parsed = parseRsvpForm(formOf({ batas: "2026-11-03", maksDewasa: "3", maksAnak: "1" }), deadline);
    expect(parsed).toEqual({ ok: true, input: { deadline, maxAdults: 3, maxChildren: 1 } });
  });

  it("tetap menolak tanggal lampau lain meskipun undangan sudah punya batas lama", () => {
    const deadline = new Date("2026-11-03T16:59:59.000Z");
    const parsed = parseRsvpForm(formOf({ batas: "2026-11-02", maksDewasa: "2", maksAnak: "0" }), deadline);
    expect(parsed).toEqual({ ok: false, errors: { batas: "Batas waktu RSVP tidak boleh sebelum hari ini" } });
  });

  it("mengubah tanggal batas menjadi akhir hari WIB", () => {
    const parsed = parseRsvpForm(formOf({ batas: "2026-12-10", maksDewasa: "2", maksAnak: "1" }));
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.input.deadline?.toISOString()).toBe("2026-12-10T16:59:59.000Z");
      expect(parsed.input.maxAdults).toBe(2);
      expect(parsed.input.maxChildren).toBe(1);
    }
  });

  it("membolehkan batas waktu kosong", () => {
    const parsed = parseRsvpForm(formOf({ batas: "", maksDewasa: "2", maksAnak: "0" }));
    expect(parsed.ok && parsed.input.deadline).toBeNull();
  });

  it("menolak tanggal salah dan jumlah di luar rentang", () => {
    const parsed = parseRsvpForm(formOf({ batas: "2026-02-30", maksDewasa: "0", maksAnak: "21" }));
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) {
      expect(Object.keys(parsed.errors).sort()).toEqual(["batas", "maksAnak", "maksDewasa"]);
    }
    expect(parseRsvpForm(formOf({ maksDewasa: "dua", maksAnak: "0" })).ok).toBe(false);
  });
});
