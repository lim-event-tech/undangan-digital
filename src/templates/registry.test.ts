import { describe, expect, it } from "vitest";
import { DEFAULT_TEMPLATE, TEMPLATES, isTemplateKey, gambarTemplate, keDaftarPilihan, templateInfo } from "./registry";

describe("registry template", () => {
  it("memuat empat template dengan kunci unik", () => {
    expect(TEMPLATES.map((t) => t.key)).toEqual(["melati", "keraton", "bintang", "pasundan"]);
    expect(isTemplateKey(DEFAULT_TEMPLATE)).toBe(true);
    expect(isTemplateKey("lain")).toBe(false);
    expect(templateInfo("lain").key).toBe("melati");
  });

  it("menunjuk gambar tangkapan layar menurut kunci template", () => {
    expect(gambarTemplate("keraton")).toEqual({ hp: "/template/keraton-hp.jpg", desktop: "/template/keraton-desktop.jpg" });
    expect(gambarTemplate("../lain").hp).toBe("/template/melati-hp.jpg");
  });

  it("melengkapi katalog dari database dengan keterangan dari kode", () => {
    expect(keDaftarPilihan([{ key: "bintang", label: "Bintang Malam", ribbon: "Baru" }])).toEqual([
      expect.objectContaining({ key: "bintang", label: "Bintang Malam", ribbon: "Baru", ket: "Navy klasik, willow, kunang-kunang" }),
    ]);
  });
});
