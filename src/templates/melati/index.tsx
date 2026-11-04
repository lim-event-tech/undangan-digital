"use client";

import "@fontsource/jost/400.css";
import "@fontsource/jost/500.css";
import "@fontsource/cormorant-garamond/400.css";
import "@fontsource/cormorant-garamond/400-italic.css";
import "@fontsource/cormorant-garamond/500.css";
import "@/templates/bersama/event.css";
import "./tema.css";
import { Kerangka } from "@/templates/bersama/kerangka";
import type { DataUndangan } from "@/templates/bersama/jenis";
import { buatModulEvent } from "@/templates/bersama/modul-event";

const MODUL = buatModulEvent("melati", { utama: "#354b3e", kertas: "#faf7ef", lembut: "#e8ebdf", teks: "#555e52" });

export function UndanganMelati({ data }: { data: DataUndangan }) {
  return <Kerangka modul={MODUL} data={data} />;
}
