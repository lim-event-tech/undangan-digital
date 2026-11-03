import { describe, expect, it } from "vitest";
import { isRsvpClosed } from "./shared";

describe("isRsvpClosed", () => {
  const deadline = new Date("2026-12-10T16:59:59.000Z");

  it("tertutup hanya setelah batas waktu lewat", () => {
    expect(isRsvpClosed(deadline, new Date("2026-12-10T16:59:59.000Z"))).toBe(false);
    expect(isRsvpClosed(deadline, new Date("2026-12-10T17:00:00.000Z"))).toBe(true);
    expect(isRsvpClosed(deadline, new Date("2026-11-01T00:00:00.000Z"))).toBe(false);
  });

  it("tidak pernah tertutup bila tanpa batas waktu", () => {
    expect(isRsvpClosed(null, new Date("2099-01-01T00:00:00.000Z"))).toBe(false);
  });

  it("memakai waktu sekarang bila tidak diberi waktu", () => {
    expect(isRsvpClosed(new Date(Date.now() - 1000))).toBe(true);
    expect(isRsvpClosed(new Date(Date.now() + 3_600_000))).toBe(false);
  });
});
