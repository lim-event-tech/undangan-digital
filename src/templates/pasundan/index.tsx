"use client";

import "@fontsource/lora/400.css";
import "@fontsource/lora/500.css";
import "@fontsource/mulish/400.css";
import "@fontsource/mulish/500.css";
import "@/templates/bersama/event.css";
import "./tema.css";
import { Kerangka } from "@/templates/bersama/kerangka";
import type { DataUndangan } from "@/templates/bersama/jenis";
import { buatModulEvent } from "@/templates/bersama/modul-event";

const MODUL = buatModulEvent("pasundan", { utama: "#743f2b", kertas: "#f8f1e8", lembut: "#dbc4ad", teks: "#4c3a31" });

export function UndanganPasundan({ data }: { data: DataUndangan }) {
  return <Kerangka modul={MODUL} data={data} />;
}
