import { isUuid } from "@/lib/uuid";
import { readSampul, readTampilan, type SampulSettings, type TampilanSettings } from "./tampilan";

export const CONTENT_LIMITS = {
  sambutan: 1200, penutup: 600, pesanWa: 1000, pesanPengingat: 1000,
  jenis: 60, deskripsi: 1200, nama: 120, profil: 400, email: 254,
} as const;

export const MAX_PENGISI_ACARA = 12;
export type IdentitasEvent = { jenis: string; deskripsi: string };
export type Penyelenggara = { nama: string; namaEo: string };
export type PengisiAcara = { id: string; nama: string; peran: string; instansi: string; profil: string; fotoId?: string };
export type Kontak = { nama: string; telepon: string; email: string };

export type CheckinSettings = { aktif: boolean };

export type WaPosterSettings = { kirim: boolean; sumber: "sama" | "khusus" };

export type BagianId =
  | "sampul" | "tentang" | "salam" | "penyelenggara"
  | "acara" | "agenda" | "pengisi" | "rsvp" | "kontak" | "penutup";

export const BAGIAN: readonly { id: BagianId; label: string; tetap: boolean; wajib: boolean }[] = [
  { id: "sampul", label: "Sampul", tetap: true, wajib: true },
  { id: "tentang", label: "Tentang event", tetap: false, wajib: false },
  { id: "salam", label: "Sambutan", tetap: false, wajib: false },
  { id: "acara", label: "Waktu dan lokasi", tetap: false, wajib: false },
  { id: "agenda", label: "Agenda", tetap: false, wajib: false },
  { id: "pengisi", label: "Pengisi acara", tetap: false, wajib: false },
  { id: "rsvp", label: "Konfirmasi kehadiran", tetap: false, wajib: true },
  { id: "penyelenggara", label: "Penyelenggara", tetap: false, wajib: false },
  { id: "kontak", label: "Narahubung", tetap: false, wajib: false },
  { id: "penutup", label: "Penutup", tetap: true, wajib: true },
];

export type Susunan = { urutan: BagianId[]; sembunyi: BagianId[] };
const BAGIAN_IDS = BAGIAN.map((item) => item.id);
export function isBagianId(value: unknown): value is BagianId {
  return typeof value === "string" && (BAGIAN_IDS as string[]).includes(value);
}
export function normalizeSusunan(raw: { urutan?: unknown; sembunyi?: unknown }): Susunan {
  const given = Array.isArray(raw.urutan) ? raw.urutan.filter(isBagianId) : [];
  const urutan: BagianId[] = [...new Set(given)].filter((id) => id !== "sampul" && id !== "penutup");
  for (const id of BAGIAN_IDS) {
    if (id === "sampul" || id === "penutup" || urutan.includes(id)) continue;
    const before = BAGIAN_IDS.slice(0, BAGIAN_IDS.indexOf(id)).filter((other) => urutan.includes(other));
    const at = before.length === 0 ? 0 : urutan.indexOf(before[before.length - 1]) + 1;
    urutan.splice(at, 0, id);
  }
  const hidden = Array.isArray(raw.sembunyi) ? raw.sembunyi.filter(isBagianId) : [];
  const fixed = new Set(BAGIAN.filter((item) => item.wajib).map((item) => item.id));
  return { urutan: ["sampul", ...urutan, "penutup"], sembunyi: [...new Set(hidden)].filter((id) => !fixed.has(id)) };
}
export const DEFAULT_SUSUNAN: Susunan = normalizeSusunan({});
export type InvitationContent = {
  identitas: IdentitasEvent;
  penyelenggara: Penyelenggara;
  pengisiAcara: PengisiAcara[];
  kontak: Kontak;
  sambutan: string;
  penutup: string;
  pesanWa: string;
  pesanPengingat: string;
  checkin: CheckinSettings;
  waPoster: WaPosterSettings;
  sampul: SampulSettings;
  tampilan: TampilanSettings;
  susunan: Susunan;
  wabaTemplate?: string;
  wabaTemplatePengingat?: string;
  wabaMedia?: {
    photoId: string;
    mediaId: string;
    uploadedAt: string;
  };
};
export const DEFAULT_CHECKIN: CheckinSettings = { aktif: true };
export const DEFAULT_WA_POSTER: WaPosterSettings = { kirim: false, sumber: "sama" };

