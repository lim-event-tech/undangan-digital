import { describe, expect, it } from "vitest";
import {
  dateFromDeadline,
  deadlineFromDate,
  formatDate,
  formatDots,
  formatLongDate,
  formatStamp,
  formatTime,
  isDateString,
  isTimeString,
  isZone,
  shortTime,
  todayInZone,
  todayWib,
} from "./datetime";

describe("isDateString", () => {
  it("menerima tanggal kalender yang nyata", () => {
    expect(isDateString("2026-11-05")).toBe(true);
    expect(isDateString("2028-02-29")).toBe(true);
  });

  it("menolak tanggal yang tidak ada atau salah format", () => {
    expect(isDateString("2026-02-30")).toBe(false);
    expect(isDateString("2027-02-29")).toBe(false);
    expect(isDateString("2026-13-01")).toBe(false);
    expect(isDateString("26-11-05")).toBe(false);
    expect(isDateString("")).toBe(false);
  });
});

describe("isTimeString", () => {
  it("menerima jam 24 jam dua digit", () => {
    expect(isTimeString("00:00")).toBe(true);
    expect(isTimeString("09:30")).toBe(true);
    expect(isTimeString("23:59")).toBe(true);
  });

  it("menolak jam di luar rentang atau salah format", () => {
    expect(isTimeString("24:00")).toBe(false);
    expect(isTimeString("09:60")).toBe(false);
    expect(isTimeString("9:00")).toBe(false);
    expect(isTimeString("09:00:00")).toBe(false);
  });
});

describe("isZone", () => {
  it("hanya menerima WIB, WITA, dan WIT", () => {
    expect(isZone("WIB")).toBe(true);
    expect(isZone("WITA")).toBe(true);
    expect(isZone("WIT")).toBe(true);
    expect(isZone("UTC")).toBe(false);
    expect(isZone(undefined)).toBe(false);
  });
});

describe("shortTime", () => {
  it("memotong detik dari nilai kolom time", () => {
    expect(shortTime("09:30:00")).toBe("09:30");
    expect(shortTime(null)).toBeNull();
  });
});

describe("format tanggal Indonesia", () => {
  it("menulis tanggal panjang lengkap dengan nama hari", () => {
    expect(formatDate("2026-12-20")).toBe("20 Desember 2026");
    expect(formatLongDate("2026-12-20")).toBe("Minggu, 20 Desember 2026");
    expect(formatLongDate("2026-11-05")).toBe("Kamis, 5 November 2026");
    expect(formatLongDate("2028-02-29")).toBe("Selasa, 29 Februari 2028");
  });

  it("menulis tanggal sampul dengan titik pemisah", () => {
    expect(formatDots("2026-12-12")).toBe("12 . 12 . 2026");
    expect(formatDots("2026-11-05")).toBe("05 . 11 . 2026");
  });

  it("menulis jam dengan titik dan zona waktu", () => {
    expect(formatTime("09:00", "WIB")).toBe("09.00 WIB");
    expect(formatTime("19:30:00", "WITA")).toBe("19.30 WITA");
  });

  it("menulis cap waktu dalam WIB", () => {
    expect(formatStamp(new Date("2026-11-01T07:05:00.000Z"))).toBe("1 Nov 2026, 14.05");
    expect(formatStamp(new Date("2026-12-31T18:00:00.000Z"))).toBe("1 Jan 2027, 01.00");
  });
});

describe("tanggal hari ini", () => {
  it("mengikuti zona yang dipilih ketika hari sudah berganti di Indonesia timur", () => {
    const now = new Date("2026-11-04T15:30:00.000Z");
    expect(todayInZone("WIB", now)).toBe("2026-11-04");
    expect(todayInZone("WITA", now)).toBe("2026-11-04");
    expect(todayInZone("WIT", now)).toBe("2026-11-05");
    expect(todayWib(now)).toBe("2026-11-04");
  });

  it("mengikuti pergantian tahun di setiap zona", () => {
    const now = new Date("2026-12-31T16:30:00.000Z");
    expect(todayInZone("WIB", now)).toBe("2026-12-31");
    expect(todayInZone("WITA", now)).toBe("2027-01-01");
    expect(todayInZone("WIT", now)).toBe("2027-01-01");
  });
});

describe("batas waktu RSVP", () => {
  it("jatuh di akhir hari WIB dan kembali ke tanggal yang sama", () => {
    const deadline = deadlineFromDate("2026-11-05");
    expect(deadline.toISOString()).toBe("2026-11-05T16:59:59.000Z");
    expect(dateFromDeadline(deadline)).toBe("2026-11-05");
  });

  it("memberi teks kosong bila tidak ada batas", () => {
    expect(dateFromDeadline(null)).toBe("");
  });
});
