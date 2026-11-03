import { looksLikeGuestToken, looksLikeSlug } from "@/lib/token";

export const CHECKIN_PREFIX = "UD1";

export function checkinCode(slug: string, token: string): string {
  return `${CHECKIN_PREFIX}.${slug}.${token}`;
}

export function parseCheckinCode(input: string): { slug: string; token: string } | null {
  const parts = input.trim().split(".");
  if (parts.length !== 3 || parts[0] !== CHECKIN_PREFIX) return null;
  const [, slug, token] = parts;
  if (!looksLikeSlug(slug) || !looksLikeGuestToken(token)) return null;
  return { slug, token };
}

const KEY_PATTERN = /^[A-Za-z0-9_-]{20}$/;

export function looksLikeCheckinKey(value: unknown): value is string {
  return typeof value === "string" && KEY_PATTERN.test(value);
}
