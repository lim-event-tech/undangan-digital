import { normalizeSusunan, type Susunan, type CheckinSettings, type HitungMundurSettings, type MusikSettings, type UcapanSettings } from "./content";
type Parsed<T> = { ok: true; input: T } | { ok: false; errors: Record<string, string> };
function flag(formData: FormData, name: string): boolean { return formData.get(name) !== null; }

export function parseUcapanForm(formData: FormData): Parsed<{ ucapan: UcapanSettings }> {
  return {
    ok: true,
    input: { ucapan: { tampil: flag(formData, "tampil"), tahan: flag(formData, "tahan") } },
  };
}

export function parseHitungMundurForm(
  formData: FormData,
): Parsed<{ hitungMundur: HitungMundurSettings }> {
  return {
    ok: true,
    input: { hitungMundur: { aktif: flag(formData, "aktif"), detik: flag(formData, "detik") } },
  };
}

export function parseMusikForm(formData: FormData): Parsed<{ musik: MusikSettings }> {
  return { ok: true, input: { musik: { aktif: flag(formData, "aktif") } } };
}

export function parseCheckinForm(formData: FormData): Parsed<{ checkin: CheckinSettings }> {
  return { ok: true, input: { checkin: { aktif: flag(formData, "aktif") } } };
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
