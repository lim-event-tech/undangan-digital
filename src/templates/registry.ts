export const TEMPLATES = [
  { key: "melati", label: "Paviliun", ket: "Marun dan emas, siluet paviliun serta taman", preview: "paviliun" },
  { key: "keraton", label: "Keraton", ket: "Zamrud dan emas, bingkai geometris yang formal", preview: "keraton" },
  { key: "bintang", label: "Malam Berbintang", ket: "Navy dan emas, bulan sabit serta rasi bintang", preview: "malam-berbintang" },
  { key: "pasundan", label: "Tembaga", ket: "Warna tembaga, motif kipas dan komposisi geometris", preview: "tembaga" },
] as const satisfies readonly { key: string; label: string; ket: string; preview: string }[];

export type TemplateKey = (typeof TEMPLATES)[number]["key"];

export const DEFAULT_TEMPLATE: TemplateKey = "melati";

export function isTemplateKey(value: unknown): value is TemplateKey {
  return typeof value === "string" && TEMPLATES.some((t) => t.key === value);
}

export function templateInfo(key: string) {
  return TEMPLATES.find((t) => t.key === key) ?? TEMPLATES[0];
}

export function namaTemplate(key: string, label?: string | null): string {
  const lama: Record<string, readonly string[]> = { melati: ["Melati", "Editorial Gading", "Paviliun Senja"], pasundan: ["Pasundan", "Tembaga Geometris"] };
  return !label || lama[key]?.includes(label) ? templateInfo(key).label : label;
}

export type GambarTemplate = { hp: string; desktop: string };

export function gambarTemplate(key: string): GambarTemplate {
  const { preview } = templateInfo(key);
  return { hp: `/template/${preview}-hp.jpg`, desktop: `/template/${preview}-desktop.jpg` };
}

export type PilihanTemplate = {
  key: string;
  label: string;
  ket: string;
  ribbon: string | null;
  gambar: GambarTemplate;
};

export function keDaftarPilihan(
  katalog: readonly { key: string; label: string; ribbon: string | null }[],
): PilihanTemplate[] {
  return katalog.map((t) => {
    const info = templateInfo(t.key);
    return { key: t.key, label: namaTemplate(t.key, t.label), ket: info.ket, ribbon: t.ribbon, gambar: gambarTemplate(t.key) };
  });
}
