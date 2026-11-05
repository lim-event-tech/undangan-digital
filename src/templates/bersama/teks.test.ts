import { describe, expect, it } from "vitest";
import { angkaKata, inisialNama, kotaDari, tanggalKata, waktuRelatif } from "./teks";

describe("angkaKata dan tanggalKata", () => {
  it("menulis angka tanggal dalam kata", () => {
    expect([1, 10, 11, 12, 19, 20, 21, 30, 31].map(angkaKata)).toEqual([
      "satu",
      "sepuluh",
      "sebelas",
      "dua belas",
      "sembilan belas",
      "dua puluh",
      "dua puluh satu",
      "tiga puluh",
      "tiga puluh satu",
    ]);
    expect(tanggalKata("2026-12-12")).toBe("Sabtu, dua belas Desember 2026");
  });
});

describe("kotaDari", () => {
  it("mengambil bagian terakhir alamat sebagai kota", () => {
    expect(kotaDari("Jl. Dago Atas No. 88, Coblong, Bandung")).toBe("Bandung");
    expect(kotaDari("Jl. Merdeka 1\nKota Malang 65111")).toBe("Kota Malang");
    expect(kotaDari("Gedung Serbaguna")).toBe("");
    expect(kotaDari(null)).toBe("");
  });
});

describe("inisialNama", () => {
  it("melewati sapaan sebelum mengambil huruf pertama", () => {
    expect(inisialNama("Ibu Sari Rahmawati & Keluarga")).toBe("S");
    expect(inisialNama("Kang Asep & Teh Rina")).toBe("A");
    expect(inisialNama("dimas")).toBe("D");
    expect(inisialNama("Bapak")).toBe("B");
  });
});

describe("waktuRelatif", () => {
  const sekarang = new Date("2026-11-01T12:00:00Z");
  it("memberi label waktu yang mudah dibaca", () => {
    expect(waktuRelatif(new Date("2026-11-01T11:59:30Z"), sekarang)).toBe("Baru saja");
    expect(waktuRelatif(new Date("2026-11-01T11:15:00Z"), sekarang)).toBe("45 menit lalu");
    expect(waktuRelatif(new Date("2026-11-01T07:00:00Z"), sekarang)).toBe("5 jam lalu");
    expect(waktuRelatif(new Date("2026-10-30T12:00:00Z"), sekarang)).toBe("2 hari lalu");
    expect(waktuRelatif(new Date("2026-10-01T20:00:00Z"), sekarang)).toBe("2 Oktober 2026");
  });
});
