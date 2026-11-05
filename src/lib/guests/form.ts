import { RSVP_MAX_ATTENDEES } from "@/lib/rsvp/shared";
import { normalizePhone } from "@/lib/phone";
import type { GuestInput } from "./service";

export const NEW_GROUP_VALUE = "__baru";

export type GuestFormValues = {
  nama: string;
  whatsapp: string;
  grup: string;
  grupBaru: string;
  acara: string[];
  maksPeserta: string;
};

export type GuestFieldErrors = Partial<
  Record<
    "nama" | "whatsapp" | "grup" | "acara" | "maksPeserta",
    string
  >
>;

export type GuestFormState = {
  errors?: GuestFieldErrors;
  formError?: string;
  duplicate?: { name: string };
  values?: GuestFormValues;
};

export type ParsedGuestForm =
  | { ok: true; input: GuestInput; values: GuestFormValues }
  | { ok: false; errors: GuestFieldErrors; values: GuestFormValues };

function text(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value : "";
}

function parseCount(
  value: string,
  label: string,
  min: number,
  max: number,
): { value: number } | { error: string } {
  if (!/^\d{1,3}$/.test(value.trim())) {
    return { error: `${label} harus berupa angka ${min} sampai ${max}` };
  }
  const n = Number(value);
  if (n < min || n > max) return { error: `${label} harus ${min} sampai ${max}` };
  return { value: n };
}

export function parseGuestForm(formData: FormData): ParsedGuestForm {
  const values: GuestFormValues = {
    nama: text(formData.get("nama")).replace(/\s+/g, " ").trim(),
    whatsapp: text(formData.get("whatsapp")).trim(),
    grup: text(formData.get("grup")),
    grupBaru: text(formData.get("grupBaru")).replace(/\s+/g, " ").trim(),
    acara: formData.getAll("acara").filter((v): v is string => typeof v === "string"),
    maksPeserta: text(formData.get("maksPeserta")).trim(),
  };

  const errors: GuestFieldErrors = {};

  if (!values.nama) errors.nama = "Nama wajib diisi";
  else if (values.nama.length > 120) errors.nama = "Nama maksimal 120 karakter";

  const phone = normalizePhone(values.whatsapp);
  if (!phone.ok) errors.whatsapp = phone.error;

  let groupName: string | null = null;
  if (values.grup === NEW_GROUP_VALUE) {
    if (!values.grupBaru) errors.grup = "Isi nama grup baru";
    else if (values.grupBaru.length > 60) errors.grup = "Nama grup maksimal 60 karakter";
    else groupName = values.grupBaru;
  } else {
    const chosen = values.grup.replace(/\s+/g, " ").trim();
    if (chosen.length > 60) errors.grup = "Nama grup maksimal 60 karakter";
    else groupName = chosen || null;
  }

  if (values.acara.length === 0) errors.acara = "Pilih minimal satu acara";

  const attendees = parseCount(values.maksPeserta, "Maks. peserta", 1, RSVP_MAX_ATTENDEES);
  if ("error" in attendees) errors.maksPeserta = attendees.error;
  if (Object.keys(errors).length > 0 || !phone.ok || "error" in attendees) return { ok: false, errors, values };

  return {
    ok: true,
    values,
    input: {
      name: values.nama,
      phone: phone.value,
      groupName,
      eventIds: values.acara,
      maxAttendees: attendees.value,
    },
  };
}
