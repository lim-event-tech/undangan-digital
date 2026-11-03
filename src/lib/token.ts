import { randomBytes } from "node:crypto";

export function newGuestToken(): string {
  return randomBytes(12).toString("base64url");
}

const GUEST_TOKEN_PATTERN = /^[A-Za-z0-9_-]{16}$/;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function looksLikeGuestToken(value: unknown): value is string {
  return typeof value === "string" && GUEST_TOKEN_PATTERN.test(value);
}

export function looksLikeSlug(value: unknown): value is string {
  return typeof value === "string" && value.length <= 80 && SLUG_PATTERN.test(value);
}
