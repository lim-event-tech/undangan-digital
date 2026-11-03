import { describe, expect, it } from "vitest";
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
