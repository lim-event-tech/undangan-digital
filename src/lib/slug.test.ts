import { describe, expect, it } from "vitest";
import { makeSlugBase, slugCandidate, slugify } from "./slug";

describe("slugify", () => {
  it("membuang aksen dan simbol", () => {
    expect(slugify("Râka  Pratama!")).toBe("raka-pratama");
  });

  it("mengubah & menjadi dan", () => {
    expect(slugify("Raka & Budi")).toBe("raka-dan-budi");
  });
});

describe("makeSlugBase", () => {
  it("menggabungkan nama kedua mempelai", () => {
    expect(makeSlugBase("Raka", "Nádia")).toBe("raka-dan-nadia");
  });

  it("memberi nilai bawaan bila nama kosong", () => {
    expect(makeSlugBase("", "")).toBe("undangan");
    expect(makeSlugBase("!!!", "???")).toBe("undangan");
  });

  it("menghindari kata yang dicadangkan sistem", () => {
    expect(makeSlugBase("admin", "")).toBe("admin-undangan");
    expect(makeSlugBase("", "api")).toBe("api-undangan");
  });

  it("memotong nama panjang tanpa meninggalkan tanda hubung di ujung", () => {
    const slug = makeSlugBase("a".repeat(40), "b".repeat(40));
    expect(slug.length).toBeLessThanOrEqual(60);
    expect(slug.endsWith("-")).toBe(false);
  });
});

describe("slugCandidate", () => {
  it("menambahkan nomor urut mulai percobaan kedua", () => {
    expect(slugCandidate("raka-dan-nadia", 0)).toBe("raka-dan-nadia");
    expect(slugCandidate("raka-dan-nadia", 1)).toBe("raka-dan-nadia-2");
    expect(slugCandidate("raka-dan-nadia", 2)).toBe("raka-dan-nadia-3");
  });
});
