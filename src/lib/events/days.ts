import { isDateString, isTimeString } from "@/lib/datetime";

export const MAX_EVENT_DAYS = 31;
export const TIME_STEP_MINUTES = 30;

export type DayTime = { date: string; start: string; end: string };
export type Visit = { date: string; time: string | null };

type Range = { date: string | null; endDate: string | null };
type Window = { time: string | null; endTime: string | null; dayTimes: DayTime[] };

function addDays(value: string, amount: number): string {
  const base = new Date(`${value}T00:00:00Z`);
  base.setUTCDate(base.getUTCDate() + amount);
  return base.toISOString().slice(0, 10);
}

export function daysBetween(start: string, end: string): number {
  return Math.round((Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86_400_000);
}

export function eventDays(range: Range): string[] {
  if (!range.date || !isDateString(range.date)) return [];
  const end = range.endDate && isDateString(range.endDate) && range.endDate > range.date ? range.endDate : range.date;
  const count = Math.min(daysBetween(range.date, end) + 1, MAX_EVENT_DAYS);
  return Array.from({ length: count }, (_, i) => addDays(range.date as string, i));
}

export function lastDay(range: Range): string | null {
  const days = eventDays(range);
  return days.length ? days[days.length - 1] : null;
}

export function dayWindow(event: Window, date: string): { start: string | null; end: string | null; custom: boolean } {
  const custom = event.dayTimes.find((item) => item.date === date);
  if (custom) return { start: custom.start, end: custom.end, custom: true };
  return { start: event.time, end: event.endTime, custom: false };
}

function toMinutes(value: string): number {
  return Number(value.slice(0, 2)) * 60 + Number(value.slice(3, 5));
}

function toText(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

export function timeOptions(start: string | null, end: string | null): string[] {
  if (!start || !isTimeString(start)) return [];
  const from = toMinutes(start);
  const to = end && isTimeString(end) && toMinutes(end) > from ? toMinutes(end) : 23 * 60 + 30;
  const options: string[] = [];
  for (let minute = from; minute <= to; minute += TIME_STEP_MINUTES) options.push(toText(minute));
  return options;
}

export function isTimeInWindow(time: string, start: string | null, end: string | null): boolean {
  if (!isTimeString(time) || !start) return false;
  const value = toMinutes(time);
  const upper = end && toMinutes(end) > toMinutes(start) ? toMinutes(end) : 23 * 60 + 59;
  return value >= toMinutes(start) && value <= upper;
}

export function readDayTimes(raw: unknown): DayTime[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const result: DayTime[] = [];
  for (const item of raw) {
    if (typeof item !== "object" || item === null) continue;
    const { date, start, end } = item as Record<string, unknown>;
    if (typeof date !== "string" || typeof start !== "string" || typeof end !== "string") continue;
    if (!isDateString(date) || !isTimeString(start) || !isTimeString(end) || end <= start || seen.has(date)) continue;
    seen.add(date);
    result.push({ date, start, end });
  }
  return result.sort((a, b) => a.date.localeCompare(b.date));
}

export function readVisits(raw: unknown): Visit[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const result: Visit[] = [];
  for (const item of raw) {
    if (typeof item !== "object" || item === null) continue;
    const { date, time } = item as Record<string, unknown>;
    if (typeof date !== "string" || !isDateString(date) || seen.has(date)) continue;
    if (time !== null && time !== undefined && (typeof time !== "string" || !isTimeString(time))) continue;
    seen.add(date);
    result.push({ date, time: typeof time === "string" ? time : null });
  }
  return result.sort((a, b) => a.date.localeCompare(b.date));
}

export type DayTimeParse = { ok: true; dayTimes: DayTime[] } | { ok: false; errors: Record<string, string> };

export function parseDayTimes(days: string[], read: (field: string) => string): DayTimeParse {
  const errors: Record<string, string> = {};
  const dayTimes: DayTime[] = [];
  for (const date of days) {
    const start = read(`mulai-${date}`);
    const end = read(`selesai-${date}`);
    if (!start && !end) continue;
    if (!start || !isTimeString(start)) errors[`mulai-${date}`] = "Isi jam mulai hari ini";
    else if (!end || !isTimeString(end)) errors[`selesai-${date}`] = "Isi jam selesai hari ini";
    else if (end <= start) errors[`selesai-${date}`] = "Jam selesai harus setelah jam mulai";
    else dayTimes.push({ date, start, end });
  }
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, dayTimes };
}
