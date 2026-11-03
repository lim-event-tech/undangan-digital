import { describe, expect, it } from "vitest";
import { authMessage, passwordProblem } from "./auth-messages";

describe("authMessage", () => {
  it("menerjemahkan kode galat Better Auth ke bahasa Indonesia", () => {
    expect(authMessage({ code: "INVALID_EMAIL_OR_PASSWORD" })).toBe("Email atau kata sandi salah.");
    expect(authMessage({ code: "PASSWORD_TOO_SHORT" })).toBe("Kata sandi minimal 8 karakter.");
    expect(authMessage({ code: "INVALID_EMAIL" })).toBe("Format email tidak valid.");
    expect(authMessage({ code: "ENTAH" })).toBe("Terjadi kesalahan. Coba lagi sebentar.");
  });

  it("memberi tahu bahwa email sudah terdaftar untuk semua varian kodenya", () => {
    expect(authMessage({ code: "USER_ALREADY_EXISTS" })).toContain("sudah terdaftar");
    expect(authMessage({ code: "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL" })).toContain("sudah terdaftar");
  });

  it("memberi pesan batas percobaan untuk status 429", () => {
    expect(authMessage({ status: 429, code: "APA_SAJA" })).toContain("Terlalu banyak percobaan");
  });

  it("mengembalikan teks kosong tanpa galat", () => {
    expect(authMessage(null)).toBe("");
    expect(authMessage(undefined)).toBe("");
  });
});

describe("passwordProblem", () => {
  it("menolak kata sandi yang terlalu pendek atau terlalu panjang", () => {
    expect(passwordProblem("pendek")).toBe("Kata sandi minimal 8 karakter.");
    expect(passwordProblem("a".repeat(129))).toBe("Kata sandi maksimal 128 karakter.");
  });

  it("menerima kata sandi dalam rentang", () => {
    expect(passwordProblem("delapan88")).toBeNull();
    expect(passwordProblem("a".repeat(128))).toBeNull();
  });
});
