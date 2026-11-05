import { describe, expect, it } from "vitest";
import { parseGuestCsv, parseGuestTable, validateImportRows, type ImportContext } from "./import";

const konteks: ImportContext = {
  events: [
    { id: "e1", key: "utama", name: "Acara utama" },
    { id: "e2", key: "lanjutan", name: "Sesi lanjutan" },
  ],
  groups: [],
  existing: [],
  defaults: { maxAttendees: 2,  },
};

describe("parseGuestTable (Excel)", () => {
  it("menolak header kuota dewasa dan anak pada berkas Excel", () => {
    expect(parseGuestTable([["nama", "whatsapp", "maks_dewasa", "maks_anak"], ["Tamu", "081234567890", "2", "1"]])).toMatchObject({ ok: false, error: expect.stringContaining("maks_peserta") });
  });
  it("membaca tabel dengan judul kolom di baris pertama dan memakai nomor baris lembar", () => {
    const hasil = parseGuestTable([
      ["Nama", "WhatsApp", "Grup", "Acara", "Maks peserta"],
      ["Bapak Hendra", "81200000101", "Keluarga", "utama;lanjutan", "3"],
      ["", "", "", "", "", ""],
      ["Tante Lina", "0812-0000-0104", "", "", ""],
    ]);
    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    expect(hasil.rows.map((r) => [r.row, r.nama, r.whatsapp, r.maks_peserta])).toEqual([
      [2, "Bapak Hendra", "81200000101", "3"],
      [4, "Tante Lina", "0812-0000-0104", ""],
    ]);
    const validasi = validateImportRows(hasil.rows, konteks);
    expect(validasi.map((r) => r.status)).toEqual(["siap", "siap"]);
    expect(validasi[0].phone).toBe("+6281200000101");
  });

  it("melewati baris kosong di atas judul dan menyesuaikan nomor baris", () => {
    const hasil = parseGuestTable([
      ["", ""],
      ["nama", "whatsapp"],
      ["Dimas", "08570000102"],
    ]);
    expect(hasil.ok && hasil.rows[0].row).toBe(3);
  });

  it("menolak tabel tanpa kolom wajib, kosong, atau tanpa baris tamu", () => {
    expect(parseGuestTable([["nama", "grup"], ["A", "B"]])).toMatchObject({ ok: false });
    expect(parseGuestTable([["", ""]])).toEqual({ ok: false, error: "File kosong." });
    expect(parseGuestTable([["nama", "whatsapp"]])).toEqual({ ok: false, error: "Tidak ada baris tamu di file." });
  });

  it("memberi hasil yang sama dengan CSV untuk data yang sama", () => {
    const csv = parseGuestCsv("nama;whatsapp;grup\nAyu;0811000010;Kantor\n");
    const tabel = parseGuestTable([["nama", "whatsapp", "grup"], ["Ayu", "0811000010", "Kantor"]]);
    expect(tabel).toEqual(csv);
  });
});
