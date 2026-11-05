import type { TemplateKey } from "@/templates/registry";

export const FOTO_CONTOH: Record<TemplateKey, { src: string; width: number; height: number }> = {
  melati: { src: "/template/assets/melati.webp", width: 1051, height: 1400 },
  keraton: { src: "/template/assets/keraton.webp", width: 1100, height: 733 },
  bintang: { src: "/template/assets/bintang.webp", width: 1100, height: 733 },
  pasundan: { src: "/template/assets/pasundan.webp", width: 788, height: 1400 },
};
