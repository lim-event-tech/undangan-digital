import { dateFromDeadline } from "@/lib/datetime";
import { multiLine, singleLine } from "@/lib/form-text";
import { parseRsvpDeadline, RSVP_MAX_ATTENDEES } from "@/lib/rsvp/shared";
import type { FieldErrors } from "@/lib/save-result";
import { CONTENT_LIMITS } from "./content";
import { parseInvitationTitle } from "./title";

type Parsed<T> = { ok: true; input: T } | { ok: false; errors: FieldErrors };

function tooLong(errors: FieldErrors, field: string, value: string, max: number, label: string) {
  if (value.length > max) errors[field] = `${label} maksimal ${max} karakter`;
}

export function parseTitleForm(formData: FormData): Parsed<{ title: string }> {
  const parsed = parseInvitationTitle(formData.get("title"));
  return parsed.ok ? { ok: true, input: { title: parsed.title } } : { ok: false, errors: { title: parsed.error } };
}

export function parseSambutanForm(
  formData: FormData,
): Parsed<{ sambutan: string }> {
  const errors: FieldErrors = {};
  const sambutan = multiLine(formData, "sambutan");
  tooLong(errors, "sambutan", sambutan, CONTENT_LIMITS.sambutan, "Teks sambutan");
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, input: { sambutan } };
}

export function parsePenutupForm(formData: FormData): Parsed<{ penutup: string }> {
  const errors: FieldErrors = {};
  const penutup = multiLine(formData, "penutup");
  tooLong(errors, "penutup", penutup, CONTENT_LIMITS.penutup, "Teks penutup");
  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, input: { penutup } };
}

export { RSVP_MAX_ATTENDEES } from "@/lib/rsvp/shared";

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

export type RsvpInput = { deadline: Date | null; maxAttendees: number };

export function parseRsvpForm(
  formData: FormData,
  currentDeadline: Date | null = null,
): Parsed<RsvpInput> {
  const errors: FieldErrors = {};

  const dateText = singleLine(formData, "batas");
  const parsedDeadline = parseRsvpDeadline(dateText);
  let deadline = currentDeadline;
  if (parsedDeadline.ok) {
    deadline = parsedDeadline.deadline;
  } else if (dateText !== dateFromDeadline(currentDeadline)) {
    errors.batas = parsedDeadline.error;
  }

  const attendees = parseCount(singleLine(formData, "maksPeserta"), "Maks. peserta", 1, RSVP_MAX_ATTENDEES);
  if ("error" in attendees) errors.maksPeserta = attendees.error;
  if (Object.keys(errors).length > 0 || "error" in attendees) return { ok: false, errors };

  return {
    ok: true,
    input: { deadline, maxAttendees: attendees.value },
  };
}
