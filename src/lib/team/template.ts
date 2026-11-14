import { buildXlsx, type XlsxCell } from "@/lib/xlsx";
import { TEAM_COLUMNS, type TeamImportContext } from "./import";

/**
 * Membangun workbook Excel template impor anggota tim.
 * Sheet pertama (`Daftar tim`) hanya berisi header agar pengguna bisa langsung
 * mengisi data dari baris ke-2 dan mengunggahnya kembali.
 */
export function buildTeamTemplateXlsx(context: TeamImportContext): Buffer {
  const header: XlsxCell[] = [...TEAM_COLUMNS];
  const sisaKuota = Math.max(
    0,
    context.maxMembers - context.memberEmails.length - context.pendingEmails.length,
  );

  const panduanRows: XlsxCell[][] = [
    ["Kolom", "Keterangan", "Wajib?"],
    [
      "email",
      "Alamat email aktif calon anggota tim (digunakan saat masuk dengan Google).",
      "Ya",
    ],
    [
      "peran",
      'Peran tim: "anggota" (hanya melihat & mengelola tamu miliknya) atau "pemilik" (setara pemilik undangan). Kosongkan untuk bawaan "anggota".',
      "Tidak",
    ],
    [
      "hak_checkin",
      'Hak check-in: "tidak", "milik" (tamu miliknya saja), atau "semua" (semua tamu). Kosongkan untuk bawaan "milik" (atau "semua" jika peran pemilik).',
      "Tidak",
    ],
    [],
    ["Informasi Kuota Tim", `Sisa kuota: ${sisaKuota} dari maksimal ${context.maxMembers} anggota.`],
    [],
    ['Contoh Pengisian (salin/isi di sheet "Daftar tim")'],
    header,
    ["sales1@gmail.com", "anggota", "milik"],
    ["sales2@gmail.com", "anggota", "semua"],
    ["panitia@gmail.com", "anggota", "tidak"],
    ["coowner@gmail.com", "pemilik", "semua"],
  ];

  return buildXlsx([
    { name: "Daftar tim", rows: [header] },
    { name: "Panduan & Contoh", rows: panduanRows, wrap: [1] },
  ]);
}
