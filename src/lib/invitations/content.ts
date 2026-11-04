export const CONTENT_LIMITS = {
  kutipan: 300,
  sambutan: 1200,
  penutup: 600,
  pesanWa: 1000,
  pesanPengingat: 1000,
  bank: 40,
  nomorRekening: 32,
  namaRekening: 60,
  ceritaTahun: 20,
  ceritaJudul: 60,
  ceritaTeks: 400,
} as const;

export const MAX_REKENING = 2;
export const MAX_MOMEN = 6;

export type Rekening = { bank: string; nomor: string; atasNama: string };

export type Momen = { tahun: string; judul: string; teks: string };

export type UcapanSettings = { tampil: boolean; tahan: boolean };

export type HitungMundurSettings = { aktif: boolean; detik: boolean };

export type MusikSettings = { aktif: boolean };

export type CheckinSettings = { aktif: boolean };

export type BagianId =
  | "sampul"
  | "pembuka"
  | "salam"
  | "hitung"
  | "acara"
  | "cerita"
  | "galeri"
  | "rsvp"
  | "ucapan"
  | "amplop"
  | "penutup";

export const BAGIAN: readonly { id: BagianId; label: string; tetap: boolean; wajib: boolean }[] = [
  { id: "sampul", label: "Sampul", tetap: true, wajib: true },
  { id: "pembuka", label: "Pembuka", tetap: false, wajib: false },
  { id: "salam", label: "Salam dan sambutan", tetap: false, wajib: false },
  { id: "hitung", label: "Hitung mundur", tetap: false, wajib: false },
  { id: "acara", label: "Waktu dan tempat", tetap: false, wajib: false },
  { id: "cerita", label: "Cerita dan momen", tetap: false, wajib: false },
  { id: "galeri", label: "Galeri", tetap: false, wajib: false },
  { id: "rsvp", label: "Konfirmasi kehadiran", tetap: false, wajib: true },
  { id: "ucapan", label: "Pesan dan harapan", tetap: false, wajib: false },
  { id: "amplop", label: "Informasi rekening", tetap: false, wajib: false },
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
    const defaultIndex = BAGIAN_IDS.indexOf(id);
    const before = BAGIAN_IDS.slice(0, defaultIndex).filter((other) => urutan.includes(other));
    const at = before.length === 0 ? 0 : urutan.indexOf(before[before.length - 1]) + 1;
    urutan.splice(at, 0, id);
  }
  const hidden = Array.isArray(raw.sembunyi) ? raw.sembunyi.filter(isBagianId) : [];
  const fixed = new Set(BAGIAN.filter((item) => item.wajib).map((item) => item.id));
  return {
    urutan: ["sampul", ...urutan, "penutup"],
    sembunyi: [...new Set(hidden)].filter((id) => !fixed.has(id)),
  };
}

export const DEFAULT_SUSUNAN: Susunan = normalizeSusunan({});

export type InvitationContent = {
  kutipan: string;
  sambutan: string;
  penutup: string;
  pesanWa: string;
  pesanPengingat: string;
  amplop: Rekening[];
  cerita: Momen[];
  ucapan: UcapanSettings;
  hitungMundur: HitungMundurSettings;
  musik: MusikSettings;
  checkin: CheckinSettings;
  susunan: Susunan;
};

export const DEFAULT_UCAPAN: UcapanSettings = { tampil: true, tahan: false };
export const DEFAULT_HITUNG_MUNDUR: HitungMundurSettings = { aktif: true, detik: true };
export const DEFAULT_MUSIK: MusikSettings = { aktif: false };
export const DEFAULT_CHECKIN: CheckinSettings = { aktif: true };

function text(value: unknown, max: number): string {
  return typeof value === "string" ? value.slice(0, max) : "";
}

function flag(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function record(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function list(value: unknown, max: number): Record<string, unknown>[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item) => typeof item === "object" && item !== null && !Array.isArray(item))
    .slice(0, max) as Record<string, unknown>[];
}

export function readContent(raw: unknown): InvitationContent {
  const source = record(raw);
  const ucapan = record(source.ucapan);
  const hitung = record(source.hitungMundur);
  const musik = record(source.musik);
  const checkin = record(source.checkin);
  const susunan = record(source.susunan);
  return {
    kutipan: text(source.kutipan, CONTENT_LIMITS.kutipan),
    sambutan: text(source.sambutan, CONTENT_LIMITS.sambutan),
    penutup: text(source.penutup, CONTENT_LIMITS.penutup),
    pesanWa: text(source.pesanWa, CONTENT_LIMITS.pesanWa),
    pesanPengingat: text(source.pesanPengingat, CONTENT_LIMITS.pesanPengingat),
    amplop: list(source.amplop, MAX_REKENING).map((item) => ({
      bank: text(item.bank, CONTENT_LIMITS.bank),
      nomor: text(item.nomor, CONTENT_LIMITS.nomorRekening),
      atasNama: text(item.atasNama, CONTENT_LIMITS.namaRekening),
    })),
    cerita: list(source.cerita, MAX_MOMEN).map((item) => ({
      tahun: text(item.tahun, CONTENT_LIMITS.ceritaTahun),
      judul: text(item.judul, CONTENT_LIMITS.ceritaJudul),
      teks: text(item.teks, CONTENT_LIMITS.ceritaTeks),
    })),
    ucapan: {
      tampil: flag(ucapan.tampil, DEFAULT_UCAPAN.tampil),
      tahan: flag(ucapan.tahan, DEFAULT_UCAPAN.tahan),
    },
    hitungMundur: {
      aktif: flag(hitung.aktif, DEFAULT_HITUNG_MUNDUR.aktif),
      detik: flag(hitung.detik, DEFAULT_HITUNG_MUNDUR.detik),
    },
    musik: { aktif: flag(musik.aktif, DEFAULT_MUSIK.aktif) },
    checkin: { aktif: flag(checkin.aktif, DEFAULT_CHECKIN.aktif) },
    susunan: normalizeSusunan(susunan),
  };
}
