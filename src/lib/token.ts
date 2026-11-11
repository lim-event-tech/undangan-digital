import { randomBytes } from "node:crypto";

export const GUEST_TOKEN_LENGTH = 8;
export const RESERVED_TOKENS: ReadonlySet<string> = new Set(["undangan"]);
export const INVITE_COOKIE = "ud_terima";

export function newGuestToken(): string {
  for (;;) {
    const token = randomBytes(6).toString("base64url");
    if (!RESERVED_TOKENS.has(token.toLowerCase())) return token;
  }
}

const GUEST_TOKEN_PATTERN = /^(?:[A-Za-z0-9_-]{8}|[A-Za-z0-9_-]{16})$/;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function looksLikeGuestToken(value: unknown): value is string {
  return typeof value === "string" && GUEST_TOKEN_PATTERN.test(value) && !RESERVED_TOKENS.has(value.toLowerCase());
}

export function looksLikeSlug(value: unknown): value is string {
  return typeof value === "string" && value.length <= 80 && SLUG_PATTERN.test(value);
}
