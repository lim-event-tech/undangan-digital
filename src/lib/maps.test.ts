import { describe, expect, it } from "vitest";
import { isMapsUrl, normalizeMapsUrl } from "./maps";

const PANJANG = "https://www.google.com/maps/place/Citimall+Garut/@-7.2187904,107.8984704,14z/data=!4m6!3m5!1s0x2e68b137fb274123:0xdc5014afdc744021!8m2!3d-7.2140121!4d107.9211193!16s%2Fg%2F11vqln0jf2?entry=ttu&g_ep=EgoyMDI2MTEwOC4wIKXMDSoASAFQAw%3D%3D";

describe("isMapsUrl", () => {
  it.each([
    PANJANG,
    "https://maps.app.goo.gl/6XR7hhC4Tqky2PQx9",
    "https://goo.gl/maps/xyz123",
    "https://maps.google.com/?q=-6.2,106.8",
    "https://www.openstreetmap.org/?mlat=-6.2&mlon=106.8",
    "https://waze.com/ul?q=Garut",
    "https://maps.apple.com/?q=Garut",
    "  https://maps.app.goo.gl/AbC123  ",
  ])("menerima %s", (url) => {
    expect(isMapsUrl(url)).toBe(true);
  });

  it.each([
    "",
    "http://maps.app.goo.gl/AbC123",
    "maps.app.goo.gl/AbC123",
    "https://user@maps.app.goo.gl/AbC123",
    "https://localhost/maps",
    "https://bukan domain/maps",
    "javascript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "ftp://maps.app.goo.gl/AbC",
  ])("menolak %s", (url) => {
    expect(isMapsUrl(url)).toBe(false);
  });
});

describe("normalizeMapsUrl", () => {
  it("melengkapi https untuk link tanpa awalan dan mempertahankan link lengkap", () => {
    expect(normalizeMapsUrl("maps.app.goo.gl/AbC123")).toBe("https://maps.app.goo.gl/AbC123");
    expect(normalizeMapsUrl("  www.google.com/maps/place/Aula  ")).toBe("https://www.google.com/maps/place/Aula");
    expect(normalizeMapsUrl(PANJANG)).toBe(PANJANG);
  });

  it.each(["", "garut", "http://maps.app.goo.gl/AbC", "javascript:alert(1)", "data:text/html,x", "ftp://a.com/x"])("menolak %s", (nilai) => {
    expect(normalizeMapsUrl(nilai)).toBeNull();
  });
});
