import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";

export class SsoError extends Error {
  constructor(readonly reason: "unavailable" | "origin" | "invalid" | "expired" | "not_registered" | "inactive") {
    super(`sso_${reason}`);
  }
}

const headerSchema = z.object({ alg: z.literal("HS256") });
const payloadSchema = z.object({
  email: z.string().trim().email().max(320).transform((value) => value.toLowerCase()),
  name: z.string().trim().max(200).optional(),
  exp: z.number().int().positive(),
});

function decodeJson(part: string): unknown {
  try {
    return JSON.parse(Buffer.from(part, "base64url").toString("utf8"));
  } catch {
    throw new SsoError("invalid");
  }
}

export function verifySsoToken(token: string, secret: string, now = Date.now()) {
  if (token.length > 8192) throw new SsoError("invalid");
  const parts = token.split(".");
  if (parts.length !== 3 || parts.some((part) => !/^[A-Za-z0-9_-]+$/.test(part))) throw new SsoError("invalid");
  const [header, payload, signature] = parts;
  if (!headerSchema.safeParse(decodeJson(header)).success) throw new SsoError("invalid");
  const expected = createHmac("sha256", secret).update(`${header}.${payload}`).digest();
  const actual = Buffer.from(signature, "base64url");
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) throw new SsoError("invalid");
  const parsed = payloadSchema.safeParse(decodeJson(payload));
  if (!parsed.success) throw new SsoError("invalid");
  if (parsed.data.exp <= Math.floor(now / 1000)) throw new SsoError("expired");
  return parsed.data;
}

export function isFromParentApp(referer: string | null, parentDomain: string): boolean {
  if (!referer) return true;
  try {
    const url = new URL(referer);
    const domain = parentDomain.trim().toLowerCase();
    return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password &&
      (url.hostname === domain || url.hostname.endsWith(`.${domain}`));
  } catch {
    return false;
  }
}

export function readSsoPayload(token: string | null, referer: string | null) {
  const secret = process.env.SSO_SHARED_SECRET?.trim();
  if (!secret) throw new SsoError("unavailable");
  if (!isFromParentApp(referer, process.env.SSO_PARENT_DOMAIN?.trim() || "lingkaride.com")) throw new SsoError("origin");
  if (!token) throw new SsoError("invalid");
  return verifySsoToken(token, secret);
}

export const SSO_MESSAGES: Record<string, string> = {
  sso_not_registered: "Akun LingkarIDE Anda belum terdaftar sebagai admin. Minta Super admin menambahkan email Anda di halaman Tim.",
  sso_inactive: "Akun ini sedang diblokir. Hubungi Super admin.",
  sso_expired: "Sesi masuk dari LingkarIDE sudah kedaluwarsa. Buka lagi dari aplikasi LingkarIDE.",
  sso_invalid: "Token masuk dari LingkarIDE tidak valid. Buka lagi dari aplikasi LingkarIDE.",
  sso_origin: "Permintaan masuk ditolak karena bukan berasal dari LingkarIDE.",
  sso_unavailable: "Masuk lewat LingkarIDE belum tersedia. Gunakan email dan kata sandi atau Google.",
  sso_rate_limited: "Terlalu banyak percobaan masuk. Tunggu sebentar lalu coba lagi dari LingkarIDE.",
};
