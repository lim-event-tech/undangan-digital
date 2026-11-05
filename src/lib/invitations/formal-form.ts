import { multiLine, singleLine } from "@/lib/form-text";
import { normalizePhone } from "@/lib/phone";
import type { FieldErrors } from "@/lib/save-result";
import { isUuid } from "@/lib/uuid";
import { CONTENT_LIMITS, MAX_PENGISI_ACARA, type InvitationContent, type PengisiAcara } from "./content";

export const FORMAL_FIELDS = {
  identitas: [
    { key: "jenis", label: "Jenis event", max: CONTENT_LIMITS.jenis, area: false, placeholder: "Seminar, rapat kerja, peluncuran produk…" },
    { key: "subjudul", label: "Subjudul", max: CONTENT_LIMITS.subjudul, area: false, placeholder: "Tema atau fokus kegiatan" },
    { key: "deskripsi", label: "Deskripsi event", max: CONTENT_LIMITS.deskripsi, area: true, placeholder: "Tujuan kegiatan dan informasi utama untuk peserta" },
  ],
  penyelenggara: [
    { key: "nama", label: "Nama penyelenggara", max: CONTENT_LIMITS.nama, area: false, placeholder: "Instansi atau perusahaan pemilik acara" },
    { key: "namaEo", label: "Nama event organizer", max: CONTENT_LIMITS.nama, area: false, placeholder: "EO yang mengelola acara, bila ada" },
  ],
  informasiPeserta: [
    { key: "dressCode", label: "Dress code", max: CONTENT_LIMITS.dressCode, area: false, placeholder: "Contoh: Busana formal atau batik" },
    { key: "ketentuan", label: "Ketentuan kehadiran", max: CONTENT_LIMITS.ketentuan, area: true, placeholder: "Ketentuan yang perlu diketahui peserta" },
    { key: "petunjukLokasi", label: "Petunjuk lokasi", max: CONTENT_LIMITS.petunjukLokasi, area: true, placeholder: "Akses masuk, registrasi, atau informasi parkir" },
  ],
  kontak: [
    { key: "nama", label: "Nama PIC", max: CONTENT_LIMITS.nama, area: false, placeholder: "Nama panitia yang dapat dihubungi" },
    { key: "telepon", label: "WhatsApp PIC", max: 30, area: false, placeholder: "08… atau +628…" },
    { key: "email", label: "Email PIC", max: CONTENT_LIMITS.email, area: false, placeholder: "panitia@perusahaan.id" },
  ],
} as const;

export type SimpleFormalGroup = keyof typeof FORMAL_FIELDS;
export type FormalGroup = SimpleFormalGroup | "pengisiAcara";
type Parsed = { ok: true; input: Partial<InvitationContent> } | { ok: false; errors: FieldErrors };

export function parseFormalForm(group: unknown, data: FormData): Parsed {
  if (group === "pengisiAcara") return parsePengisi(data);
  if (typeof group !== "string" || !Object.hasOwn(FORMAL_FIELDS, group)) {
    return { ok: false, errors: { bagian: "Bagian tidak dikenal" } };
  }
  const key = group as SimpleFormalGroup;
  const input: Record<string, string> = {};
  const errors: FieldErrors = {};
  for (const field of FORMAL_FIELDS[key]) {
    const value = field.area ? multiLine(data, field.key) : singleLine(data, field.key);
    input[field.key] = value;
    if (value.length > field.max) errors[field.key] = `${field.label} maksimal ${field.max} karakter`;
  }
  if (key === "kontak") {
    const { nama, telepon, email } = input;
    if (nama || telepon || email) {
      if (!nama) errors.nama = "Nama PIC wajib diisi";
      if (!telepon && !email) errors.telepon = "Isi nomor WhatsApp atau email PIC";
      if (telepon) {
        const phone = normalizePhone(telepon);
        if (phone.ok) input.telepon = phone.value;
        else errors.telepon = phone.error;
      }
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Email PIC tidak valid";
      input.email = email.toLowerCase();
    }
  }
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, input: { [key]: input } };
}

function parsePengisi(data: FormData): Parsed {
  const keys = ["id", "nama", "peran", "instansi", "profil"] as const;
  const columns = Object.fromEntries(keys.map((key) => [key, data.getAll(key)]));
  const count = Math.max(...keys.map((key) => columns[key].length));
  const errors: FieldErrors = {};
  const pengisiAcara: PengisiAcara[] = [];
  if (count > MAX_PENGISI_ACARA) return { ok: false, errors: { pengisiAcara: `Maksimal ${MAX_PENGISI_ACARA} pengisi acara` } };
  const seen = new Set<string>();
  for (let i = 0; i < count; i++) {
    const row = new FormData();
    for (const key of keys) row.set(key, columns[key][i] ?? "");
    const item = {
      id: singleLine(row, "id").toLowerCase(), nama: singleLine(row, "nama"),
      peran: singleLine(row, "peran"), instansi: singleLine(row, "instansi"), profil: multiLine(row, "profil"),
    };
    if (!isUuid(item.id) || seen.has(item.id)) errors.pengisiAcara = "ID pengisi acara tidak valid atau berulang";
    seen.add(item.id);
    if (!item.nama) errors[`nama-${i}`] = "Nama pengisi acara wajib diisi";
    for (const key of ["nama", "peran", "instansi", "profil"] as const) {
      const max = key === "profil" ? CONTENT_LIMITS.profil : CONTENT_LIMITS.nama;
      if (item[key].length > max) errors[`${key}-${i}`] = `Maksimal ${max} karakter`;
    }
    pengisiAcara.push(item);
  }
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, input: { pengisiAcara } };
}
