import { createHmac } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { isFromParentApp, readSsoPayload, verifySsoToken } from "./sso";

const secret = "shared-secret-lingkaride-untuk-pengujian";
const now = 1_800_000_000_000;

function sign(payload: unknown, key = secret, header: unknown = { alg: "HS256", typ: "JWT" }) {
  const input = [header, payload].map((part) => Buffer.from(JSON.stringify(part)).toString("base64url")).join(".");
  return `${input}.${createHmac("sha256", key).update(input).digest("base64url")}`;
}

afterEach(() => vi.unstubAllEnvs());

describe("token SSO kompatibel WordCloud", () => {
  const payload = { email: " Admin@Example.com ", name: "Admin LIM", exp: now / 1000 + 60 };

  it("memeriksa tanda tangan HS256 dan menormalisasi email", () => {
    expect(verifySsoToken(sign(payload), secret, now)).toEqual({ ...payload, email: "admin@example.com" });
  });

  it("menerima payload tanpa nama", () => {
    const value = { email: "admin@example.com", exp: payload.exp };
    expect(verifySsoToken(sign(value), secret, now)).toEqual(value);
  });

  it.each(["", "a.b", "a.b.c.d", "@@.e30.abc", "e30..abc", "a".repeat(8193)])("menolak format token rusak", (token) => {
    expect(() => verifySsoToken(token, secret, now)).toThrow("sso_invalid");
  });

  it.each(["none", "HS512", "RS256"])("menolak algoritma %s", (alg) => {
    expect(() => verifySsoToken(sign(payload, secret, { alg }), secret, now)).toThrow("sso_invalid");
  });

  it("menolak secret berbeda dan isi yang dimodifikasi", () => {
    expect(() => verifySsoToken(sign(payload, "secret-salah"), secret, now)).toThrow("sso_invalid");
    const token = sign(payload).split(".");
    token[1] = Buffer.from(JSON.stringify({ ...payload, email: "lain@example.com" })).toString("base64url");
    expect(() => verifySsoToken(token.join("."), secret, now)).toThrow("sso_invalid");
    expect(() => verifySsoToken(`${token[0]}.${token[1]}.AA`, secret, now)).toThrow("sso_invalid");
  });

  it.each([{}, { ...payload, email: "bukan-email" }, { ...payload, exp: "1800000060" }, { ...payload, exp: 1.5 }, { ...payload, exp: null }])("menolak klaim tidak valid", (value) => {
    expect(() => verifySsoToken(sign(value), secret, now)).toThrow("sso_invalid");
  });

  it.each([now / 1000 - 1, now / 1000])("menolak token tepat pada atau melewati kedaluwarsa", (exp) => {
    expect(() => verifySsoToken(sign({ ...payload, exp }), secret, now)).toThrow("sso_expired");
  });

  it("menolak ketika SSO belum dikonfigurasi", () => {
    vi.stubEnv("SSO_SHARED_SECRET", "");
    expect(() => readSsoPayload(sign(payload), null)).toThrow("sso_unavailable");
  });

  it("memakai domain bawaan dan menolak token kosong", () => {
    vi.stubEnv("SSO_SHARED_SECRET", secret);
    vi.stubEnv("SSO_PARENT_DOMAIN", "");
    expect(() => readSsoPayload(null, "https://lingkaride.com/")).toThrow("sso_invalid");
    expect(() => readSsoPayload(sign(payload), "https://asing.example/")).toThrow("sso_origin");
  });
});

describe("asal LingkarIDE", () => {
  it.each([null, "https://lingkaride.com/", "https://app.lingkaride.com/tools", "https://LINGKARIDE.com/"])("menerima asal %s sesuai WordCloud", (referer) => {
    expect(isFromParentApp(referer, "lingkaride.com")).toBe(true);
  });

  it.each(["rusak", "https://evillingkaride.com", "https://lingkaride.com.evil.test", "https://lingkaride.com@evil.test", "https://user@lingkaride.com", "javascript:alert(1)"])("menolak asal %s", (referer) => {
    expect(isFromParentApp(referer, "lingkaride.com")).toBe(false);
  });

  it("mengikuti domain induk yang dikonfigurasi", () => {
    expect(isFromParentApp("https://portal.internal.example/", "internal.example")).toBe(true);
    expect(isFromParentApp("https://lingkaride.com/", "internal.example")).toBe(false);
  });
});
