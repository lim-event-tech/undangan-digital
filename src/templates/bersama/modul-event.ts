import type { TemplateKey } from "@/templates/registry";
import { buatBagian, Lightbox, Musik, Progres } from "./bagian-event";
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
      avatar: [warna.lembut, "#eee6d6", "#e8e1d5", "#e0e8dc"],
      lencana: {
        hadir: ["Hadir", "#e3ebdf", "#344b2e"],
        tidak: ["Tidak hadir", "#f2e3db", "#783d2b"],
        belum: ["Tamu undangan", "#eee7d8", "#5e4c2f"],
      },
      galeriWarna: [
        `linear-gradient(145deg, ${warna.lembut}, #c0c9b7)`,
        "linear-gradient(145deg, #ede4d3, #c4b69b)",
        "linear-gradient(145deg, #e8dcd2, #c4a895)",
        `linear-gradient(145deg, #dedfca, ${warna.lembut})`,
        "linear-gradient(145deg, #e5e7d7, #adb9a1)",
        "linear-gradient(145deg, #eee5d8, #c7b9a4)",
      ],
    },
    Progres,
    Lightbox,
    Musik,
  };
}
