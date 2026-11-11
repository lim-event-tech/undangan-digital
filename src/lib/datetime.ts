export const ZONES = ["WIB", "WITA", "WIT"] as const;
export type Zone = (typeof ZONES)[number];

const ZONE_OFFSET_MS: Record<Zone, number> = {
  WIB: 7 * 60 * 60 * 1000,
  WITA: 8 * 60 * 60 * 1000,
  WIT: 9 * 60 * 60 * 1000,
};
const WIB_OFFSET_MS = ZONE_OFFSET_MS.WIB;

export function isZone(value: unknown): value is Zone {
  return typeof value === "string" && (ZONES as readonly string[]).includes(value);
}

export function isDateString(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(value);
}

export function isTimeString(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export function shortTime(dbTime: string | null): string | null {
  return dbTime ? dbTime.slice(0, 5) : null;
}

const DAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"] as const;
const MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
] as const;

function splitDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return { year, month, day };
}

export function formatDate(value: string): string {
  const { year, month, day } = splitDate(value);
  return `${day} ${MONTHS[month - 1]} ${year}`;
}

export function formatShortDay(value: string): string {
  const { month, day } = splitDate(value);
  return `${day} ${MONTHS[month - 1].slice(0, 3)}`;
}

export function formatDots(value: string): string {
  const { year, month, day } = splitDate(value);
  return `${String(day).padStart(2, "0")} . ${String(month).padStart(2, "0")} . ${year}`;
}

export function formatLongDate(value: string): string {
  const { year, month, day } = splitDate(value);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return `${DAYS[weekday]}, ${formatDate(value)}`;
}

export function formatDayLabel(value: string): string {
  const { year, month, day } = splitDate(value);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return `${DAYS[weekday]}, ${day} ${MONTHS[month - 1]}`;
}

export function formatDateRange(start: string, end: string | null): string {
  if (!end || end <= start) return formatDate(start);
  const a = splitDate(start);
  const b = splitDate(end);
  if (a.year !== b.year) return `${formatDate(start)} – ${formatDate(end)}`;
  if (a.month !== b.month) return `${a.day} ${MONTHS[a.month - 1]} – ${b.day} ${MONTHS[b.month - 1]} ${b.year}`;
  return `${a.day}–${b.day} ${MONTHS[b.month - 1]} ${b.year}`;
}

export function formatLongDateRange(start: string, end: string | null): string {
  if (!end || end <= start) return formatLongDate(start);
  return `${formatLongDate(start)} – ${formatLongDate(end)}`;
}

export function formatTime(time: string, zone: Zone): string {
  return `${time.slice(0, 5).replace(":", ".")} ${zone}`;
}

export function formatStamp(value: Date): string {
  const local = new Date(value.getTime() + WIB_OFFSET_MS);
  const month = MONTHS[local.getUTCMonth()].slice(0, 3);
  const hour = String(local.getUTCHours()).padStart(2, "0");
  const minute = String(local.getUTCMinutes()).padStart(2, "0");
  return `${local.getUTCDate()} ${month} ${local.getUTCFullYear()}, ${hour}.${minute}`;
}

export function todayWib(now: Date = new Date()): string {
  return todayInZone("WIB", now);
}

export function todayInZone(zone: Zone, now: Date = new Date()): string {
  return new Date(now.getTime() + ZONE_OFFSET_MS[zone]).toISOString().slice(0, 10);
}

export function deadlineFromDate(value: string): Date {
  return new Date(`${value}T23:59:59+07:00`);
}

export function dateFromDeadline(deadline: Date | null): string {
  if (!deadline) return "";
  return new Date(deadline.getTime() + WIB_OFFSET_MS).toISOString().slice(0, 10);
}
