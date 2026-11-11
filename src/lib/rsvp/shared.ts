import { deadlineFromDateTime, isDateString, isTimeString, todayWib } from "@/lib/datetime";
import type { Visit } from "@/lib/events/days";

export const RSVP_MAX_ATTENDEES = 40;

export const RSVP_NOTE_MAX = 300;

export const RSVP_DEFAULT_TIME = "23:59";

export function parseRsvpDeadline(
  value: string,
  now: Date = new Date(),
  time: string = RSVP_DEFAULT_TIME,
): { ok: true; deadline: Date | null } | { ok: false; error: string } {
  if (!value) return { ok: true, deadline: null };
  if (!isDateString(value)) return { ok: false, error: "Tanggal tidak valid" };
  if (!isTimeString(time)) return { ok: false, error: "Jam tidak valid" };
  if (value < todayWib(now)) {
    return { ok: false, error: "Batas waktu RSVP tidak boleh sebelum hari ini" };
  }
  const deadline = deadlineFromDateTime(value, time);
  if (deadline.getTime() < now.getTime()) return { ok: false, error: "Batas waktu RSVP tidak boleh sudah lewat" };
  return { ok: true, deadline };
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
