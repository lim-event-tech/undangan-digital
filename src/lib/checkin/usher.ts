import type { CheckinGuest, ScanResult } from "./service";

export type GuestInfo = {
  id: string;
  name: string;
  groupName: string | null;
  attending: boolean;
  attendeeCount: number;
  checkedInAt: string | null;
};

export type UsherResult =
  | { status: "ditolak"; pesan: string }
  | { status: ScanResult["result"]; guest: GuestInfo | null };

export type CariResult = { status: "ok"; guests: GuestInfo[] } | { status: "ditolak"; pesan: string };

export type PemindaiAksi = {
  pindai: (code: string) => Promise<UsherResult>;
  masukkan: (guestId: string) => Promise<UsherResult>;
  batalkan: (guestId: string) => Promise<UsherResult>;
  cari: (query: string) => Promise<CariResult>;
};

export function toInfo(guest: CheckinGuest): GuestInfo {
  return {
    id: guest.id,
    name: guest.name,
    groupName: guest.groupName,
    attending: guest.attending,
    attendeeCount: guest.attendeeCount,
    checkedInAt: guest.checkedInAt ? guest.checkedInAt.toISOString() : null,
  };
}

export function toResult(result: ScanResult): UsherResult {
  return {
    status: result.result,
    guest: "guest" in result ? toInfo(result.guest) : null,
  };
}
