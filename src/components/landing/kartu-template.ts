import type { TemplateKey } from "@/templates/registry";

export type KartuTemplate = { ket: string };

export const KARTU_TEMPLATE: Record<TemplateKey, KartuTemplate> = {
  melati: { ket: "Ivory dan sage, untaian melati, kupu-kupu" },
  keraton: { ket: "Hijau zamrud dan emas, gapura berukir" },
  bintang: { ket: "Navy klasik, willow, kunang-kunang" },
  pasundan: { ket: "Siger, angklung, mega mendung, sawah" },
};

const ANGKA = ["Nol", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh"];

export function angkaKata(n: number): string {
  return Number.isInteger(n) && n >= 0 && n < ANGKA.length ? ANGKA[n] : String(n);
}
