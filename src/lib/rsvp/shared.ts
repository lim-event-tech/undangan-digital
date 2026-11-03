export const RSVP_NOTE_MAX = 300;

export function isRsvpClosed(deadline: Date | null, now: Date = new Date()): boolean {
  return deadline !== null && now.getTime() > deadline.getTime();
}

export type RsvpResponse = {
  attending: boolean;
  adults: number;
  children: number;
  note: string;
};