function text(value: unknown, max: number): string { return typeof value === "string" ? value.slice(0, max).trim() : ""; }
function flag(value: unknown, fallback: boolean): boolean { return typeof value === "boolean" ? value : fallback; }
function record(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {};
}
export function readContent(raw: unknown): InvitationContent {
  const source = record(raw);
  const identitas = record(source.identitas);
  const penyelenggara = record(source.penyelenggara);
  const kontak = record(source.kontak);
  const checkin = record(source.checkin);
  const waPoster = record(source.waPoster);
  const seen = new Set<string>();
  const pengisiAcara: PengisiAcara[] = [];
  for (const rawItem of Array.isArray(source.pengisiAcara) ? source.pengisiAcara : []) {
    const item = record(rawItem);
    if (typeof item.nama !== "string" || !item.nama.trim() || !isUuid(item.id) || seen.has(item.id.toLowerCase()) || pengisiAcara.length >= MAX_PENGISI_ACARA) continue;
    const id = item.id.toLowerCase();
    seen.add(id);
    pengisiAcara.push({ id, nama: text(item.nama, 120), peran: text(item.peran, 120), instansi: text(item.instansi, 120), profil: text(item.profil, 400), ...(isUuid(item.fotoId) ? { fotoId: item.fotoId.toLowerCase() } : {}) });
  }
  return {
    identitas: { jenis: text(identitas.jenis, 60), deskripsi: text(identitas.deskripsi, 1200) },
    penyelenggara: { nama: text(penyelenggara.nama, 120), namaEo: text(penyelenggara.namaEo, 120) },
    pengisiAcara,
    kontak: { nama: text(kontak.nama, 120), telepon: text(kontak.telepon, 20), email: text(kontak.email, 254) },
    sambutan: text(source.sambutan, CONTENT_LIMITS.sambutan), penutup: text(source.penutup, CONTENT_LIMITS.penutup),
    pesanWa: text(source.pesanWa, CONTENT_LIMITS.pesanWa), pesanPengingat: text(source.pesanPengingat, CONTENT_LIMITS.pesanPengingat),
    checkin: { aktif: flag(checkin.aktif, DEFAULT_CHECKIN.aktif) },
    waPoster: { kirim: flag(waPoster.kirim, DEFAULT_WA_POSTER.kirim), sumber: waPoster.sumber === "khusus" ? "khusus" : "sama" },
    sampul: readSampul(source.sampul),
    tampilan: readTampilan(source.tampilan),
    susunan: normalizeSusunan(record(source.susunan)),
    wabaTemplate: typeof source.wabaTemplate === "string" ? source.wabaTemplate.trim() : undefined,
    wabaTemplatePengingat: typeof source.wabaTemplatePengingat === "string" ? source.wabaTemplatePengingat.trim() : undefined,
    wabaMedia:
      source.wabaMedia &&
      typeof source.wabaMedia === "object" &&
      !Array.isArray(source.wabaMedia) &&
      typeof (source.wabaMedia as Record<string, unknown>).photoId === "string" &&
      typeof (source.wabaMedia as Record<string, unknown>).mediaId === "string"
        ? {
            photoId: (source.wabaMedia as Record<string, unknown>).photoId as string,
            mediaId: (source.wabaMedia as Record<string, unknown>).mediaId as string,
            uploadedAt:
              typeof (source.wabaMedia as Record<string, unknown>).uploadedAt === "string"
                ? ((source.wabaMedia as Record<string, unknown>).uploadedAt as string)
                : new Date().toISOString(),
          }
        : undefined,
  };
}
