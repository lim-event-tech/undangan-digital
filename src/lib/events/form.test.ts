import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MAPS_ERROR, parseEventForm, parseEventName } from "./form";

function formOf(values: Record<string, string>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(values)) formData.set(key, value);
  return formData;
}

const lengkap = {
  nama: "Acara utama",
  tanggal: "2026-12-20",
  jam: "09:00",
  zona: "WITA",
  tempat: "Gedung Serbaguna",
  alamat: "Jl. Melati No. 1\nJakarta",
  maps: "https://maps.app.goo.gl/AbC123",
};

describe("rentang hari dan jam khusus", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-04T03:00:00.000Z"));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("menyimpan tanggal selesai dan jam khusus hanya untuk hari dalam rentang", () => {
    const parsed = parseEventForm(formOf({ ...lengkap, jamSelesai: "17:00", tanggalSelesai: "2026-12-22", "mulai-2026-12-21": "10:00", "selesai-2026-12-21": "15:00", "mulai-2026-12-30": "10:00", "selesai-2026-12-30": "11:00" }));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.input).toMatchObject({ date: "2026-12-20", endDate: "2026-12-22", dayTimes: [{ date: "2026-12-21", start: "10:00", end: "15:00" }] });
  });

  it("menganggap tanggal selesai yang sama dengan mulai sebagai acara satu hari", () => {
    const parsed = parseEventForm(formOf({ ...lengkap, tanggalSelesai: "2026-12-20" }));
    expect(parsed.ok && parsed.input.endDate).toBeNull();
  });

  it.each([
    [{ tanggalSelesai: "2026-12-19" }, "tanggalSelesai"],
    [{ tanggalSelesai: "rusak" }, "tanggalSelesai"],
    [{ tanggalSelesai: "2027-03-01" }, "tanggalSelesai"],
    [{ tanggal: "", tanggalSelesai: "2026-12-22" }, "tanggalSelesai"],
    [{ tanggalSelesai: "2026-12-21", "mulai-2026-12-21": "10:00" }, "selesai-2026-12-21"],
    [{ tanggalSelesai: "2026-12-21", "mulai-2026-12-21": "10:00", "selesai-2026-12-21": "09:00" }, "selesai-2026-12-21"],
  ])("menolak isian tidak valid %j", (ubah, field) => {
    const parsed = parseEventForm(formOf({ ...lengkap, ...ubah }));
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.errors).toHaveProperty(field);
  });

  it("menerima link Maps panjang hasil salin dari browser dan tanpa awalan https", () => {
    const panjang = `https://www.google.com/maps/place/Gedung+Serbaguna/@-6.2,106.8,17z/data=${"!4m6!3m5!1s0x2e69f".repeat(40)}`;
    expect(panjang.length).toBeGreaterThan(500);
    const parsed = parseEventForm(formOf({ ...lengkap, maps: panjang }));
    expect(parsed.ok && parsed.input.mapsUrl).toBe(panjang);
    const tanpaSkema = parseEventForm(formOf({ ...lengkap, maps: "www.google.com/maps/place/Gedung" }));
    expect(tanpaSkema.ok && tanpaSkema.input.mapsUrl).toBe("https://www.google.com/maps/place/Gedung");
    expect(parseEventForm(formOf({ ...lengkap, maps: "javascript:alert(1)" }))).toMatchObject({ ok: false, errors: { maps: MAPS_ERROR } });
  });
});

