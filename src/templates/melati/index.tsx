"use client";

import "@fontsource/jost/400.css";
import "@fontsource/jost/500.css";
import "@fontsource/eb-garamond/400.css";
import "@fontsource/eb-garamond/500.css";
import "@/templates/bersama/event.css";
import "./tema.css";
import { Kerangka } from "@/templates/bersama/kerangka";
import type { DataUndangan } from "@/templates/bersama/jenis";
import { buatModulEvent } from "@/templates/bersama/modul-event";

const MODUL = buatModulEvent("melati", { utama: "#edd3a4", kertas: "#38262c", lembut: "#76515c", teks: "#f0e4d8" });

export function UndanganMelati({ data }: { data: DataUndangan }) {
  return <Kerangka modul={MODUL} data={data} />;
}
