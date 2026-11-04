"use client";

import "@fontsource/cinzel/500.css";
import "@fontsource/lora/400.css";
import "@fontsource/lora/400-italic.css";
import "@fontsource/jost/400.css";
import "@fontsource/jost/500.css";
import "@/templates/bersama/event.css";
import "./tema.css";
import { Kerangka } from "@/templates/bersama/kerangka";
import type { DataUndangan } from "@/templates/bersama/jenis";
import { buatModulEvent } from "@/templates/bersama/modul-event";

const MODUL = buatModulEvent("keraton", { utama: "#173f36", kertas: "#f9f4e7", lembut: "#ece5d4", teks: "#555b50" });

export function UndanganKeraton({ data }: { data: DataUndangan }) {
  return <Kerangka modul={MODUL} data={data} />;
}