describe("parseEventForm", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-11-04T03:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("menolak tanggal acara baru sebelum hari ini", () => {
    const parsed = parseEventForm(formOf({ ...lengkap, tanggal: "2026-11-03" }));
    expect(parsed).toEqual({ ok: false, errors: { tanggal: "Tanggal acara tidak boleh sebelum hari ini" } });
  });

  it.each(["2026-11-04", "2026-11-05"])("menerima tanggal hari ini atau mendatang %s", (tanggal) => {
    expect(parseEventForm(formOf({ ...lengkap, tanggal })).ok).toBe(true);
  });

  it("memakai hari ini menurut zona acara", () => {
    vi.setSystemTime(new Date("2026-11-04T15:30:00.000Z"));
    expect(parseEventForm(formOf({ ...lengkap, tanggal: "2026-11-04", zona: "WIB" })).ok).toBe(true);
    expect(parseEventForm(formOf({ ...lengkap, tanggal: "2026-11-04", zona: "WITA" })).ok).toBe(true);
    expect(parseEventForm(formOf({ ...lengkap, tanggal: "2026-11-04", zona: "WIT" }))).toEqual({
      ok: false,
      errors: { tanggal: "Tanggal acara tidak boleh sebelum hari ini" },
    });
  });

  it("tetap mengizinkan perubahan tempat ketika tanggal dan zona acara lama tidak diubah", () => {
    const currentEvent = { date: "2026-11-03", timezone: "WITA" as const };
    const parsed = parseEventForm(formOf({ ...lengkap, tanggal: "2026-11-03", tempat: "Gedung Baru" }), currentEvent);
    expect(parsed.ok && parsed.input.venueName).toBe("Gedung Baru");
  });

  it("menolak tanggal lampau lain meskipun acara sudah punya tanggal lama", () => {
    const currentEvent = { date: "2026-11-03", timezone: "WITA" as const };
    const parsed = parseEventForm(formOf({ ...lengkap, tanggal: "2026-11-02" }), currentEvent);
    expect(parsed).toEqual({ ok: false, errors: { tanggal: "Tanggal acara tidak boleh sebelum hari ini" } });
  });

  it("menolak perubahan zona ketika tanggal acara tetap berada di masa lalu", () => {
    const currentEvent = { date: "2026-11-03", timezone: "WITA" as const };
    const parsed = parseEventForm(formOf({ ...lengkap, tanggal: "2026-11-03", zona: "WIB" }), currentEvent);
    expect(parsed).toEqual({ ok: false, errors: { tanggal: "Tanggal acara tidak boleh sebelum hari ini" } });
  });

  it("menerima isian lengkap", () => {
    const parsed = parseEventForm(formOf(lengkap));
    expect(parsed).toEqual({
      ok: true,
      input: {
        name: "Acara utama",
        date: "2026-12-20",
        time: "09:00",
        endDate: null,
        endTime: null, dayTimes: [], agenda: [],
        timezone: "WITA",
        venueName: "Gedung Serbaguna",
        address: "Jl. Melati No. 1\nJakarta",
        mapsUrl: "https://maps.app.goo.gl/AbC123",
      },
    });
  });

  it("mengizinkan isian sebagian sebagai draf dan memakai WIB bila zona kosong", () => {
    const parsed = parseEventForm(formOf({ nama: "Sesi lanjutan" }));
    expect(parsed).toEqual({
      ok: true,
      input: {
        name: "Sesi lanjutan",
        date: null,
        time: null,
        endDate: null,
        endTime: null, dayTimes: [], agenda: [],
        timezone: "WIB",
        venueName: null,
        address: null,
        mapsUrl: null,
      },
    });
  });

  it("menolak isian yang bukan link https dengan pesan petunjuk", () => {
    const parsed = parseEventForm(formOf({ ...lengkap, maps: "http://maps.app.goo.gl/AbC123" }));
    expect(parsed).toEqual({ ok: false, errors: { maps: MAPS_ERROR } });
  });

  it("menolak nama kosong, tanggal, jam, dan zona yang tidak valid sekaligus", () => {
    const parsed = parseEventForm(
      formOf({ nama: "  ", tanggal: "2026-02-30", jam: "25:00", zona: "UTC" }),
    );
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) {
      expect(Object.keys(parsed.errors).sort()).toEqual(["jam", "nama", "tanggal", "zona"]);
    }
  });

  it("menolak teks yang melebihi batas panjang", () => {
    const parsed = parseEventForm(
      formOf({ ...lengkap, nama: "A".repeat(61), tempat: "B".repeat(101), alamat: "C".repeat(301) }),
    );
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) {
      expect(Object.keys(parsed.errors).sort()).toEqual(["alamat", "nama", "tempat"]);
    }
  });
});

describe("parseEventName", () => {
  it("merapikan spasi dan menolak nama kosong", () => {
    expect(parseEventName(formOf({ nama: "  Ngunduh   Mantu " }))).toEqual({
      name: "Ngunduh Mantu",
    });
    expect(parseEventName(formOf({ nama: "" }))).toEqual({ error: "Nama acara wajib diisi" });
  });
});
