import { describe, expect, it } from "vitest";
import { formatPhone, normalizePhone, phoneSearchNeedle } from "./phone";

describe("normalizePhone", () => {
  it.each([
    "0812-0000-0101",
    "+62 812 0000 0101",
    "6281200000101",
    "81200000101",
    "0062 812 0000 0101",
    "(0812) 0000-0101",
    "  +62-812-0000-0101  ",
    "+620812 0000 0101",
  ])("menyeragamkan %s ke +62", (input) => {
    expect(normalizePhone(input)).toEqual({ ok: true, value: "+6281200000101" });
  });

  it.each([
    ["", "Nomor WhatsApp kosong"],
    ["abc", "Nomor WhatsApp tidak valid"],
    ["0812", "Nomor terlalu pendek"],
    ["0812345678901234", "Nomor terlalu panjang"],
    ["+1 415 555 2671", "Hanya nomor Indonesia (+62) yang didukung"],
    ["021 5551234", "Bukan nomor seluler (harus diawali 8 setelah +62)"],
    ["1234567890", "Format nomor tidak dikenali"],
  ])("menolak %j", (input, error) => {
    expect(normalizePhone(input)).toEqual({ ok: false, error });
  });
});

describe("formatPhone", () => {
  it("memformat nomor +62 agar mudah dibaca", () => {
    expect(formatPhone("+6281200000101")).toBe("+62 812-0000-0101");
  });

  it("membiarkan nomor non +62", () => {
    expect(formatPhone("12345")).toBe("12345");
  });
});

describe("phoneSearchNeedle", () => {
  it("membuang awalan 0 dan 62", () => {
    expect(phoneSearchNeedle("0812 0000")).toBe("8120000");
    expect(phoneSearchNeedle("62812")).toBe("812");
  });

  it("mengabaikan kueri yang terlalu pendek", () => {
    expect(phoneSearchNeedle("08")).toBe("");
    expect(phoneSearchNeedle("sari")).toBe("");
  });
});
