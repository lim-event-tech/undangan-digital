import { describe, expect, it } from "vitest";
import {
  FONT_PILIHAN,
  PALET_SIAP,
  normalizeHex,
  peringatanKontras,
  rasioKontras,
  readTampilan,
  readWarna,
  warnaTerang,
} from "./tampilan";

describe("kode warna", () => {
  it("menerima #rrggbb, rrggbb, dan #rgb lalu menyimpan huruf kecil enam digit", () => {
    expect(normalizeHex("#FBF6EA")).toBe("#fbf6ea");
    expect(normalizeHex("fbf6ea")).toBe("#fbf6ea");
    expect(normalizeHex(" #FA0 ")).toBe("#ffaa00");
  });

  it("menolak nilai yang bukan warna", () => {
    for (const nilai of ["", "#12", "#12345", "#1234567", "merah", "#ggg000", null, 12, undefined]) {
      expect(normalizeHex(nilai)).toBeNull();
    }
  });

  it("palet kustom hanya sah bila keempat warna valid", () => {
    expect(readWarna({ kertas: "#fff", teks: "#000", utama: "#111", aksen: "#222" })).toEqual({ kertas: "#ffffff", teks: "#000000", utama: "#111111", aksen: "#222222" });
    expect(readWarna({ kertas: "#fff", teks: "#000", utama: "#111" })).toBeNull();
    expect(readWarna("bukan objek")).toBeNull();
    expect(readWarna([])).toBeNull();
  });
});

describe("pengaturan tampilan", () => {
  it("memakai bawaan untuk data kosong atau rusak", () => {
    expect(readTampilan(undefined)).toEqual({ hiasan: true, warna: null, font: "bawaan" });
    expect(readTampilan({ hiasan: "tidak", font: 5, warna: 7 })).toEqual({ hiasan: true, warna: null, font: "bawaan" });
    expect(readTampilan({ hiasan: false, font: "lora-mulish" })).toEqual({ hiasan: false, warna: null, font: "lora-mulish" });
  });

  it("setiap palet siap pakai dan font punya kunci unik serta kontras teks yang layak", () => {
    expect(new Set(PALET_SIAP.map((item) => item.key)).size).toBe(PALET_SIAP.length);
    expect(new Set(FONT_PILIHAN.map((item) => item.key)).size).toBe(FONT_PILIHAN.length);
    for (const palet of PALET_SIAP) {
      expect(peringatanKontras(palet.warna), palet.label).toEqual([]);
      expect(readWarna(palet.warna)).toEqual(palet.warna);
    }
  });
});

describe("kontras warna", () => {
  it("menghitung rasio hitam terhadap putih dan menandai pasangan yang sulit dibaca", () => {
    expect(rasioKontras("#000000", "#ffffff")).toBeCloseTo(21, 0);
    expect(rasioKontras("#ffffff", "#ffffff")).toBeCloseTo(1, 5);
    const peringatan = peringatanKontras({ kertas: "#ffffff", teks: "#eeeeee", utama: "#fafafa", aksen: "#cccccc" });
    expect(peringatan).toHaveLength(2);
  });

  it("membedakan latar terang dan gelap", () => {
    expect(warnaTerang("#fbf6ea")).toBe(true);
    expect(warnaTerang("#1c1a17")).toBe(false);
  });
});
