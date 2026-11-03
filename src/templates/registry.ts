export const TEMPLATES = [
  { key: "melati", label: "Melati", ket: "Ivory dan sage, untaian melati" },
  { key: "keraton", label: "Keraton", ket: "Hijau zamrud dan emas, gapura" },
  { key: "bintang", label: "Malam Berbintang", ket: "Navy klasik, willow, kunang-kunang" },
  { key: "pasundan", label: "Pasundan", ket: "Siger, angklung, mega mendung" },
] as const satisfies readonly { key: string; label: string; ket: string }[];

export type TemplateKey = (typeof TEMPLATES)[number]["key"];

export const DEFAULT_TEMPLATE: TemplateKey = "melati";

export function isTemplateKey(value: unknown): value is TemplateKey {
  return typeof value === "string" && TEMPLATES.some((t) => t.key === value);
}

export function templateInfo(key: string) {
  return TEMPLATES.find((t) => t.key === key) ?? TEMPLATES[0];
}

export type GambarTemplate = { hp: string; desktop: string };

export function gambarTemplate(key: string): GambarTemplate {
  const aman = isTemplateKey(key) ? key : DEFAULT_TEMPLATE;
  return { hp: `/template/${aman}-hp.jpg`, desktop: `/template/${aman}-desktop.jpg` };
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
    return { key: t.key, label: t.label, ket: info.ket, ribbon: t.ribbon, gambar: gambarTemplate(t.key) };
  });
}
