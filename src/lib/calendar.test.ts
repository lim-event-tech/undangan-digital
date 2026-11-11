import { describe, expect, it } from "vitest";
import { buildIcs, calendarSlots, googleCalendarUrl, type CalendarEvent } from "./calendar";
import { countdownTarget, eventInstant, remaining } from "./countdown";

const utama: CalendarEvent = {
  id: "utama-1",
  name: "Acara utama",
  date: "2026-12-12",
  time: "08:00",
  timezone: "WIB",
  venueName: "Aula Graha Puspa",
  address: "Jl. Dago Atas No. 88, Bandung",
  mapsUrl: "https://maps.app.goo.gl/abc123",
};

const lanjutan: CalendarEvent = {
  ...utama,
  id: "lanjutan-1",
  name: "Sesi lanjutan",
  time: "11:00:00",
  timezone: "WITA",
};

describe("eventInstant", () => {
  it("memakai selisih zona waktu acara", () => {
    expect(eventInstant("2026-12-12", "08:00", "WIB")?.toISOString()).toBe("2026-12-12T01:00:00.000Z");
    expect(eventInstant("2026-12-12", "08:00", "WITA")?.toISOString()).toBe("2026-12-12T00:00:00.000Z");
    expect(eventInstant("2026-12-12", "08:00", "WIT")?.toISOString()).toBe("2026-12-11T23:00:00.000Z");
  });

  it("menerima jam dengan detik dan menolak tanggal atau jam yang rusak", () => {
    expect(eventInstant("2026-12-12", "11:00:00", "WIB")?.toISOString()).toBe("2026-12-12T04:00:00.000Z");
    expect(eventInstant("2026-13-40", "08:00", "WIB")).toBeNull();
    expect(eventInstant("2026-12-12", "25:00", "WIB")).toBeNull();
  });
});

describe("countdownTarget dan remaining", () => {
  it("memilih acara paling awal yang punya tanggal dan jam", () => {
    const target = countdownTarget([
      { date: null, time: "08:00", timezone: "WIB" },
      { date: "2026-12-12", time: "11:00", timezone: "WIB" },
      { date: "2026-12-12", time: "10:00", timezone: "WITA" },
    ]);
    expect(target?.toISOString()).toBe("2026-12-12T02:00:00.000Z");
    expect(countdownTarget([{ date: null, time: null, timezone: "WIB" }])).toBeNull();
    expect(countdownTarget([])).toBeNull();
  });

  it("menghitung hari, jam, menit, dan detik tersisa", () => {
    const target = new Date("2026-12-12T01:00:00.000Z");
    const now = new Date("2026-12-10T22:58:30.000Z");
    expect(remaining(target, now)).toEqual({ past: false, days: 1, hours: 2, minutes: 1, seconds: 30 });
  });

  it("menandai acara yang sudah lewat tanpa angka negatif", () => {
    const target = new Date("2026-12-12T01:00:00.000Z");
    expect(remaining(target, target)).toEqual({ past: true, days: 0, hours: 0, minutes: 0, seconds: 0 });
    expect(remaining(target, new Date("2027-01-01T00:00:00.000Z")).past).toBe(true);
  });
});

describe("calendarSlots dan googleCalendarUrl", () => {
  const slots = calendarSlots([lanjutan, utama, { ...utama, id: "x", date: null }], "Raka & Nadia");

  it("mengurutkan menurut waktu, melewati acara tanpa tanggal, dan memberi durasi 2 jam", () => {
    expect(slots.map((s) => s.id)).toEqual(["utama-1", "lanjutan-1"]);
    expect(slots[1].start.toISOString()).toBe("2026-12-12T03:00:00.000Z");
    expect(slots[1].end.getTime() - slots[1].start.getTime()).toBe(120 * 60_000);
    expect(slots[1].title).toBe("Sesi lanjutan Raka & Nadia");
    expect(slots[1].location).toBe("Aula Graha Puspa, Jl. Dago Atas No. 88, Bandung");
  });

  it("membuat tautan Google Kalender dengan waktu UTC", () => {
    const url = new URL(googleCalendarUrl(slots[0]));
    expect(url.origin + url.pathname).toBe("https://calendar.google.com/calendar/render");
    expect(url.searchParams.get("action")).toBe("TEMPLATE");
    expect(url.searchParams.get("text")).toBe("Acara utama Raka & Nadia");
    expect(url.searchParams.get("dates")).toBe("20261212T010000Z/20261212T030000Z");
    expect(url.searchParams.get("details")).toContain("https://maps.app.goo.gl/abc123");
  });
});

describe("buildIcs", () => {
  const slots = calendarSlots([utama], "Raka; Nadia, berdua");
  const ics = buildIcs(slots, { uidDomain: "undangan.test", now: new Date("2026-11-01T00:00:00.000Z") });

  it("menghasilkan kalender dengan akhir baris CRLF dan acara lengkap", () => {
    expect(ics.startsWith("BEGIN:VCALENDAR\r\nVERSION:2.0\r\n")).toBe(true);
    expect(ics.endsWith("END:VEVENT\r\nEND:VCALENDAR\r\n")).toBe(true);
    expect(ics).toContain("UID:utama-1@undangan.test\r\n");
    expect(ics).toContain("DTSTAMP:20261101T000000Z\r\n");
    expect(ics).toContain("DTSTART:20261212T010000Z\r\n");
    expect(ics).toContain("DTEND:20261212T030000Z\r\n");
  });

  it("meloloskan koma dan titik koma, dan melipat baris yang lebih dari 75 byte", () => {
    expect(ics).toContain("SUMMARY:Acara utama Raka\\; Nadia\\, berdua\r\n");
    for (const line of ics.split("\r\n")) {
      expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
    }
    const unfolded = ics.replace(/\r\n /g, "");
    expect(unfolded).toContain("LOCATION:Aula Graha Puspa\\, Jl. Dago Atas No. 88\\, Bandung");
  });
});

describe("acara beberapa hari", () => {
  it("membentang dari mulai hari pertama sampai jam selesai hari terakhir", () => {
    const [slot] = calendarSlots([{ id: "a", name: "Konferensi", date: "2027-02-20", endDate: "2027-02-22", time: "09:00", endTime: "17:00", timezone: "WIB", venueName: null, address: null, mapsUrl: null }], "Nasional");
    expect(slot.start.toISOString()).toBe("2027-02-20T02:00:00.000Z");
    expect(slot.end.toISOString()).toBe("2027-02-22T10:00:00.000Z");
  });

  it("memakai akhir hari terakhir bila jam selesai kosong", () => {
    const [slot] = calendarSlots([{ id: "a", name: "Konferensi", date: "2027-02-20", endDate: "2027-02-21", time: "09:00", timezone: "WIB", venueName: null, address: null, mapsUrl: null }], "Nasional");
    expect(slot.end.toISOString()).toBe("2027-02-21T16:59:00.000Z");
  });
});
