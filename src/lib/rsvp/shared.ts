import { deadlineFromDate, isDateString, todayWib } from "@/lib/datetime";
import type { Visit } from "@/lib/events/days";

export const RSVP_MAX_ATTENDEES = 40;

export const RSVP_NOTE_MAX = 300;

export function parseRsvpDeadline(
  value: string,
  now: Date = new Date(),
): { ok: true; deadline: Date | null } | { ok: false; error: string } {
  if (!value) return { ok: true, deadline: null };
  if (!isDateString(value)) return { ok: false, error: "Tanggal tidak valid" };
  if (value < todayWib(now)) {
    return { ok: false, error: "Batas waktu RSVP tidak boleh sebelum hari ini" };
  }
  return { ok: true, deadline: deadlineFromDate(value) };
}

export function isRsvpClosed(deadline: Date | null, now: Date = new Date()): boolean {
  return deadline !== null && now.getTime() > deadline.getTime();
}

export type RsvpResponse = {
  attending: boolean;
  attendeeCount: number;
  note: string;
  visits: Visit[];
};
