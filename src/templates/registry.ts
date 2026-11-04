export const TEMPLATES = [
  { key: "melati", label: "Melati", ket: "Ivory dan sage, botani dengan tata letak editorial" },
  { key: "keraton", label: "Keraton", ket: "Zamrud dan emas, bingkai geometris yang formal" },
  { key: "bintang", label: "Malam Berbintang", ket: "Navy dan emas, orbit serta taburan bintang" },
  { key: "pasundan", label: "Pasundan", ket: "Gading hangat, garis alam dan pola perbukitan" },
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
