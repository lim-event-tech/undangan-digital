import { describe, expect, it } from "vitest";
import { dayWindow, eventDays, isTimeInWindow, parseDayTimes, readDayTimes, readVisits, timeOptions } from "./days";

describe("eventDays", () => {
  it("menyebut setiap hari dari tanggal mulai sampai selesai, satu hari bila selesai kosong", () => {
    expect(eventDays({ date: "2027-02-27", endDate: "2027-03-02" })).toEqual(["2027-02-27", "2027-02-28", "2027-03-01", "2027-03-02"]);
    expect(eventDays({ date: "2027-02-20", endDate: null })).toEqual(["2027-02-20"]);
    expect(eventDays({ date: "2027-02-20", endDate: "2027-02-10" })).toEqual(["2027-02-20"]);
    expect(eventDays({ date: null, endDate: "2027-02-10" })).toEqual([]);
  });

  it("membatasi rentang maksimal 31 hari", () => {
    expect(eventDays({ date: "2027-01-01", endDate: "2027-12-31" })).toHaveLength(31);
  });
});

describe("jendela waktu", () => {
  const acara = { time: "09:00", endTime: "11:00", dayTimes: [{ date: "2027-02-21", start: "13:00", end: "15:00" }] };

  it("memakai jam khusus hari itu bila ada, selain itu jam acara", () => {
    expect(dayWindow(acara, "2027-02-20")).toEqual({ start: "09:00", end: "11:00", custom: false });
    expect(dayWindow(acara, "2027-02-21")).toEqual({ start: "13:00", end: "15:00", custom: true });
  });

  it("membuat pilihan jam setiap 30 menit dalam rentang dan sampai 23.30 bila tanpa jam selesai", () => {
    expect(timeOptions("09:00", "11:00")).toEqual(["09:00", "09:30", "10:00", "10:30", "11:00"]);
    expect(timeOptions("09:15", "10:15")).toEqual(["09:15", "09:45", "10:15"]);
    expect(timeOptions("22:00", null)).toEqual(["22:00", "22:30", "23:00", "23:30"]);
    expect(timeOptions(null, "10:00")).toEqual([]);
  });

  it("memeriksa jam berada dalam jendela", () => {
    expect(isTimeInWindow("09:00", "09:00", "11:00")).toBe(true);
    expect(isTimeInWindow("11:00", "09:00", "11:00")).toBe(true);
    expect(isTimeInWindow("11:01", "09:00", "11:00")).toBe(false);
    expect(isTimeInWindow("08:59", "09:00", "11:00")).toBe(false);
    expect(isTimeInWindow("25:00", "09:00", "11:00")).toBe(false);
    expect(isTimeInWindow("10:00", null, null)).toBe(false);
  });
});

describe("pembacaan dan penguraian", () => {
  it("parseDayTimes mengabaikan hari kosong dan menolak pasangan jam yang tidak lengkap atau terbalik", () => {
    const hari = ["2027-02-20", "2027-02-21", "2027-02-22"];
    const baca = (nilai: Record<string, string>) => (field: string) => nilai[field] ?? "";
    expect(parseDayTimes(hari, baca({ "mulai-2027-02-21": "10:00", "selesai-2027-02-21": "12:00" }))).toEqual({ ok: true, dayTimes: [{ date: "2027-02-21", start: "10:00", end: "12:00" }] });
    expect(parseDayTimes(hari, baca({ "mulai-2027-02-20": "10:00" }))).toMatchObject({ ok: false, errors: { "selesai-2027-02-20": expect.any(String) } });
    expect(parseDayTimes(hari, baca({ "selesai-2027-02-20": "10:00" }))).toMatchObject({ ok: false, errors: { "mulai-2027-02-20": expect.any(String) } });
    expect(parseDayTimes(hari, baca({ "mulai-2027-02-22": "12:00", "selesai-2027-02-22": "12:00" }))).toMatchObject({ ok: false });
  });

  it("readDayTimes dan readVisits membuang data rusak dan duplikat", () => {
    expect(readDayTimes([{ date: "2027-02-21", start: "10:00", end: "12:00" }, { date: "2027-02-21", start: "11:00", end: "12:00" }, { date: "x", start: "10:00", end: "12:00" }, { date: "2027-02-22", start: "12:00", end: "10:00" }, null, "a"])).toEqual([{ date: "2027-02-21", start: "10:00", end: "12:00" }]);
    expect(readDayTimes("rusak")).toEqual([]);
    expect(readVisits([{ date: "2027-02-21", time: "10:00" }, { date: "2027-02-21", time: "11:00" }, { date: "2027-02-20", time: null }, { date: "2027-02-22", time: "99:00" }, 4])).toEqual([{ date: "2027-02-20", time: null }, { date: "2027-02-21", time: "10:00" }]);
  });
});
