import { readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { RESERVED_TOKENS, looksLikeGuestToken, newGuestToken } from "./token";

describe("token tamu", () => {
  it("membuat token 8 karakter base64url yang acak", () => {
    const tokens = new Set(Array.from({ length: 500 }, () => newGuestToken()));
    expect(tokens.size).toBe(500);
    for (const token of tokens) expect(token).toMatch(/^[A-Za-z0-9_-]{8}$/);
  });

  it("menerima token baru 8 karakter dan token lama 16 karakter, menolak bentuk lain dan kata tercadangkan", () => {
    expect(looksLikeGuestToken("AbCd1234")).toBe(true);
    expect(looksLikeGuestToken("AbCdEfGhIjKlMnOp")).toBe(true);
    for (const rusak of ["", "AbCd123", "AbCd12345", "AbCdEfGhIjKlMnO", "AbCd 234", "AbCd12!4", "undangan", "UNDANGAN", 12, null]) {
      expect(looksLikeGuestToken(rusak), String(rusak)).toBe(false);
    }
  });

  it("mencadangkan setiap rute tingkat atas yang panjang namanya sama dengan token", () => {
    const rute = readdirSync(join(process.cwd(), "src/app"), { withFileTypes: true })
      .filter((d) => d.isDirectory() && !/^[[(_]/.test(d.name))
      .map((d) => d.name)
      .filter((nama) => nama.length === 8 || nama.length === 16);
    for (const nama of rute) expect({ nama, dicadangkan: RESERVED_TOKENS.has(nama) }).toEqual({ nama, dicadangkan: true });
  });
});
