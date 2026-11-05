import type { InvitationContent } from "@/lib/invitations/content";
import type { PhotoInfo } from "@/lib/photos/service";
import type { GuestEvent } from "@/lib/rsvp/service";
import type { HalamanUcapan, UcapanData } from "./bersama/jenis";

export type ModeTampilan = "tamu" | "pratinjau" | "contoh";

export type InvitationView = {
  mode: ModeTampilan;
  slug: string;
  token: string;
  title: string;
  guest: { name: string; maxAttendees: number };
  content: InvitationContent;
  events: GuestEvent[];
  photos: PhotoInfo[];
  rsvp: { closed: boolean; deadline: string | null };
  wishes: (HalamanUcapan & { lokal: UcapanData[] | null }) | null;
  musicId: string | null;
  now: number;
};
