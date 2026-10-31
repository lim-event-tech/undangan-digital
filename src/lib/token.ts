import { randomBytes } from "node:crypto";

export function newGuestToken(): string {
  return randomBytes(12).toString("base64url");
}
