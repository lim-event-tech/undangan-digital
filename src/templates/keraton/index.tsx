"use client";

import "@fontsource/cinzel/500.css";
import "@fontsource/cinzel/600.css";
import "@fontsource/cinzel/700.css";
import "@fontsource/lora/400.css";
import "@fontsource/lora/400-italic.css";
import "@fontsource/lora/500.css";
import "@fontsource/lora/600.css";
import "@fontsource/italianno/400.css";
import "./tema.css";
import { Kerangka } from "@/templates/bersama/kerangka";
import type { DataUndangan, ModulTemplate } from "@/templates/bersama/jenis";
import { BAGIAN, GAYA_AKAR, KERTAS, Lightbox, Musik, Progres } from "./bagian";
import { DEFS } from "./defs";

const MODUL: ModulTemplate = {
  kunci: "keraton",
  akar: GAYA_AKAR,
  kertas: KERTAS,
  defs: DEFS,
  palet: {
    on: { bg: "#8A1E2D", fg: "#FBF5E8", bd: "#8A1E2D" },
    off: { bg: "#FFFFFF", fg: "#2A2016", bd: "#E3D2AE" },
    avatar: ["#F2D58C", "#E9C3C0", "#DCE6D8", "#F4EBD8"],
    lencana: {
      hadir: ["Hadir", "#C6A35A", "#1F3E33"],
      tidak: ["Tidak hadir", "#E9C3C0", "#6B1522"],
      belum: ["Tamu undangan", "#DCE6D8", "#1F3E33"],
    },
    galeriWarna: [
      "linear-gradient(160deg, #7F9C88, #2F5A48)",
      "linear-gradient(160deg, #C98A8F, #8A1E2D)",
      "linear-gradient(160deg, #E3D2AE, #B08A3E)",
      "linear-gradient(160deg, #A7BBA6, #4E7A63)",
      "linear-gradient(160deg, #D9A1A6, #6B1522)",
      "linear-gradient(160deg, #F4EBD8, #C6A35A)",
    ],
  },
  tepi: {
    sampul: { atas: "#B9CBB6", bawah: "#16302A" },
    pembuka: { atas: "#DCE6D8", bawah: "#4E7A63" },
    salam: { atas: "#16302A", bawah: "#16302A" },
    mempelai: { atas: "#16302A", bawah: "#16302A" },
    hitung: { atas: "#26473A", bawah: "#26473A" },
    acara: { atas: "#16302A", bawah: "#16302A" },
    cerita: { atas: "#6B1522", bawah: "#6B1522" },
    galeri: { atas: "#16302A", bawah: "#16302A" },
    rsvp: { atas: "#4E7A63", bawah: "#26473A" },
    ucapan: { atas: "#F4EBD8", bawah: "#F4EBD8" },
    amplop: { atas: "#16302A", bawah: "#16302A" },
    penutup: { atas: "#16302A", bawah: "#7F9C88" },
  },
  bagian: BAGIAN,
  Progres,
  Lightbox,
  Musik,
};

export function UndanganKeraton({ data }: { data: DataUndangan }) {
  return <Kerangka modul={MODUL} data={data} />;
}
