import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { DEFAULT_TEMPLATE, TEMPLATES, isTemplateKey, gambarTemplate, keDaftarPilihan, namaTemplate, templateInfo } from "./registry";

describe("registry template", () => {
  it("memuat empat template dengan kunci unik", () => {
    expect(TEMPLATES.map((t) => t.key)).toEqual(["melati", "keraton", "bintang", "pasundan"]);
    expect(isTemplateKey(DEFAULT_TEMPLATE)).toBe(true);
    expect(isTemplateKey("lain")).toBe(false);
    expect(templateInfo("lain").key).toBe("melati");
  });

  it("menunjuk pratinjau yang tersedia dengan nama tema dan fallback yang aman", () => {
    expect(gambarTemplate("keraton")).toEqual({ hp: "/template/keraton-hp.jpg", desktop: "/template/keraton-desktop.jpg" });
    expect(gambarTemplate("../lain").hp).toBe("/template/paviliun-hp.jpg");
    expect(gambarTemplate("pasundan").desktop).toBe("/template/tembaga-desktop.jpg");
    expect(gambarTemplate("bintang").hp).toBe("/template/malam-berbintang-hp.jpg");
    for (const template of TEMPLATES) for (const src of Object.values(gambarTemplate(template.key))) {
      expect(existsSync(join(process.cwd(), "public", src.slice(1)))).toBe(true);
    }
  });

  it("melengkapi katalog dari database dengan keterangan dari kode", () => {
    expect(keDaftarPilihan([{ key: "bintang", label: "Bintang Malam", ribbon: "Baru" }])).toEqual([
      expect.objectContaining({ key: "bintang", label: "Bintang Malam", ribbon: "Baru", ket: "Navy dan emas, bulan sabit serta rasi bintang" }),
    ]);
  });

  it("menampilkan pengganti nama bawaan lama tanpa mengubah kunci atau nama khusus admin", () => {
    expect(keDaftarPilihan([{ key: "melati", label: "Melati", ribbon: null }, { key: "pasundan", label: "Pasundan", ribbon: "Baru" }])).toEqual([
      expect.objectContaining({ key: "melati", label: "Paviliun" }),
      expect.objectContaining({ key: "pasundan", label: "Tembaga", ribbon: "Baru" }),
    ]);
    expect(namaTemplate("melati", "Nama khusus")).toBe("Nama khusus");
    expect(namaTemplate("melati", "Editorial Gading")).toBe("Paviliun");
    expect(namaTemplate("melati", "Paviliun Senja")).toBe("Paviliun");
    expect(namaTemplate("pasundan", "Tembaga Geometris")).toBe("Tembaga");
    expect(namaTemplate("pasundan", "Tembaga pilihan")).toBe("Tembaga pilihan");
  });
});
