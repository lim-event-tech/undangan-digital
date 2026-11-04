import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MAPS_ERROR, parseEventForm, parseEventName } from "./form";

function formOf(values: Record<string, string>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(values)) formData.set(key, value);
  return formData;
}

const lengkap = {
  nama: "Akad Nikah",
  tanggal: "2026-12-20",
  jam: "09:00",
  zona: "WITA",
  tempat: "Gedung Serbaguna",
  alamat: "Jl. Melati No. 1\nJakarta",
  maps: "https://maps.app.goo.gl/AbC123",
};

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
        name: "Akad Nikah",
        date: "2026-12-20",
        time: "09:00",
        timezone: "WITA",
        venueName: "Gedung Serbaguna",
        address: "Jl. Melati No. 1\nJakarta",
        mapsUrl: "https://maps.app.goo.gl/AbC123",
      },
    });
  });

  it("mengizinkan isian sebagian sebagai draf dan memakai WIB bila zona kosong", () => {
    const parsed = parseEventForm(formOf({ nama: "Resepsi" }));
    expect(parsed).toEqual({
      ok: true,
      input: {
        name: "Resepsi",
        date: null,
        time: null,
        timezone: "WIB",
        venueName: null,
        address: null,
        mapsUrl: null,
      },
    });
  });

  it("menolak link yang bukan Google Maps dengan pesan petunjuk", () => {
    const parsed = parseEventForm(formOf({ ...lengkap, maps: "https://bit.ly/resepsi-raka" }));
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
