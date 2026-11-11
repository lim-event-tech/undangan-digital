import { looksLikeGuestToken, looksLikeSlug } from "@/lib/token";

export const CHECKIN_PREFIX = "UD2";
const LEGACY_PREFIX = "UD1";

export function checkinCode(token: string): string {
  return `${CHECKIN_PREFIX}.${token}`;
}

export function parseCheckinCode(input: string): { token: string } | null {
  const parts = input.trim().split(".");
  if (parts.length === 2 && parts[0] === CHECKIN_PREFIX) return looksLikeGuestToken(parts[1]) ? { token: parts[1] } : null;
  if (parts.length === 3 && parts[0] === LEGACY_PREFIX) return looksLikeSlug(parts[1]) && looksLikeGuestToken(parts[2]) ? { token: parts[2] } : null;
  return null;
}

const KEY_PATTERN = /^[A-Za-z0-9_-]{20}$/;

export function looksLikeCheckinKey(value: unknown): value is string {
  return typeof value === "string" && KEY_PATTERN.test(value);
}
