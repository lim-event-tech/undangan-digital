import { describe, expect, it } from "vitest";
import { isRsvpClosed, parseRsvpDeadline } from "./shared";

describe("parseRsvpDeadline", () => {
  const now = new Date("2026-11-04T03:00:00.000Z");

  it("membolehkan tanpa batas waktu", () => {
    expect(parseRsvpDeadline("", now)).toEqual({ ok: true, deadline: null });
  });

  it.each(["2026-02-30", "04/11/2026"])("menolak tanggal tidak valid %s", (value) => {
    expect(parseRsvpDeadline(value, now)).toEqual({ ok: false, error: "Tanggal tidak valid" });
  });

  it("menolak tanggal sebelum hari ini", () => {
    expect(parseRsvpDeadline("2026-11-03", now)).toEqual({
      ok: false,
      error: "Batas waktu RSVP tidak boleh sebelum hari ini",
    });
  });

  it.each(["2026-11-04", "2026-11-05"])("menerima hari ini atau mendatang %s", (value) => {
    expect(parseRsvpDeadline(value, now)).toEqual({
      ok: true,
      deadline: new Date(`${value}T23:59:59+07:00`),
    });
  });

  it("mengikuti pergantian hari WIB meskipun tanggal UTC belum berganti", () => {
    expect(parseRsvpDeadline("2026-11-04", new Date("2026-11-04T16:59:59.000Z")).ok).toBe(true);
    expect(parseRsvpDeadline("2026-11-04", new Date("2026-11-04T17:00:00.000Z")).ok).toBe(false);
    expect(parseRsvpDeadline("2026-11-05", new Date("2026-11-04T17:00:00.000Z")).ok).toBe(true);
  });
});

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

describe("batas RSVP dengan jam", () => {
  const now = new Date("2026-11-04T03:00:00.000Z");

  it("memakai jam yang dipilih (WIB) dan berakhir di akhir menit itu, bawaan 23.59", () => {
    expect(parseRsvpDeadline("2026-11-10", now, "17:30")).toEqual({ ok: true, deadline: new Date("2026-11-10T10:30:59.000Z") });
    expect(parseRsvpDeadline("2026-11-10", now)).toEqual({ ok: true, deadline: new Date("2026-11-10T16:59:59.000Z") });
  });

  it("menolak jam tidak valid dan batas hari ini yang jamnya sudah lewat", () => {
    expect(parseRsvpDeadline("2026-11-10", now, "25:00")).toEqual({ ok: false, error: "Jam tidak valid" });
    expect(parseRsvpDeadline("2026-11-04", now, "09:00")).toEqual({ ok: false, error: "Batas waktu RSVP tidak boleh sudah lewat" });
    expect(parseRsvpDeadline("2026-11-04", now, "11:00").ok).toBe(true);
  });

  it("menutup RSVP tepat setelah jam batas", () => {
    const batas = parseRsvpDeadline("2026-11-10", now, "17:30");
    if (!batas.ok || !batas.deadline) throw new Error("batas tidak ada");
    expect(isRsvpClosed(batas.deadline, new Date("2026-11-10T10:30:59.000Z"))).toBe(false);
    expect(isRsvpClosed(batas.deadline, new Date("2026-11-10T10:31:00.000Z"))).toBe(true);
  });
});
