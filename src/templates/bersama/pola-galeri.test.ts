import { describe, expect, it } from "vitest";
import { RASIO_BAWAAN, jumlahLajur, rasioFoto, susunLajur } from "./pola-galeri";

describe("susunan galeri", () => {
  it("memakai ukuran asli foto dan rasio bawaan bila ukurannya tidak diketahui", () => {
    expect(rasioFoto(1600, 1067)).toEqual({ lebar: 1600, tinggi: 1067 });
    expect(rasioFoto(null, null)).toEqual(RASIO_BAWAAN);
    expect(rasioFoto(0, 0)).toEqual(RASIO_BAWAAN);
    expect(rasioFoto(1200, undefined)).toEqual(RASIO_BAWAAN);
  });

  it("memakai satu lajur untuk satu foto dan dua lajur untuk lebih", () => {
    expect(jumlahLajur(0)).toBe(1);
    expect(jumlahLajur(1)).toBe(1);
    expect(jumlahLajur(2)).toBe(2);
    expect(jumlahLajur(12)).toBe(2);
    expect(susunLajur([])).toEqual([[]]);
    expect(susunLajur([{ lebar: 4, tinggi: 3 }])).toEqual([[0]]);
  });

  it("menaruh tiap foto di lajur yang paling pendek dengan urutan tetap", () => {
    const tegak = { lebar: 2, tinggi: 3 };
    const datar = { lebar: 3, tinggi: 2 };
    expect(susunLajur([tegak, datar, datar, datar, tegak])).toEqual([
      [0, 4],
      [1, 2, 3],
    ]);
  });

  it("menjaga tinggi kedua lajur tetap seimbang", () => {
    const rasio = Array.from({ length: 12 }, (_, i) => (i % 3 === 0 ? { lebar: 2, tinggi: 3 } : { lebar: 4, tinggi: 3 }));
    const lajur = susunLajur(rasio);
    const tinggi = lajur.map((isi) => isi.reduce((jumlah, i) => jumlah + rasio[i].tinggi / rasio[i].lebar, 0));
    expect(lajur.flat().sort((a, b) => a - b)).toEqual(rasio.map((_, i) => i));
    expect(Math.abs(tinggi[0] - tinggi[1])).toBeLessThan(1.5);
  });
});
