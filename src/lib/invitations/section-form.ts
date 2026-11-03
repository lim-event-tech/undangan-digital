import { singleLine } from "@/lib/form-text";
import type { FieldErrors } from "@/lib/save-result";
import {
  CONTENT_LIMITS,
  MAX_MOMEN,
  MAX_REKENING,
  normalizeSusunan,
  type Susunan,
  type HitungMundurSettings,
  type Momen,
  type MusikSettings,
  type Rekening,
  type UcapanSettings,
} from "./content";

type Parsed<T> = { ok: true; input: T } | { ok: false; errors: FieldErrors };

function flag(formData: FormData, name: string): boolean {
  return formData.get(name) !== null;
}

function lines(formData: FormData, name: string): string[] {
  return formData
    .getAll(name)
    .map((value) => (typeof value === "string" ? value : ""));
}

function collapse(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function paragraph(value: string): string {
  return value
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function accountDigits(value: string): string {
  return value.replace(/\D/g, "");
}

const ACCOUNT_PATTERN = /^[0-9][0-9 .-]*$/;

export function parseAmplopForm(formData: FormData): Parsed<{ amplop: Rekening[] }> {
  const errors: FieldErrors = {};
  const amplop: Rekening[] = [];

  for (let slot = 1; slot <= MAX_REKENING; slot += 1) {
    const bank = singleLine(formData, `bank${slot}`);
    const nomor = singleLine(formData, `nomor${slot}`);
    const atasNama = singleLine(formData, `nama${slot}`);
    if (!bank && !nomor && !atasNama) continue;

    if (!bank) errors[`bank${slot}`] = "Nama bank atau dompet digital wajib diisi";
    else if (bank.length > CONTENT_LIMITS.bank) {
      errors[`bank${slot}`] = `Maksimal ${CONTENT_LIMITS.bank} karakter`;
    }

    if (!nomor) errors[`nomor${slot}`] = "Nomor rekening wajib diisi";
    else if (nomor.length > CONTENT_LIMITS.nomorRekening) {
      errors[`nomor${slot}`] = `Maksimal ${CONTENT_LIMITS.nomorRekening} karakter`;
    } else if (!ACCOUNT_PATTERN.test(nomor) || accountDigits(nomor).length < 5) {
      errors[`nomor${slot}`] = "Isi dengan angka saja, minimal 5 digit";
    }

    if (!atasNama) errors[`nama${slot}`] = "Nama pemilik rekening wajib diisi";
    else if (atasNama.length > CONTENT_LIMITS.namaRekening) {
      errors[`nama${slot}`] = `Maksimal ${CONTENT_LIMITS.namaRekening} karakter`;
    }

    amplop.push({ bank, nomor, atasNama });
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, input: { amplop } };
}

export function parseCeritaForm(formData: FormData): Parsed<{ cerita: Momen[] }> {
  const errors: FieldErrors = {};
  const tahun = lines(formData, "tahun");
  const judul = lines(formData, "judul");
  const teks = lines(formData, "teks");
  const count = Math.max(tahun.length, judul.length, teks.length);
  const cerita: Momen[] = [];

  for (let index = 0; index < count; index += 1) {
    const item: Momen = {
      tahun: collapse(tahun[index] ?? ""),
      judul: collapse(judul[index] ?? ""),
      teks: paragraph(teks[index] ?? ""),
    };
    if (!item.tahun && !item.judul && !item.teks) continue;

    if (cerita.length >= MAX_MOMEN) {
      errors.cerita = `Maksimal ${MAX_MOMEN} momen`;
      break;
    }
    if (!item.judul) errors[`judul-${index}`] = "Judul momen wajib diisi";
    if (item.tahun.length > CONTENT_LIMITS.ceritaTahun) {
      errors[`tahun-${index}`] = `Maksimal ${CONTENT_LIMITS.ceritaTahun} karakter`;
    }
    if (item.judul.length > CONTENT_LIMITS.ceritaJudul) {
      errors[`judul-${index}`] = `Maksimal ${CONTENT_LIMITS.ceritaJudul} karakter`;
    }
    if (item.teks.length > CONTENT_LIMITS.ceritaTeks) {
      errors[`teks-${index}`] = `Maksimal ${CONTENT_LIMITS.ceritaTeks} karakter`;
    }
    cerita.push(item);
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, input: { cerita } };
}

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
