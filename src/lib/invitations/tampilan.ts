export type WarnaKustom = { utama: string; kertas: string; teks: string; aksen: string };
export type WarnaKunci = keyof WarnaKustom;

export const WARNA_KUNCI: readonly { key: WarnaKunci; label: string; hint: string }[] = [
  { key: "kertas", label: "Latar", hint: "Warna dasar halaman" },
  { key: "teks", label: "Teks", hint: "Warna isi dan keterangan" },
  { key: "utama", label: "Judul dan tombol", hint: "Judul, angka, dan tombol" },
  { key: "aksen", label: "Garis dan hiasan", hint: "Garis tipis dan pemisah" },
];

export const PALET_SIAP: readonly { key: string; label: string; warna: WarnaKustom }[] = [
  { key: "gading", label: "Gading dan emas", warna: { kertas: "#fbf6ea", teks: "#3d3426", utama: "#8a6420", aksen: "#b8934a" } },
  { key: "biru", label: "Putih dan biru tua", warna: { kertas: "#f7f9fc", teks: "#1f2a3d", utama: "#1d3a6b", aksen: "#7f93b5" } },
  { key: "zaitun", label: "Hijau zaitun", warna: { kertas: "#f4f5ec", teks: "#2f3626", utama: "#4b5d2a", aksen: "#8d9a63" } },
  { key: "bordeaux", label: "Bordeaux", warna: { kertas: "#fbf3f1", teks: "#3b2124", utama: "#7a1f2f", aksen: "#b5707a" } },
  { key: "malam", label: "Malam dan emas", warna: { kertas: "#1c1a17", teks: "#efe6d3", utama: "#d8b46a", aksen: "#a98a4d" } },
  { key: "monokrom", label: "Monokrom", warna: { kertas: "#ffffff", teks: "#1a1a1a", utama: "#111111", aksen: "#8a8a8a" } },
];

export const FONT_PILIHAN = [
  { key: "bawaan", label: "Bawaan template", judul: null, isi: null },
  { key: "lora-mulish", label: "Lora dan Mulish", judul: "'Lora',serif", isi: "'Mulish',sans-serif" },
  { key: "garamond-jost", label: "EB Garamond dan Jost", judul: "'EB Garamond',serif", isi: "'Jost',sans-serif" },
  { key: "cormorant-jost", label: "Cormorant Garamond dan Jost", judul: "'Cormorant Garamond',serif", isi: "'Jost',sans-serif" },
  { key: "playfair-mulish", label: "Playfair Display dan Mulish", judul: "'Playfair Display',serif", isi: "'Mulish',sans-serif" },
  { key: "bodoni-mulish", label: "Bodoni Moda dan Mulish", judul: "'Bodoni Moda',serif", isi: "'Mulish',sans-serif" },
  { key: "cinzel-jost", label: "Cinzel dan Jost", judul: "'Cinzel',serif", isi: "'Jost',sans-serif" },
  { key: "marcellus-jost", label: "Marcellus dan Jost", judul: "'Marcellus',serif", isi: "'Jost',sans-serif" },
] as const;

export type FontKey = (typeof FONT_PILIHAN)[number]["key"];

export type TampilanSettings = { hiasan: boolean; warna: WarnaKustom | null; font: FontKey };
export type SampulSettings = { sembunyikanTeks: boolean };

export const DEFAULT_TAMPILAN: TampilanSettings = { hiasan: true, warna: null, font: "bawaan" };
export const DEFAULT_SAMPUL: SampulSettings = { sembunyikanTeks: false };

const HEX = /^#[0-9a-f]{6}$/i;

export function normalizeHex(value: unknown): string | null {
  if (typeof value !== "string") return null;
  let text = value.trim();
  if (/^[0-9a-f]{3}$/i.test(text.replace("#", ""))) {
    const short = text.replace("#", "");
    text = `#${short[0]}${short[0]}${short[1]}${short[1]}${short[2]}${short[2]}`;
  } else if (/^[0-9a-f]{6}$/i.test(text)) {
    text = `#${text}`;
  }
  return HEX.test(text) ? text.toLowerCase() : null;
}

export function isFontKey(value: unknown): value is FontKey {
  return typeof value === "string" && FONT_PILIHAN.some((item) => item.key === value);
}

export function readWarna(raw: unknown): WarnaKustom | null {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return null;
  const source = raw as Record<string, unknown>;
  const utama = normalizeHex(source.utama);
  const kertas = normalizeHex(source.kertas);
  const teks = normalizeHex(source.teks);
  const aksen = normalizeHex(source.aksen);
  return utama && kertas && teks && aksen ? { utama, kertas, teks, aksen } : null;
}

export function readTampilan(raw: unknown): TampilanSettings {
  const source = typeof raw === "object" && raw !== null && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  return {
    hiasan: typeof source.hiasan === "boolean" ? source.hiasan : DEFAULT_TAMPILAN.hiasan,
    warna: readWarna(source.warna),
    font: isFontKey(source.font) ? source.font : DEFAULT_TAMPILAN.font,
  };
}

export function readSampul(raw: unknown): SampulSettings {
  const source = typeof raw === "object" && raw !== null && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  return { sembunyikanTeks: typeof source.sembunyikanTeks === "boolean" ? source.sembunyikanTeks : DEFAULT_SAMPUL.sembunyikanTeks };
}

export function fontPilihan(key: FontKey) {
  return FONT_PILIHAN.find((item) => item.key === key) ?? FONT_PILIHAN[0];
}

function luminans(hex: string): number {
  const channel = (offset: number) => {
    const value = parseInt(hex.slice(offset, offset + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
}

export function rasioKontras(a: string, b: string): number {
  const [terang, gelap] = [luminans(a), luminans(b)].sort((x, y) => y - x);
  return (terang + 0.05) / (gelap + 0.05);
}

export const KONTRAS_MINIMUM = 4.5;

export function peringatanKontras(warna: WarnaKustom): string[] {
  const hasil: string[] = [];
  if (rasioKontras(warna.teks, warna.kertas) < KONTRAS_MINIMUM) hasil.push("Warna teks kurang kontras terhadap latar sehingga sulit dibaca.");
  if (rasioKontras(warna.utama, warna.kertas) < KONTRAS_MINIMUM) hasil.push("Warna judul dan tombol kurang kontras terhadap latar.");
  return hasil;
}

export function warnaTerang(hex: string): boolean {
  return luminans(hex) > 0.5;
}
