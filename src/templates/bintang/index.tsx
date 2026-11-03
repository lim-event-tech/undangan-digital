"use client";

import "@fontsource/marcellus/400.css";
import "@fontsource/cormorant-garamond/400-italic.css";
import "@fontsource/cormorant-garamond/500.css";
import "@fontsource/cormorant-garamond/500-italic.css";
import "@fontsource/cormorant-garamond/600.css";
import "@fontsource/eb-garamond/400.css";
import "@fontsource/eb-garamond/500.css";
import "./tema.css";
import { Kerangka } from "@/templates/bersama/kerangka";
import type { DataUndangan, ModulTemplate } from "@/templates/bersama/jenis";
import { BAGIAN, GAYA_AKAR, KERTAS, Lightbox, Musik, Progres } from "./bagian";
import { DEFS } from "./defs";

const MODUL: ModulTemplate = {
  kunci: "bintang",
  akar: GAYA_AKAR,
  kertas: KERTAS,
  defs: DEFS,
  palet: {
    on: { bg: "#1B2747", fg: "#F1EAD8", bd: "#1B2747" },
    off: { bg: "#FFFFFF", fg: "#1B2747", bd: "#DCCFB0" },
    avatar: ["#1B2747", "#3A4C7E", "#6E7A4E", "#8E7A4A"],
    lencana: {
      hadir: ["Hadir", "#1B2747", "#F1EAD8"],
      tidak: ["Tidak hadir", "#E6DCC6", "#3A4664"],
      belum: ["Tamu undangan", "#DDE1C8", "#3F4A26"],
    },
    galeriWarna: [
      "radial-gradient(ellipse at 40% 30%, #3A4C7E, #1B2747)",
      "radial-gradient(ellipse at 40% 30%, #5B5A86, #26284F)",
      "radial-gradient(ellipse at 40% 30%, #8E9A6B, #3F4A26)",
      "radial-gradient(ellipse at 40% 30%, #E3DAC4, #8E7A4A)",
      "radial-gradient(ellipse at 40% 30%, #3A4C7E, #121C36)",
      "radial-gradient(ellipse at 40% 30%, #6D6A96, #1B2747)",
    ],
  },
  tepi: {
    sampul: { atas: "#0D1529", bawah: "#26324F" },
    pembuka: { atas: "#26324F", bawah: "#26324F" },
    salam: { atas: "#1B2747", bawah: "#1B2747" },
    mempelai: { atas: "#1B2747", bawah: "#1B2747" },
    hitung: { atas: "#0D1529", bawah: "#0D1529" },
    acara: { atas: "#1B2747", bawah: "#1B2747" },
    cerita: { atas: "#1B2747", bawah: "#1B2747" },
    galeri: { atas: "#1B2747", bawah: "#1B2747" },
    rsvp: { atas: "#1B2747", bawah: "#1B2747" },
    ucapan: { atas: "#F1EAD8", bawah: "#F1EAD8" },
    amplop: { atas: "#1B2747", bawah: "#1B2747" },
    penutup: { atas: "#1B2747", bawah: "#0D1529" },
  },
  bagian: BAGIAN,
  Progres,
  Lightbox,
  Musik,
};

export function UndanganBintang({ data }: { data: DataUndangan }) {
  return <Kerangka modul={MODUL} data={data} />;
}
