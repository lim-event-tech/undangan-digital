import { afterEach, describe, expect, it, vi } from "vitest";
import { guestLink, guestPath } from "./app-url";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("link tamu", () => {
  it("memakai token langsung di belakang domain tanpa slug", () => {
    vi.stubEnv("BETTER_AUTH_URL", "https://undangan.example.com/");
    expect(guestPath("AbCd1234")).toBe("/AbCd1234");
    expect(guestLink("AbCd1234")).toBe("https://undangan.example.com/AbCd1234");
  });
});
