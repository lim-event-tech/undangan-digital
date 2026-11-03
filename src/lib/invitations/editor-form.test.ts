import { describe, expect, it } from "vitest";
import {
  parseMempelaiForm,
  parsePenutupForm,
  parseRsvpForm,
  parseSambutanForm,
} from "./editor-form";

function formOf(values: Record<string, string>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(values)) formData.set(key, value);
  return formData;
}

describe("parseMempelaiForm", () => {
  it("merapikan spasi dan menyimpan keterangan orang tua multi baris", () => {
    const parsed = parseMempelaiForm(
      formOf({
        panggilanPria: "  Raka ",
        panggilanWanita: "Nadia",
        namaLengkapPria: "Raka   Pratama",
        namaLengkapWanita: "",
        orangTuaPria: "Putra Bapak A\r\ndan Ibu B",
        orangTuaWanita: "",
      }),
    );
    expect(parsed).toEqual({
      ok: true,
      input: {
        groomName: "Raka",
        brideName: "Nadia",
        pria: { namaLengkap: "Raka Pratama", orangTua: "Putra Bapak A\ndan Ibu B" },
        wanita: { namaLengkap: "", orangTua: "" },
      },
    });
  });

  it("mewajibkan nama panggilan dan membatasi panjang", () => {
    const parsed = parseMempelaiForm(
      formOf({ panggilanPria: "", panggilanWanita: "N".repeat(41), namaLengkapPria: "X".repeat(81) }),
    );
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) {
      expect(Object.keys(parsed.errors).sort()).toEqual([
        "namaLengkapPria",
        "panggilanPria",
        "panggilanWanita",
      ]);
    }
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
