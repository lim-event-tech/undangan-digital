import { describe, expect, it } from "vitest";
import { TEMPLATES } from "@/templates/registry";
import { KARTU_TEMPLATE, angkaKata } from "./kartu-template";

describe("kartu template di landing", () => {
  it("punya kartu untuk setiap template dari kode", () => {
    expect(Object.keys(KARTU_TEMPLATE).sort()).toEqual(TEMPLATES.map((t) => t.key).sort());
  });

  it("menuliskan jumlah template dengan kata", () => {
    expect(angkaKata(1)).toBe("Satu");
    expect(angkaKata(5)).toBe("Lima");
    expect(angkaKata(10)).toBe("Sepuluh");
    expect(angkaKata(12)).toBe("12");
    expect(angkaKata(2.5)).toBe("2.5");
  });
});
