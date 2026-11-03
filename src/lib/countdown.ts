import { isDateString, isTimeString, type Zone } from "@/lib/datetime";

const OFFSET: Record<Zone, string> = {
  WIB: "+07:00",
  WITA: "+08:00",
  WIT: "+09:00",
};

export type TimedEvent = { date: string | null; time: string | null; timezone: Zone };

export function eventInstant(date: string, time: string, zone: Zone): Date | null {
  if (!isDateString(date) || !isTimeString(time.slice(0, 5))) return null;
  const instant = new Date(`${date}T${time.slice(0, 5)}:00${OFFSET[zone]}`);
  return Number.isNaN(instant.getTime()) ? null : instant;
}

export function countdownTarget(events: TimedEvent[]): Date | null {
  let earliest: Date | null = null;
  for (const e of events) {
    if (!e.date || !e.time) continue;
    const instant = eventInstant(e.date, e.time, e.timezone);
    if (instant && (!earliest || instant < earliest)) earliest = instant;
  }
  return earliest;
}

export type Remaining = {
  past: boolean;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

export function remaining(target: Date, now: Date): Remaining {
  const diff = target.getTime() - now.getTime();
  if (diff <= 0) return { past: true, days: 0, hours: 0, minutes: 0, seconds: 0 };
  const totalSeconds = Math.floor(diff / 1000);
  return {
    past: false,
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}
