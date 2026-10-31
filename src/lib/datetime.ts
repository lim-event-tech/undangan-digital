export const ZONES = ["WIB", "WITA", "WIT"] as const;
export type Zone = (typeof ZONES)[number];

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;

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

export function deadlineFromDate(value: string): Date {
  return new Date(`${value}T23:59:59+07:00`);
}

export function dateFromDeadline(deadline: Date | null): string {
  if (!deadline) return "";
  return new Date(deadline.getTime() + WIB_OFFSET_MS).toISOString().slice(0, 10);
}
