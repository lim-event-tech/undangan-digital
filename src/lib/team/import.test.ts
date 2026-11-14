import { describe, expect, it } from "vitest";
import { readXlsx } from "@/lib/xlsx";
import {
  TEAM_COLUMNS,
  parseTeamCsv,
  parseTeamTable,
  summarizeTeamRows,
  validateTeamImportRows,
  type TeamImportContext,
} from "./import";
import { buildTeamTemplateXlsx } from "./template";

const konteks: TeamImportContext = {
  ownerEmail: "owner@example.com",
  memberEmails: ["anggota1@example.com"],
  pendingEmails: ["tertunda@example.com"],
  maxMembers: 5,
};

describe("team import parser & validator", () => {
  it("membaca CSV dan tabel Excel dengan alias header dan melewati baris kosong", () => {
    const csv = parseTeamCsv(
      "Surel;Role;Checkin\nsales1@example.com;anggota;milik\n\nco@example.com;pemilik;\n",
    );
    expect(csv.ok).toBe(true);
    if (!csv.ok) return;
    expect(csv.rows).toHaveLength(2);
    expect(csv.rows[0]).toMatchObject({
      row: 2,
      email: "sales1@example.com",
      peran: "anggota",
      hak_checkin: "milik",
    });

    const tabel = parseTeamTable([
      ["email", "peran", "hak_checkin"],
      ["sales1@example.com", "anggota", "milik"],
      ["", "", ""],
      ["co@example.com", "pemilik", ""],
    ]);
    expect(tabel.ok).toBe(true);
    if (!tabel.ok) return;
    expect(tabel.rows).toHaveLength(2);
    expect(tabel.rows[1].row).toBe(4);
  });

  it("menolak file kosong atau tanpa kolom email", () => {
    expect(parseTeamCsv("")).toEqual({ ok: false, error: "File kosong." });
    expect(parseTeamTable([["peran", "hak_checkin"], ["anggota", "milik"]])).toMatchObject({
      ok: false,
      error: expect.stringContaining("email"),
    });
  });

  it("memvalidasi email, duplikat, pemilik, anggota aktif, undang ulang, peran, dan kuota", () => {
    const tabel = parseTeamTable([
      ["email", "peran", "hak_checkin"],
      ["sales1@example.com", "", ""],
      ["Tertunda@Example.com", "anggota", "semua"],
      ["sales1@example.com", "anggota", "milik"],
      ["owner@example.com", "anggota", "milik"],
      ["anggota1@example.com", "anggota", "milik"],
      ["bukan-email", "salah", "salah"],
      ["co@example.com", "pemilik", "tidak"],
      ["extra1@example.com", "anggota", "milik"],
      ["extra2@example.com", "anggota", "milik"],
    ]);
    expect(tabel.ok).toBe(true);
    if (!tabel.ok) return;

    const hasil = validateTeamImportRows(tabel.rows, konteks);
    expect(hasil[0]).toMatchObject({ status: "siap", role: "anggota", checkinAccess: "milik", resend: false });
    expect(hasil[1]).toMatchObject({ status: "siap", resend: true, checkinAccess: "semua" });
    expect(hasil[2]).toMatchObject({ status: "duplikat", duplicateOf: "baris 2" });
    expect(hasil[3]).toMatchObject({ status: "perlu_diperbaiki" });
    expect(hasil[4]).toMatchObject({ status: "perlu_diperbaiki" });
    expect(hasil[5].issues.length).toBe(3);
    // Pemilik otomatis memakai hak_checkin "semua"
    expect(hasil[6]).toMatchObject({ status: "siap", role: "pemilik", checkinAccess: "semua" });
    // Sisa kuota = 5 - 1 member - 1 pending = 3 slot baru (sales1, co, extra1 = 3; extra2 melebihi kuota)
    expect(hasil[7]).toMatchObject({ status: "siap" });
    expect(hasil[8]).toMatchObject({ status: "perlu_diperbaiki" });

    expect(summarizeTeamRows(hasil)).toEqual({
      ready: 4,
      invalid: 4,
      duplicate: 1,
      total: 9,
    });
  });
});

describe("buildTeamTemplateXlsx", () => {
  it("menghasilkan workbook Excel yang dapat diisi dan diunggah kembali", () => {
    const bytes = buildTeamTemplateXlsx(konteks);
    const parsed = readXlsx(new Uint8Array(bytes));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    expect(parsed.rows).toEqual([[...TEAM_COLUMNS]]);

    const diisi = [
      ...parsed.rows,
      ["sales1@gmail.com", "anggota", "milik"],
      ["coowner@gmail.com", "pemilik", "semua"],
    ];
    const tabel = parseTeamTable(diisi);
    expect(tabel.ok).toBe(true);
    if (!tabel.ok) return;

    const validasi = validateTeamImportRows(tabel.rows, konteks);
    expect(validasi.map((r) => r.status)).toEqual(["siap", "siap"]);
  });
});
