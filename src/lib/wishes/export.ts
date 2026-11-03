import { formatStamp } from "@/lib/datetime";
import { toCsv, type Rows } from "@/lib/export/table";
import type { OwnerWish } from "./service";
import type { WishStatus } from "./shared";

const STATUS_LABEL: Record<WishStatus, string> = {
  tampil: "Tampil",
  ditahan: "Ditahan",
  disembunyikan: "Disembunyikan",
};

export function buildWishRows(wishes: OwnerWish[]): Rows {
  return [
    ["Pengirim", "Ucapan", "Status", "Dikirim"],
    ...wishes.map((w) => [
      w.authorName,
      w.message,
      STATUS_LABEL[w.status],
      formatStamp(w.createdAt),
    ]),
  ];
}

export function buildWishCsv(wishes: OwnerWish[]): string {
  return toCsv(buildWishRows(wishes));
}
