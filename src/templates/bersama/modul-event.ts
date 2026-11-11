import type { TemplateKey } from "@/templates/registry";
import { buatBagian, Progres } from "./bagian-event";
import type { ModulTemplate } from "./jenis";

export function buatModulEvent(kunci: TemplateKey, warna: { utama: string; kertas: string; lembut: string; teks: string }): ModulTemplate {
  const bagian = buatBagian(kunci);
  return {
    kunci,
    akar: {},
    kertas: { className: "event-kertas", style: {} },
    bagian,
    palet: {
      on: { bg: warna.utama, fg: warna.kertas, bd: warna.utama },
      off: { bg: warna.kertas, fg: warna.teks, bd: warna.lembut },
    },
    Progres,
  };
}
