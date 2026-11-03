import { describe, expect, it } from "vitest";
import {
  DEFAULT_WA_CONFIG,
  describeWaChanges,
  estimateMinutes,
  parseWaForm,
  randomDelayMs,
  readWaConfig,
} from "./config";
import { phoneToJid } from "./jid";

function form(values: Record<string, string>, aktif = true) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  if (aktif) data.set("aktif", "on");
  return data;
}

describe("readWaConfig", () => {
  it("memakai bawaan untuk data kosong atau rusak", () => {
    expect(readWaConfig(undefined)).toEqual(DEFAULT_WA_CONFIG);
    expect(readWaConfig("rusak")).toEqual(DEFAULT_WA_CONFIG);
    expect(readWaConfig({ jedaMin: "x", batasHarian: null })).toEqual(DEFAULT_WA_CONFIG);
  });

  it("tidak pernah membiarkan jeda di bawah 10 detik", () => {
    const config = readWaConfig({ jedaMin: 2, jedaMaks: 4 });
    expect(config.jedaMin).toBe(10);
    expect(config.jedaMaks).toBe(10);
  });

  it("menjaga jeda terlama tidak lebih kecil dari jeda tercepat", () => {
    const config = readWaConfig({ jedaMin: 40, jedaMaks: 20 });
    expect(config.jedaMaks).toBe(40);
  });
});

describe("parseWaForm", () => {
  it("menerima isian yang valid", () => {
    const parsed = parseWaForm(form({ jedaMin: "12", jedaMaks: "30", batasHarian: "100" }));
    expect(parsed).toEqual({
      ok: true,
      input: { aktif: true, jedaMin: 12, jedaMaks: 30, batasHarian: 100 },
    });
  });

  it("menolak jeda tercepat di bawah 10 detik", () => {
    const parsed = parseWaForm(form({ jedaMin: "9", jedaMaks: "30", batasHarian: "100" }));
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.errors.jedaMin).toContain("10");
  });

  it("menolak jeda terlama lebih kecil dari jeda tercepat", () => {
    const parsed = parseWaForm(form({ jedaMin: "30", jedaMaks: "20", batasHarian: "100" }));
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.errors.jedaMaks).toBeDefined();
  });

  it("menolak angka bukan bilangan bulat dan batas harian di luar rentang", () => {
    const parsed = parseWaForm(form({ jedaMin: "10.5", jedaMaks: "abc", batasHarian: "0" }));
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) {
      expect(Object.keys(parsed.errors).sort()).toEqual(["batasHarian", "jedaMaks", "jedaMin"]);
    }
  });

  it("membaca saklar aktif dari ada tidaknya kolom", () => {
    const parsed = parseWaForm(form({ jedaMin: "10", jedaMaks: "10", batasHarian: "5" }, false));
    expect(parsed.ok && parsed.input.aktif).toBe(false);
  });
});

describe("randomDelayMs", () => {
  const config = { ...DEFAULT_WA_CONFIG, jedaMin: 10, jedaMaks: 20 };

  it("berada di antara jeda tercepat dan terlama", () => {
    expect(randomDelayMs(config, () => 0)).toBe(10_000);
    expect(randomDelayMs(config, () => 1)).toBe(20_000);
    expect(randomDelayMs(config, () => 0.5)).toBe(15_000);
  });

  it("tetap minimal 10 detik walau konfigurasi mentah lebih kecil", () => {
    expect(randomDelayMs({ ...config, jedaMin: 1, jedaMaks: 2 }, () => 0)).toBe(10_000);
  });
});

describe("estimateMinutes", () => {
  it("menghitung perkiraan dari jeda rata-rata", () => {
    expect(estimateMinutes(40, { ...DEFAULT_WA_CONFIG, jedaMin: 15, jedaMaks: 25 })).toBe(14);
    expect(estimateMinutes(0, DEFAULT_WA_CONFIG)).toBe(1);
  });
});

describe("describeWaChanges", () => {
  it("mencatat hanya yang berubah", () => {
    const after = { ...DEFAULT_WA_CONFIG, aktif: true, batasHarian: 80 };
    expect(describeWaChanges(DEFAULT_WA_CONFIG, after)).toEqual([
      "Kirim otomatis untuk pasangan diaktifkan",
      "Batas harian 150 menjadi 80 pesan",
    ]);
    expect(describeWaChanges(DEFAULT_WA_CONFIG, DEFAULT_WA_CONFIG)).toEqual([]);
  });
});

describe("phoneToJid", () => {
  it("mengubah nomor internasional menjadi JID WhatsApp", () => {
    expect(phoneToJid("+6281234567890")).toBe("6281234567890@s.whatsapp.net");
  });
});
