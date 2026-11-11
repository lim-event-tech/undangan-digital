import type { CSSProperties } from "react";
import { fontPilihan, type TampilanSettings, type WarnaKustom } from "@/lib/invitations/tampilan";
import type { Palet } from "./jenis";

const campur = (a: string, b: string, persenB: number) => `color-mix(in srgb, ${a} ${100 - persenB}%, ${b})`;

export const PALET_KUSTOM: Palet = {
  on: { bg: "var(--event-utama)", fg: "var(--event-kertas)", bd: "var(--event-utama)" },
  off: { bg: "var(--event-kertas)", fg: "var(--event-teks)", bd: "var(--event-garis)" },
};

export function gayaKustom(tampilan: TampilanSettings): CSSProperties {
  const gaya: Record<string, string> = {};
  const warna = tampilan.warna;
  if (warna) {
    Object.assign(gaya, {
      "--event-kertas": warna.kertas,
      "--event-teks": warna.teks,
      "--event-utama": warna.utama,
      "--event-aksen": warna.aksen,
      "--event-border": warna.aksen,
      "--event-label": warna.utama,
      "--event-tombol-teks": warna.kertas,
      "--event-kartu": campur(warna.kertas, "#ffffff", 12),
      "--event-lembut": campur(warna.kertas, warna.aksen, 18),
      "--event-latar": campur(warna.kertas, "#000000", 18),
      "--event-garis": campur(warna.aksen, warna.kertas, 40),
      "--event-muted": campur(warna.teks, warna.kertas, 22),
      "--event-tekstur-luar": "none",
      "--event-tekstur-ukuran": "auto",
    });
  }
  const font = fontPilihan(tampilan.font);
  if (font.judul && font.isi) {
    gaya["--event-serif"] = font.judul;
    gaya["--event-sans"] = font.isi;
  }
  return gaya as CSSProperties;
}

export function paletBidang(warna: WarnaKustom, terang: boolean): string[] {
  return [
    warna.kertas,
    campur(warna.kertas, warna.teks, 4),
    campur(warna.kertas, warna.teks, 7),
    campur(warna.kertas, warna.aksen, 16),
    campur(warna.kertas, warna.aksen, 42),
    terang ? campur(warna.kertas, warna.teks, 78) : campur(warna.kertas, "#000000", 45),
  ];
}
