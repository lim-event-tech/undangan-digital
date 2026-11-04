import { describe, expect, it } from "vitest";
import { isGoogleMapsUrl } from "./maps";

describe("isGoogleMapsUrl", () => {
  it.each([
    "https://maps.app.goo.gl/AbC123xyz",
    "https://goo.gl/maps/xyz123",
    "https://www.google.com/maps/place/Gedung+Serbaguna",
    "https://www.google.com/maps",
    "https://google.co.id/maps?q=Gedung",
    "https://maps.google.com/?q=-6.2,106.8",
    "  https://maps.app.goo.gl/AbC123  ",
  ])("menerima %s", (url) => {
    expect(isGoogleMapsUrl(url)).toBe(true);
  });

  it.each([
    "",
    "https://bit.ly/lanjutan-raka",
    "http://maps.app.goo.gl/AbC123",
    "https://maps.app.goo.gl.evil.com/AbC123",
    "https://evil.com/maps/place/x",
    "https://www.google.com/search?q=maps",
    "https://www.google.com/mapsfoo",
    "https://google.com.evil.com/maps/x",
    "https://user@maps.app.goo.gl/AbC123",
    "https://maps.app.goo.gl:8443/AbC123",
    "https://maps.app.goo.gl/",
    "https://goo.gl/other",
    "maps.app.goo.gl/AbC123",
    "javascript:alert(1)",
  ])("menolak %s", (url) => {
    expect(isGoogleMapsUrl(url)).toBe(false);
  });
});
