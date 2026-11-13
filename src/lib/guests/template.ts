import { COLUMNS, type ImportContext } from "@/lib/guests/import";
import { buildXlsx, type XlsxCell } from "@/lib/xlsx";

/**
 * Membangun file Excel template impor tamu yang disesuaikan dengan daftar acara,
 * grup, dan bawaan kapasitas peserta undangan terkait.
 * Sheet pertama (`Daftar undangan`) hanya berisi header agar pengguna bisa langsung
 * mengisi data dari baris ke-2 dan mengunggahnya kembali.
 */
export function buildGuestTemplateXlsx(
  context: Pick<ImportContext, "events" | "groups" | "defaults">,
): Buffer {
  const header: XlsxCell[] = [...COLUMNS];
  const daftarAcara = context.events.map((e) => e.name).join("; ");
  const grupTersedia = context.groups.join(", ");
  const acaraContohSemua = context.events.map((e) => e.name).join(";");
  const acaraContohSatu = context.events[0]?.name ?? "";
  const grupContoh = context.groups[0] ?? "Keluarga";

  const panduanRows: XlsxCell[][] = [
    ["Kolom", "Keterangan", "Wajib?"],
    ["nama", "Nama lengkap tamu atau penerima undangan.", "Ya"],
    [
      "whatsapp",
      "Nomor WhatsApp aktif (contoh: 081234567890 atau +6281234567890). Awali tanda petik satu (') di Excel jika angka 0 di depan hilang.",
      "Ya",
    ],
    [
      "grup",
      grupTersedia
        ? `Nama grup tamu. Grup baru otomatis dibuat jika belum ada. Grup saat ini: ${grupTersedia}.`
        : "Nama grup tamu (opsional). Grup baru otomatis dibuat jika belum ada.",
      "Tidak",
    ],
    [
      "acara",
      daftarAcara
        ? `Nama atau kunci acara, pisahkan dengan tanda titik koma (;) jika lebih dari satu. Kosongkan untuk mengundang ke semua acara. Acara saat ini: ${daftarAcara}.`
        : "Nama atau kunci acara, pisahkan dengan tanda titik koma (;). Kosongkan untuk mengundang ke semua acara.",
      "Tidak",
    ],
    [
      "maks_peserta",
      `Jumlah maksimal peserta (1 sampai 99). Kosongkan untuk memakai bawaan undangan (${context.defaults.maxAttendees}).`,
      "Tidak",
    ],
    [],
  ];

  if (context.events.length > 0) {
    panduanRows.push(["Daftar Acara pada Undangan Ini", "Kunci Acara"]);
    for (const ev of context.events) {
      panduanRows.push([ev.name, ev.key]);
    }
    panduanRows.push([]);
  }

  panduanRows.push(
    ['Contoh Pengisian (salin/isi di sheet "Daftar undangan")'],
    header,
    [
      "Bapak Hendra Permana",
      "081200000101",
      grupContoh,
      acaraContohSemua,
      context.defaults.maxAttendees,
    ],
    [
      "Ibu Dian Pratiwi",
      "+6285700000102",
      "Mitra",
      acaraContohSatu,
      1,
    ],
    ["Panitia Registrasi", "081100000103", "", "", ""],
  );

  return buildXlsx([
    { name: "Daftar undangan", rows: [header] },
    { name: "Panduan & Contoh", rows: panduanRows, wrap: [1] },
  ]);
}

