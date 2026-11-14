import { normalizeSusunan, type Susunan, type CheckinSettings, type WaPosterSettings } from "./content";
import {
  FONT_PILIHAN,
  WARNA_KUNCI,
  isFontKey,
  normalizeHex,
  type SampulSettings,
  type TampilanSettings,
  type WarnaKustom,
} from "./tampilan";
import type { FieldErrors } from "@/lib/save-result";

type Parsed<T> = { ok: true; input: T } | { ok: false; errors: FieldErrors };
function flag(formData: FormData, name: string): boolean { return formData.get(name) !== null; }

export function parseCheckinForm(formData: FormData): Parsed<{ checkin: CheckinSettings }> {
  return { ok: true, input: { checkin: { aktif: flag(formData, "aktif") } } };
}

export function parseWabaForm(formData: FormData): Parsed<{ wabaAktif: boolean }> {
  return { ok: true, input: { wabaAktif: flag(formData, "aktif") } };
}

export function parseWaPosterForm(formData: FormData): Parsed<{ waPoster: WaPosterSettings }> {
  return {
    ok: true,
    input: { waPoster: { kirim: flag(formData, "kirim"), sumber: formData.get("sumber") === "khusus" ? "khusus" : "sama" } },
  };
}

export function parseSampulForm(formData: FormData): Parsed<{ sampul: SampulSettings }> {
  return { ok: true, input: { sampul: { sembunyikanTeks: flag(formData, "sembunyikanTeks") } } };
}

export function parseTampilanForm(formData: FormData): Parsed<{ tampilan: TampilanSettings }> {
  const errors: FieldErrors = {};
  const font = formData.get("font");
  if (!isFontKey(font)) errors.font = "Pilihan font tidak dikenal";
  let warna: WarnaKustom | null = null;
  if (flag(formData, "warnaKustom")) {
    const nilai: Partial<WarnaKustom> = {};
    for (const { key, label } of WARNA_KUNCI) {
      const hex = normalizeHex(formData.get(key));
      if (hex) nilai[key] = hex;
      else errors[key] = `Warna ${label.toLowerCase()} harus berupa kode seperti #8a6420`;
    }
    if (Object.keys(errors).length === 0) warna = nilai as WarnaKustom;
  }
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return {
    ok: true,
    input: { tampilan: { hiasan: flag(formData, "hiasan"), warna, font: isFontKey(font) ? font : FONT_PILIHAN[0].key } },
  };
}

export function parseSusunanForm(formData: FormData): Parsed<{ susunan: Susunan }> {
  return {
    ok: true,
    input: {
      susunan: normalizeSusunan({
        urutan: formData.getAll("urutan"),
        sembunyi: formData.getAll("sembunyi"),
      }),
    },
  };
}
