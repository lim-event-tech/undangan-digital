import type { InvitationContent } from "@/lib/invitations/content";
import type { PhotoInfo } from "@/lib/photos/service";
import type { GuestEvent } from "@/lib/rsvp/service";

export type ModeTampilan = "tamu" | "pratinjau" | "contoh";

export type InvitationView = {
  mode: ModeTampilan;
  token: string;
  title: string;
  guest: { name: string; maxAttendees: number };
  content: InvitationContent;
  events: GuestEvent[];
  photos: PhotoInfo[];
  rsvp: { closed: boolean; deadline: string | null };
  now: number;
};
