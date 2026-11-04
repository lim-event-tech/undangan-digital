import { readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { RESERVED_SLUGS, makeSlugBase, slugCandidate, slugify } from "./slug";

describe("slugify", () => {
  it("membuang aksen dan simbol", () => {
    expect(slugify("Râka  Pratama!")).toBe("raka-pratama");
  });

  it("mengubah & menjadi dan", () => {
    expect(slugify("Raka & Budi")).toBe("raka-dan-budi");
  });
});

describe("makeSlugBase", () => {
  it("membuat slug dari judul event", () => {
    expect(makeSlugBase("Gathering Komunitas")).toBe("gathering-komunitas");
  });

  it("memberi nilai bawaan bila nama kosong", () => {
    expect(makeSlugBase("")).toBe("event");
    expect(makeSlugBase("!!!")).toBe("event");
  });

  it("menghindari kata yang dicadangkan sistem", () => {
    expect(makeSlugBase("admin")).toBe("admin-undangan");
    expect(makeSlugBase("api")).toBe("api-undangan");
    expect(makeSlugBase("Foto")).toBe("foto-undangan");
    expect(makeSlugBase("Contoh")).toBe("contoh-undangan");
  });

  it("mencadangkan setiap rute tingkat atas aplikasi agar tidak bentrok dengan link tamu", () => {
    const rute = readdirSync(join(process.cwd(), "src/app"), { withFileTypes: true })
      .filter((d) => d.isDirectory() && !/^[[(_]/.test(d.name))
      .map((d) => d.name);
    expect(rute.length).toBeGreaterThan(5);
    for (const nama of rute) expect({ nama, dicadangkan: RESERVED_SLUGS.has(nama) }).toEqual({ nama, dicadangkan: true });
    expect(RESERVED_SLUGS.has(makeSlugBase(""))).toBe(false);
  });

  it("mencadangkan setiap folder di public agar tidak bentrok dengan link tamu", () => {
    const folder = readdirSync(join(process.cwd(), "public"), { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);
    expect(folder).toContain("template");
    for (const nama of folder) expect({ nama, dicadangkan: RESERVED_SLUGS.has(nama) }).toEqual({ nama, dicadangkan: true });
  });

  it("memotong nama panjang tanpa meninggalkan tanda hubung di ujung", () => {
    const slug = makeSlugBase("a".repeat(40) + " " + "b".repeat(40));
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
