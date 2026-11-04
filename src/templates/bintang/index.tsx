"use client";

import "@fontsource/marcellus/400.css";
import "@fontsource/jost/400.css";
import "@fontsource/jost/500.css";
import "@/templates/bersama/event.css";
import "./tema.css";
import { Kerangka } from "@/templates/bersama/kerangka";
import type { DataUndangan } from "@/templates/bersama/jenis";
import { buatModulEvent } from "@/templates/bersama/modul-event";

const MODUL = buatModulEvent("bintang", { utama: "#e7cf98", kertas: "#152039", lembut: "#202e49", teks: "#c6cbd3" });

export function UndanganBintang({ data }: { data: DataUndangan }) {
  return <Kerangka modul={MODUL} data={data} />;
}
