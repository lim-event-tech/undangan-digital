import { describe, expect, it } from "vitest";
import { DEFAULT_TAMPILAN } from "@/lib/invitations/tampilan";
import { PALET_KUSTOM, gayaKustom, paletBidang } from "./kustom";
import { gayaPanggung } from "./panggung";

const WARNA = { kertas: "#fbf6ea", teks: "#3d3426", utama: "#8a6420", aksen: "#b8934a" };

describe("gayaKustom", () => {
  it("tidak menimpa apa pun pada tampilan bawaan", () => {
    expect(gayaKustom(DEFAULT_TAMPILAN)).toEqual({});
  });

  it("hanya mengganti font bila palet tidak dikustomisasi", () => {
    expect(gayaKustom({ ...DEFAULT_TAMPILAN, font: "cinzel-jost" })).toEqual({
      "--event-serif": "'Cinzel',serif",
      "--event-sans": "'Jost',sans-serif",
    });
  });

  it("menurunkan seluruh variabel tema dari empat warna dan mematikan tekstur", () => {
    const gaya = gayaKustom({ hiasan: true, warna: WARNA, font: "bawaan" }) as Record<string, string>;
    expect(gaya["--event-kertas"]).toBe("#fbf6ea");
    expect(gaya["--event-teks"]).toBe("#3d3426");
    expect(gaya["--event-utama"]).toBe("#8a6420");
    expect(gaya["--event-aksen"]).toBe("#b8934a");
    expect(gaya["--event-tombol-teks"]).toBe("#fbf6ea");
    expect(gaya["--event-tekstur-luar"]).toBe("none");
    for (const kunci of ["kartu", "lembut", "latar", "garis", "muted"]) {
      expect(gaya[`--event-${kunci}`], kunci).toMatch(/^color-mix\(in srgb, /);
    }
    expect(gaya).not.toHaveProperty("--event-serif");
  });
});

describe("palet bagian", () => {
  it("memakai variabel tema agar tombol RSVP ikut palet kustom", () => {
    expect(PALET_KUSTOM.on).toEqual({ bg: "var(--event-utama)", fg: "var(--event-kertas)", bd: "var(--event-utama)" });
    expect(PALET_KUSTOM.off.bg).toBe("var(--event-kertas)");
  });

  it("menyusun enam bidang dengan bidang pertama sama dengan latar", () => {
    const terang = paletBidang(WARNA, true);
    const gelap = paletBidang({ ...WARNA, kertas: "#1c1a17" }, false);
    expect(terang).toHaveLength(6);
    expect(terang[0]).toBe("#fbf6ea");
    expect(gelap[0]).toBe("#1c1a17");
    expect(terang[5]).toContain("#3d3426");
    expect(gelap[5]).toContain("#000000");
  });

  it("gayaPanggung memakai palet bawaan tema atau palet kustom", () => {
    const bawaan = gayaPanggung("pasundan", "acara", "rsvp") as Record<string, string>;
    expect(bawaan["--bidang"]).toBe("#f4e9dc");
    expect(bawaan["--bidang-berikut"]).toBe("#e9d7c1");
    const kustom = gayaPanggung("pasundan", "acara", "rsvp", WARNA, true) as Record<string, string>;
    expect(kustom["--bidang"]).toBe(paletBidang(WARNA, true)[2]);
    expect(kustom["--bidang-berikut"]).toBe(paletBidang(WARNA, true)[3]);
  });
});
