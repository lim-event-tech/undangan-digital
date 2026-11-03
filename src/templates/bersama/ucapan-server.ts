import type { AppDb } from "@/db/types";
import { listAllPublicWishes, listPublicWishes, type PublicWish } from "@/lib/wishes/service";
import { WISH_PAGE_SIZE } from "@/lib/wishes/shared";
import type { HalamanUcapan, UcapanData } from "./jenis";
import { waktuRelatif } from "./teks";

export function keUcapanData(wish: PublicWish, now: Date): UcapanData {
  return {
    id: wish.id,
    nama: wish.authorName,
    teks: wish.message,
    waktu: waktuRelatif(wish.createdAt, now),
    status: wish.authorStatus,
  };
}

export async function halamanUcapan(
  db: AppDb,
  invitationId: string,
  page: number,
  now: Date,
): Promise<HalamanUcapan> {
  const hasil = await listPublicWishes(db, invitationId, page);
  return {
    items: hasil.items.map((w) => keUcapanData(w, now)),
    page: hasil.page,
    totalPages: hasil.totalPages,
    total: hasil.total,
  };
}

export async function semuaUcapan(
  db: AppDb,
  invitationId: string,
  now: Date,
): Promise<HalamanUcapan & { lokal: UcapanData[] }> {
  const lokal = (await listAllPublicWishes(db, invitationId)).map((w) => keUcapanData(w, now));
  return {
    items: lokal.slice(0, WISH_PAGE_SIZE),
    page: 1,
    totalPages: Math.max(1, Math.ceil(lokal.length / WISH_PAGE_SIZE)),
    total: lokal.length,
    lokal,
  };
}
