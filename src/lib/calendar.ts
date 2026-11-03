import { eventInstant, type TimedEvent } from "@/lib/countdown";

export const DEFAULT_DURATION_MINUTES = 120;

export type CalendarEvent = TimedEvent & {
  id: string;
  name: string;
  venueName: string | null;
  address: string | null;
  mapsUrl: string | null;
};

export type CalendarSlot = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  location: string;
  details: string;
};

function compactUtc(value: Date): string {
  return value.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

export function calendarSlots(
  events: CalendarEvent[],
  couple: string,
  minutes: number = DEFAULT_DURATION_MINUTES,
): CalendarSlot[] {
  const slots: CalendarSlot[] = [];
  for (const e of events) {
    if (!e.date || !e.time) continue;
    const start = eventInstant(e.date, e.time, e.timezone);
    if (!start) continue;
    const location = [e.venueName, e.address].filter(Boolean).join(", ");
    slots.push({
      id: e.id,
      title: `${e.name} ${couple}`,
      start,
      end: new Date(start.getTime() + minutes * 60_000),
      location,
      details: e.mapsUrl ? `Peta: ${e.mapsUrl}` : "",
    });
  }
  return slots.sort((a, b) => a.start.getTime() - b.start.getTime());
}

export function googleCalendarUrl(slot: CalendarSlot): string {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: slot.title,
    dates: `${compactUtc(slot.start)}/${compactUtc(slot.end)}`,
  });
  if (slot.location) params.set("location", slot.location);
  if (slot.details) params.set("details", slot.details);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function escapeText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}

function fold(line: string): string {
  const encoder = new TextEncoder();
  if (encoder.encode(line).length <= 75) return line;
  const parts: string[] = [];
  let current = "";
  let bytes = 0;
  for (const char of line) {
    const size = encoder.encode(char).length;
    const limit = parts.length === 0 ? 75 : 74;
    if (bytes + size > limit) {
      parts.push(current);
      current = "";
      bytes = 0;
    }
    current += char;
    bytes += size;
  }
  parts.push(current);
  return parts.join("\r\n ");
}

export function buildIcs(
  slots: CalendarSlot[],
  options: { uidDomain: string; now?: Date },
): string {
  const stamp = compactUtc(options.now ?? new Date());
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Undangan Digital//ID", "CALSCALE:GREGORIAN"];
  for (const slot of slots) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${slot.id}@${options.uidDomain}`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${compactUtc(slot.start)}`,
      `DTEND:${compactUtc(slot.end)}`,
      `SUMMARY:${escapeText(slot.title)}`,
    );
    if (slot.location) lines.push(`LOCATION:${escapeText(slot.location)}`);
    if (slot.details) lines.push(`DESCRIPTION:${escapeText(slot.details)}`);
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return `${lines.map(fold).join("\r\n")}\r\n`;
}
