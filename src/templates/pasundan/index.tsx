"use client";

import "@fontsource/great-vibes/400.css";
import "@fontsource/playfair-display/400-italic.css";
import "@fontsource/playfair-display/500.css";
import "@fontsource/playfair-display/500-italic.css";
import "@fontsource/playfair-display/600.css";
import "@fontsource/mulish/400.css";
import "@fontsource/mulish/500.css";
import "@fontsource/mulish/600.css";
import "@fontsource/mulish/700.css";
import "./tema.css";
import { Kerangka } from "@/templates/bersama/kerangka";
import type { DataUndangan, ModulTemplate } from "@/templates/bersama/jenis";
import { BAGIAN, GAYA_AKAR, KERTAS, Lightbox, Musik, Progres } from "./bagian";
import { DEFS } from "./defs";

const MODUL: ModulTemplate = {
  kunci: "pasundan",
  akar: GAYA_AKAR,
  kertas: KERTAS,
  defs: DEFS,
  palet: {
    on: { bg: "#2F6B4F", fg: "#FFFFFF", bd: "#2F6B4F" },
    off: { bg: "#FFFFFF", fg: "#1F3A2E", bd: "#D9D0B8" },
    avatar: ["#DDEFE2", "#F3E9CC", "#E6EFE3", "#F6E3D8"],
    lencana: {
      hadir: ["Hadir", "#DDEFE2", "#1F6B45"],
      tidak: ["Tidak hadir", "#F6E3D8", "#8A3A22"],
      belum: ["Tamu undangan", "#F3E9CC", "#7A5A1A"],
    },
    galeriWarna: [
      "linear-gradient(165deg, #B7D5BF, #3F7A5A)",
      "linear-gradient(165deg, #F6E3A8, #C8A24A)",
      "linear-gradient(165deg, #DDEFE2, #86B596)",
      "linear-gradient(165deg, #86B596, #1F4D3A)",
      "linear-gradient(165deg, #F3E9CC, #D9C08A)",
      "linear-gradient(165deg, #E6EFE3, #5E9A72)",
    ],
  },
  tepi: {
    sampul: { atas: "#F6F1E4", bawah: "#F6F1E4" },
    pembuka: { atas: "#2F6B4F", bawah: "#1F4D3A" },
    salam: { atas: "#FBF8F0", bawah: "#FBF8F0" },
    mempelai: { atas: "#FBF8F0", bawah: "#FBF8F0" },
    hitung: { atas: "#2F6B4F", bawah: "#2F6B4F" },
    acara: { atas: "#FBF8F0", bawah: "#FBF8F0" },
    cerita: { atas: "#E6EFE3", bawah: "#E6EFE3" },
    galeri: { atas: "#FBF8F0", bawah: "#FBF8F0" },
    rsvp: { atas: "#1F4D3A", bawah: "#1F4D3A" },
    ucapan: { atas: "#FBF8F0", bawah: "#FBF8F0" },
    amplop: { atas: "#E6EFE3", bawah: "#E6EFE3" },
    penutup: { atas: "#F6F1E4", bawah: "#F6F1E4" },
  },
  bagian: BAGIAN,
  Progres,
  Lightbox,
  Musik,
};

export function UndanganPasundan({ data }: { data: DataUndangan }) {
  return <Kerangka modul={MODUL} data={data} />;
}
