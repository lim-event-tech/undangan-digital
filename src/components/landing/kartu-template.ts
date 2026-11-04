import { templateInfo, type TemplateKey } from "@/templates/registry";

export type KartuTemplate = { ket: string };

export const KARTU_TEMPLATE: Record<TemplateKey, KartuTemplate> = {
  melati: { ket: templateInfo("melati").ket },
  keraton: { ket: templateInfo("keraton").ket },
  bintang: { ket: templateInfo("bintang").ket },
  pasundan: { ket: templateInfo("pasundan").ket },
};

const ANGKA = ["Nol", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan", "Sepuluh"];

export function angkaKata(n: number): string {
  return Number.isInteger(n) && n >= 0 && n < ANGKA.length ? ANGKA[n] : String(n);
}
