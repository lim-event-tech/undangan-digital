import { afterEach, describe, expect, it, vi } from "vitest";
import { guestLink, guestPath } from "./app-url";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("link tamu", () => {
  it("memakai slug langsung di belakang domain tanpa awalan /u", () => {
    vi.stubEnv("BETTER_AUTH_URL", "https://undangan.example.com/");
    expect(guestPath("raka-dan-nadia", "AbCdEfGh12345678")).toBe("/raka-dan-nadia/AbCdEfGh12345678");
    expect(guestLink("raka-dan-nadia", "AbCdEfGh12345678")).toBe(
      "https://undangan.example.com/raka-dan-nadia/AbCdEfGh12345678",
    );
  });
});
