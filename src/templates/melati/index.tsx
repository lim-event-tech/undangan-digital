"use client";

import "@fontsource/jost/300.css";
import "@fontsource/jost/400.css";
import "@fontsource/jost/500.css";
import "@fontsource/cormorant-garamond/400.css";
import "@fontsource/cormorant-garamond/400-italic.css";
import "@fontsource/cormorant-garamond/500.css";
import "@fontsource/cormorant-garamond/500-italic.css";
import "@fontsource/cormorant-garamond/600.css";
import "@fontsource/pinyon-script/400.css";
import "./tema.css";
import { Kerangka } from "@/templates/bersama/kerangka";
import type { DataUndangan, ModulTemplate } from "@/templates/bersama/jenis";
import { BAGIAN, GAYA_AKAR, KERTAS, Lightbox, Musik, Progres } from "./bagian";
import { DEFS } from "./defs";

const MODUL: ModulTemplate = {
  kunci: "melati",
  akar: GAYA_AKAR,
  kertas: KERTAS,
  defs: DEFS,
  palet: {
    on: { bg: "#3E5239", fg: "#FBF8F1", bd: "#3E5239" },
    off: { bg: "#FFFFFF", fg: "#2E3B2A", bd: "#C9D3BF" },
    avatar: ["#DCE5D2", "#F1E1DA", "#EDE6D3", "#E3EBDD"],
    lencana: {
      hadir: ["Hadir", "#DCE5D2", "#2E4A2A"],
      tidak: ["Tidak hadir", "#F1E1DA", "#7A3B2E"],
      belum: ["Tamu undangan", "#EDE6D3", "#5A4A2A"],
    },
    galeriWarna: [
      "linear-gradient(160deg, #DCE4D3, #B8C8AD)",
      "linear-gradient(160deg, #F1E1DA, #DDBFB4)",
      "linear-gradient(160deg, #EDE6D3, #D7C8A6)",
      "linear-gradient(160deg, #E3EBDD, #A9BB9E)",
      "linear-gradient(160deg, #F6ECE6, #E1C5BB)",
      "linear-gradient(160deg, #EFEBDD, #CDBF9F)",
    ],
  },
  tepi: {
    sampul: { atas: "#FBF8F0", bawah: "#EFE9DC" },
    pembuka: { atas: "#EFE9DC", bawah: "#5E7A58" },
    salam: { atas: "#5E7A58", bawah: "#5E7A58" },
    mempelai: { atas: "#F7F3EA", bawah: "#F7F3EA" },
    hitung: { atas: "#3E5239", bawah: "#3E5239" },
    acara: { atas: "#F7F3EA", bawah: "#F7F3EA" },
    cerita: { atas: "#EEF1E7", bawah: "#EEF1E7" },
    galeri: { atas: "#F7F3EA", bawah: "#F7F3EA" },
    rsvp: { atas: "#5E7A58", bawah: "#5E7A58" },
    ucapan: { atas: "#F7F3EA", bawah: "#F7F3EA" },
    amplop: { atas: "#EEF1E7", bawah: "#EEF1E7" },
    penutup: { atas: "#F7F3EA", bawah: "#DCE4D3" },
  },
  bagian: BAGIAN,
  Progres,
  Lightbox,
  Musik,
};

export function UndanganMelati({ data }: { data: DataUndangan }) {
  return <Kerangka modul={MODUL} data={data} />;
}
