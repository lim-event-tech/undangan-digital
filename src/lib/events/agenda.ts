import { isTimeString } from "@/lib/datetime";
import { multiLine, singleLine } from "@/lib/form-text";
import type { FieldErrors } from "@/lib/save-result";
import { isUuid } from "@/lib/uuid";

export const MAX_AGENDA = 20;
export const AGENDA_LIMITS = { judul: 80, keterangan: 300 } as const;
export type AgendaItem = { id: string; jam: string; judul: string; keterangan: string };

export function readAgenda(raw: unknown): AgendaItem[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  return raw.filter((item): item is AgendaItem => {
    if (!item || typeof item !== "object" || !isUuid(item.id) || seen.has(item.id.toLowerCase())) return false;
    if (typeof item.jam !== "string" || !isTimeString(item.jam) || typeof item.judul !== "string" || !item.judul.trim()) return false;
    seen.add(item.id.toLowerCase());
    return true;
  }).slice(0, MAX_AGENDA).map((item) => ({
    id: item.id.toLowerCase(), jam: item.jam, judul: item.judul.slice(0, AGENDA_LIMITS.judul),
    keterangan: typeof item.keterangan === "string" ? item.keterangan.slice(0, AGENDA_LIMITS.keterangan) : "",
  }));
}

export function parseAgenda(data: FormData, start: string, end: string): { agenda: AgendaItem[]; errors: FieldErrors } {
  const keys = ["id", "jam", "judul", "keterangan"] as const;
  const columns = Object.fromEntries(keys.map((key) => [key, data.getAll(`agenda-${key}`)]));
  const count = Math.max(...keys.map((key) => columns[key].length));
  const errors: FieldErrors = {};
  const agenda: AgendaItem[] = [];
  if (count > MAX_AGENDA) return { agenda, errors: { agenda: `Maksimal ${MAX_AGENDA} baris agenda per sesi` } };
  const seen = new Set<string>();
  for (let i = 0; i < count; i++) {
    const row = new FormData();
    for (const key of keys) row.set(key, columns[key][i] ?? "");
    const item = { id: singleLine(row, "id").toLowerCase(), jam: singleLine(row, "jam"), judul: singleLine(row, "judul"), keterangan: multiLine(row, "keterangan") };
    if (!isUuid(item.id) || seen.has(item.id)) errors.agenda = "ID agenda tidak valid atau berulang";
    seen.add(item.id);
    if (!item.judul) errors[`agenda-judul-${i}`] = "Judul kegiatan wajib diisi";
    for (const key of ["judul", "keterangan"] as const) {
      if (item[key].length > AGENDA_LIMITS[key]) errors[`agenda-${key}-${i}`] = `Maksimal ${AGENDA_LIMITS[key]} karakter`;
    }
    if (!isTimeString(item.jam)) errors[`agenda-jam-${i}`] = "Jam agenda tidak valid";
    else if (!start || item.jam < start || (end && item.jam > end)) errors[`agenda-jam-${i}`] = "Jam agenda harus berada dalam waktu sesi";
    agenda.push(item);
  }
  return { agenda, errors };
}
