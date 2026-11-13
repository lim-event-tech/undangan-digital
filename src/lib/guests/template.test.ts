import { describe, expect, it } from "vitest";
import { readXlsx } from "@/lib/xlsx";
import { COLUMNS, parseGuestTable, validateImportRows, type ImportContext } from "./import";
import { buildGuestTemplateXlsx } from "./template";

const konteks: ImportContext = {
  events: [
    { id: "e1", key: "akad", name: "Akad Nikah" },
    { id: "e2", key: "resepsi", name: "Resepsi" },
  ],
  groups: ["Keluarga", "Kantor"],
  existing: [],
  defaults: { maxAttendees: 2 },
};

describe("buildGuestTemplateXlsx", () => {
  it("menghasilkan workbook Excel dengan header kolom impor di sheet pertama yang valid dibaca kembali", () => {
    const bytes = buildGuestTemplateXlsx(konteks);
    const parsed = readXlsx(new Uint8Array(bytes));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    expect(parsed.rows).toEqual([[...COLUMNS]]);

    // Simulasi pengguna mengisi baris di bawah header lalu mengunggah kembali
    const diisi = [
      ...parsed.rows,
      ["Bapak Hendra", "081234567890", "Keluarga", "Akad Nikah;Resepsi", "3"],
      ["Ibu Sari", "085700001122", "", "", ""],
    ];
    const tabel = parseGuestTable(diisi);
    expect(tabel.ok).toBe(true);
    if (!tabel.ok) return;

    const validasi = validateImportRows(tabel.rows, konteks);
    expect(validasi.map((r) => r.status)).toEqual(["siap", "siap"]);
    expect(validasi[0].eventIds).toEqual(["e1", "e2"]);
    expect(validasi[1].maxAttendees).toBe(2);
  });

  it("menyertakan dua sheet (Daftar undangan dan Panduan) dalam workbook Excel", () => {
    const bytes = buildGuestTemplateXlsx(konteks);
    const raw = bytes.toString("latin1");
    expect(bytes.subarray(0, 2).toString("ascii")).toBe("PK");
    expect(raw).toContain("xl/worksheets/sheet1.xml");
    expect(raw).toContain("xl/worksheets/sheet2.xml");
  });
});

