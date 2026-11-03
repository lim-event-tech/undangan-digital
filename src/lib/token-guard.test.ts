import { describe, expect, it } from "vitest";
import { TokenGuard, clientKey } from "./token-guard";

const options = { maxFailures: 3, windowMs: 1000, maxTracked: 4 };

describe("TokenGuard", () => {
  it("memblokir setelah batas gagal tercapai dan melepas setelah jendela waktu lewat", () => {
    const guard = new TokenGuard(options);
    guard.recordFailure("a", 0);
    guard.recordFailure("a", 100);
    expect(guard.isBlocked("a", 200)).toBe(false);
    guard.recordFailure("a", 200);
    expect(guard.isBlocked("a", 300)).toBe(true);
    expect(guard.retryAfterSeconds("a", 300)).toBe(1);
    expect(guard.isBlocked("a", 999)).toBe(true);
    expect(guard.isBlocked("a", 1001)).toBe(false);
    expect(guard.retryAfterSeconds("a", 1001)).toBe(0);
  });

  it("menghitung tiap kunci sendiri-sendiri", () => {
    const guard = new TokenGuard(options);
    for (let i = 0; i < 3; i += 1) guard.recordFailure("a", i);
    expect(guard.isBlocked("a", 10)).toBe(true);
    expect(guard.isBlocked("b", 10)).toBe(false);
  });

  it("bisa direset", () => {
    const guard = new TokenGuard(options);
    for (let i = 0; i < 3; i += 1) guard.recordFailure("a", i);
    guard.reset("a");
    expect(guard.isBlocked("a", 10)).toBe(false);
  });

  it("membuang kunci tertua saat melewati batas pelacakan", () => {
    const guard = new TokenGuard(options);
    for (let i = 0; i < 3; i += 1) guard.recordFailure("lama", 0);
    expect(guard.isBlocked("lama", 0)).toBe(true);
    for (let i = 0; i < 6; i += 1) guard.recordFailure(`ip-${i}`, 0);
    expect(guard.isBlocked("lama", 0)).toBe(false);
  });
});

describe("clientKey", () => {
  it("memakai alamat terakhir di x-forwarded-for yang ditambahkan proxy", () => {
    expect(clientKey("1.2.3.4, 5.6.7.8", null)).toBe("5.6.7.8");
    expect(clientKey("9.9.9.9", "1.1.1.1")).toBe("9.9.9.9");
  });

  it("jatuh ke x-real-ip lalu ke kunci bersama", () => {
    expect(clientKey(null, "1.1.1.1")).toBe("1.1.1.1");
    expect(clientKey(null, null)).toBe("tidak-diketahui");
    expect(clientKey("", " ")).toBe("tidak-diketahui");
  });
});
