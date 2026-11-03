import { deadlineFromDate, isDateString } from "@/lib/datetime";
import { multiLine, singleLine } from "@/lib/form-text";
import type { FieldErrors } from "@/lib/save-result";
import { CONTENT_LIMITS, type InvitationContent } from "./content";

type Parsed<T> = { ok: true; input: T } | { ok: false; errors: FieldErrors };

function tooLong(errors: FieldErrors, field: string, value: string, max: number, label: string) {
  if (value.length > max) errors[field] = `${label} maksimal ${max} karakter`;
}

export type MempelaiInput = {
  groomName: string;
  brideName: string;
  pria: InvitationContent["pria"];
  wanita: InvitationContent["wanita"];
};

export function parseMempelaiForm(formData: FormData): Parsed<MempelaiInput> {
  const errors: FieldErrors = {};
  const groomName = singleLine(formData, "panggilanPria");
  const brideName = singleLine(formData, "panggilanWanita");
  const priaNama = singleLine(formData, "namaLengkapPria");
  const wanitaNama = singleLine(formData, "namaLengkapWanita");
  const priaOrtu = multiLine(formData, "orangTuaPria");
  const wanitaOrtu = multiLine(formData, "orangTuaWanita");

  if (!groomName) errors.panggilanPria = "Nama panggilan wajib diisi";
  if (!brideName) errors.panggilanWanita = "Nama panggilan wajib diisi";
  tooLong(errors, "panggilanPria", groomName, CONTENT_LIMITS.panggilan, "Nama panggilan");
  tooLong(errors, "panggilanWanita", brideName, CONTENT_LIMITS.panggilan, "Nama panggilan");
  tooLong(errors, "namaLengkapPria", priaNama, CONTENT_LIMITS.namaLengkap, "Nama lengkap");
  tooLong(errors, "namaLengkapWanita", wanitaNama, CONTENT_LIMITS.namaLengkap, "Nama lengkap");
  tooLong(errors, "orangTuaPria", priaOrtu, CONTENT_LIMITS.orangTua, "Keterangan orang tua");
  tooLong(errors, "orangTuaWanita", wanitaOrtu, CONTENT_LIMITS.orangTua, "Keterangan orang tua");

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return {
    ok: true,
    input: {
      groomName,
      brideName,
      pria: { namaLengkap: priaNama, orangTua: priaOrtu },
      wanita: { namaLengkap: wanitaNama, orangTua: wanitaOrtu },
    },
  };
}

export function parseSambutanForm(
  formData: FormData,
): Parsed<{ kutipan: string; sambutan: string }> {
  const errors: FieldErrors = {};
  const kutipan = multiLine(formData, "kutipan");
  const sambutan = multiLine(formData, "sambutan");
  tooLong(errors, "kutipan", kutipan, CONTENT_LIMITS.kutipan, "Kutipan");
  tooLong(errors, "sambutan", sambutan, CONTENT_LIMITS.sambutan, "Teks sambutan");
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, input: { kutipan, sambutan } };
}

export function parsePenutupForm(formData: FormData): Parsed<{ penutup: string }> {
  const errors: FieldErrors = {};
  const penutup = multiLine(formData, "penutup");
  tooLong(errors, "penutup", penutup, CONTENT_LIMITS.penutup, "Teks penutup");
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, input: { penutup } };
}

export const RSVP_MAX_ADULTS = 20;
export const RSVP_MAX_CHILDREN = 20;

function parseCount(
  value: string,
  label: string,
  min: number,
  max: number,
): { value: number } | { error: string } {
  if (!/^\d{1,3}$/.test(value)) return { error: `${label} harus berupa angka ${min} sampai ${max}` };
  const n = Number(value);
  if (n < min || n > max) return { error: `${label} harus ${min} sampai ${max}` };
  return { value: n };
}

export type RsvpInput = { deadline: Date | null; maxAdults: number; maxChildren: number };

export function parseRsvpForm(formData: FormData): Parsed<RsvpInput> {
  const errors: FieldErrors = {};

  const dateText = singleLine(formData, "batas");
  let deadline: Date | null = null;
  if (dateText) {
    if (isDateString(dateText)) deadline = deadlineFromDate(dateText);
    else errors.batas = "Tanggal tidak valid";
  }

  const adults = parseCount(singleLine(formData, "maksDewasa"), "Maks. dewasa", 1, RSVP_MAX_ADULTS);
  if ("error" in adults) errors.maksDewasa = adults.error;
  const children = parseCount(singleLine(formData, "maksAnak"), "Maks. anak", 0, RSVP_MAX_CHILDREN);
  if ("error" in children) errors.maksAnak = children.error;

  if (Object.keys(errors).length > 0 || "error" in adults || "error" in children) {
    return { ok: false, errors };
  }
  return {
    ok: true,
    input: { deadline, maxAdults: adults.value, maxChildren: children.value },
  };
}
