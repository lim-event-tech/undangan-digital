import { describe, expect, it } from "vitest";
import { NEW_GROUP_VALUE, parseGuestForm } from "./form";

function formData(entries: Record<string, string | string[]>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    for (const item of Array.isArray(value) ? value : [value]) data.append(key, item);
  }
  return data;
}

const valid = {
  nama: "  Bapak   Hendra & Istri ",
  whatsapp: "0812 0000 0102",
  grup: "Keluarga pria",
  acara: ["e1", "e2"],
  maksPeserta: "3",
};

describe("parseGuestForm", () => {
  it.each(["1", "40"])("menerima batas peserta %s", (maksPeserta) => {
    expect(parseGuestForm(formData({ ...valid, maksPeserta })).ok).toBe(true);
  });
  it.each(["0", "41", "1.5", "-1", "dua"])("menolak batas peserta %s", (maksPeserta) => {
    expect(parseGuestForm(formData({ ...valid, maksPeserta }))).toMatchObject({ ok: false, errors: { maksPeserta: expect.any(String) } });
  });
  it("menormalkan isian yang valid", () => {
    const result = parseGuestForm(formData(valid));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.input).toEqual({
      name: "Bapak Hendra & Istri",
      phone: "+6281200000102",
      groupName: "Keluarga pria",
      eventIds: ["e1", "e2"],
      maxAttendees: 3,
    });
  });

  it("memakai nama grup baru bila dipilih", () => {
    const result = parseGuestForm(
      formData({ ...valid, grup: NEW_GROUP_VALUE, grupBaru: " Teman  SMA " }),
    );
    expect(result.ok && result.input.groupName).toBe("Teman SMA");
  });

  it("menganggap tanpa grup sebagai null", () => {
    const result = parseGuestForm(formData({ ...valid, grup: "" }));
    expect(result.ok && result.input.groupName).toBeNull();
  });

  it("mengumpulkan semua galat per kolom dan mengembalikan isian", () => {
    const result = parseGuestForm(
      formData({
        nama: " ",
        whatsapp: "12",
        grup: NEW_GROUP_VALUE,
        grupBaru: "",
        maksPeserta: "0",
      }),
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors).toEqual({
      nama: "Nama wajib diisi",
      whatsapp: "Format nomor tidak dikenali",
      grup: "Isi nama grup baru",
      acara: "Pilih minimal satu acara",
      maksPeserta: "Maks. peserta harus 1 sampai 40",
    });
    expect(result.values.whatsapp).toBe("12");
  });
});
