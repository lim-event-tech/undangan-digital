"use client";

import "@fontsource/playfair-display/500.css";
import "@fontsource/playfair-display/500-italic.css";
import "@fontsource/mulish/400.css";
import "@fontsource/mulish/500.css";
import "@/templates/bersama/event.css";
import "./tema.css";
import { Kerangka } from "@/templates/bersama/kerangka";
import type { DataUndangan } from "@/templates/bersama/jenis";
import { buatModulEvent } from "@/templates/bersama/modul-event";

const MODUL = buatModulEvent("pasundan", { utama: "#74503c", kertas: "#faf3e6", lembut: "#ede4cf", teks: "#615a4c" });

export function UndanganPasundan({ data }: { data: DataUndangan }) {
  return <Kerangka modul={MODUL} data={data} />;
}
