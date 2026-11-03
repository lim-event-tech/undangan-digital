export const ANNOUNCEMENT_KINDS = ["info", "pemeliharaan", "fitur-baru"] as const;

export type AnnouncementKind = (typeof ANNOUNCEMENT_KINDS)[number];

export const ANNOUNCEMENT_LABEL: Record<AnnouncementKind, string> = {
  info: "Info",
  pemeliharaan: "Pemeliharaan",
  "fitur-baru": "Fitur baru",
};

export const SETTING_LIMITS = {
  pengumuman: 300,
  pesanPemeliharaan: 300,
  pesanWa: 1000,
  slugCadangan: 40,
  jumlahSlugCadangan: 100,
} as const;

export type PlatformSettings = {
  daftarTerbuka: boolean;
  pengumuman: { teks: string; jenis: AnnouncementKind; sampai: string | null };
  pemeliharaan: { aktif: boolean; pesan: string };
  slugCadangan: string[];
  pesanWaBawaan: string;
};

export const DEFAULT_SETTINGS: PlatformSettings = {
  daftarTerbuka: true,
  pengumuman: { teks: "", jenis: "info", sampai: null },
  pemeliharaan: { aktif: false, pesan: "Kami sedang melakukan pemeliharaan. Silakan kembali beberapa saat lagi." },
  slugCadangan: [],
  pesanWaBawaan: "",
};

function record(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function text(value: unknown, max: number, fallback: string): string {
  return typeof value === "string" ? value.slice(0, max) : fallback;
}

export function normalizeReservedSlug(input: string): string | null {
  const slug = input.trim().toLowerCase();
  if (slug.length < 1 || slug.length > SETTING_LIMITS.slugCadangan) return null;
  return /^[a-z0-9_]+(?:-[a-z0-9_]+)*$/.test(slug) ? slug : null;
}

export function readSettings(raw: Record<string, unknown>): PlatformSettings {
  const pengumuman = record(raw.pengumuman);
  const pemeliharaan = record(raw.pemeliharaan);
  const jenis = pengumuman.jenis;
  const sampai = pengumuman.sampai;
  const slugs = Array.isArray(raw.slugCadangan) ? raw.slugCadangan : [];
  return {
    daftarTerbuka:
      typeof raw.daftarTerbuka === "boolean" ? raw.daftarTerbuka : DEFAULT_SETTINGS.daftarTerbuka,
    pengumuman: {
      teks: text(pengumuman.teks, SETTING_LIMITS.pengumuman, ""),
      jenis: (ANNOUNCEMENT_KINDS as readonly unknown[]).includes(jenis)
        ? (jenis as AnnouncementKind)
        : "info",
      sampai: typeof sampai === "string" && /^\d{4}-\d{2}-\d{2}$/.test(sampai) ? sampai : null,
    },
    pemeliharaan: {
      aktif: typeof pemeliharaan.aktif === "boolean" ? pemeliharaan.aktif : false,
      pesan: text(
        pemeliharaan.pesan,
        SETTING_LIMITS.pesanPemeliharaan,
        DEFAULT_SETTINGS.pemeliharaan.pesan,
      ),
    },
    slugCadangan: [
      ...new Set(
        slugs
          .map((item) => (typeof item === "string" ? normalizeReservedSlug(item) : null))
          .filter((item): item is string => item !== null),
      ),
    ].slice(0, SETTING_LIMITS.jumlahSlugCadangan),
    pesanWaBawaan: text(raw.pesanWaBawaan, SETTING_LIMITS.pesanWa, ""),
  };
}

export function activeAnnouncement(
  settings: PlatformSettings,
  today: string,
): PlatformSettings["pengumuman"] | null {
  const { pengumuman } = settings;
  if (!pengumuman.teks.trim()) return null;
  if (pengumuman.sampai && today > pengumuman.sampai) return null;
  return pengumuman;
}
