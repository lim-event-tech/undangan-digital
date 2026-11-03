export const WISH_MAX_LENGTH = 300;
export const WISH_PAGE_SIZE = 4;
export const WISH_MAX_PER_GUEST = 3;

export type WishStatus = "tampil" | "ditahan" | "disembunyikan";

export const WISH_STATUSES: readonly WishStatus[] = ["tampil", "ditahan", "disembunyikan"];

export function isWishStatus(value: unknown): value is WishStatus {
  return typeof value === "string" && (WISH_STATUSES as readonly string[]).includes(value);
}

export function cleanWish(input: string): string {
  return input
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
