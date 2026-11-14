import { describe, expect, it } from "vitest";
import { buildByGroup, buildDaily, buildFunnel } from "./charts";
import type { DashboardGuest } from "./dashboard";

function guest(overrides: Partial<DashboardGuest> & { id: string }): DashboardGuest {
  return {
    name: overrides.id,
    groupId: null,
    groupName: null,
    phone: "",
    sentAt: null,
    openedAt: null,
    remindedAt: null,
    addedByName: "",
    checkedInAt: null,
    invitedEventIds: [],
    status: "belum",
    answers: [],
    attendeeCount: 0,
    respondedAt: null,
    ...overrides,
  };
}

const when = (iso: string) => new Date(iso);

const answer = {
  eventId: "e",
  eventName: "Sesi lanjutan",
  attending: true,
  attendeeCount: 1,
  note: "",
  respondedAt: when("2026-11-10T00:00:00Z"),
};

describe("buildFunnel", () => {
  it("menghitung tahap dari diundang sampai hadir", () => {
    const sent = when("2026-11-02T00:00:00Z");
    const opened = when("2026-11-03T00:00:00Z");
    const guests = [
      guest({ id: "a", sentAt: sent, openedAt: opened, answers: [answer], status: "hadir" }),
      guest({
        id: "b",
        sentAt: sent,
        openedAt: opened,
        answers: [{ ...answer, attending: false }],
        status: "tidak",
      }),
      guest({ id: "c", sentAt: sent }),
      guest({ id: "d" }),
    ];
    expect(buildFunnel(guests).map((s) => [s.key, s.count])).toEqual([
      ["diundang", 4],
      ["terkirim", 3],
      ["dibuka", 2],
      ["menjawab", 2],
      ["hadir", 1],
    ]);
  });

  it("mengembalikan nol untuk daftar kosong", () => {
    expect(buildFunnel([]).every((s) => s.count === 0)).toBe(true);
  });
});

describe("buildDaily", () => {
  it("mengelompokkan menurut hari WIB dan mengisi hari kosong", () => {
    const guests = [
      guest({ id: "a", respondedAt: when("2026-11-10T16:30:00Z") }),
      guest({ id: "b", respondedAt: when("2026-11-10T17:30:00Z") }),
      guest({ id: "c", respondedAt: when("2026-11-11T02:00:00Z") }),
      guest({ id: "d", respondedAt: when("2026-11-13T05:00:00Z") }),
      guest({ id: "e" }),
    ];
    expect(buildDaily(guests)).toEqual([
      { date: "2026-11-10", count: 1 },
      { date: "2026-11-11", count: 2 },
      { date: "2026-11-12", count: 0 },
      { date: "2026-11-13", count: 1 },
    ]);
  });

  it("kosong bila belum ada jawaban dan dibatasi 60 hari terakhir", () => {
    expect(buildDaily([guest({ id: "a" })])).toEqual([]);
    const points = buildDaily([
      guest({ id: "a", respondedAt: when("2026-01-01T05:00:00Z") }),
      guest({ id: "b", respondedAt: when("2026-11-13T05:00:00Z") }),
    ]);
    expect(points).toHaveLength(60);
    expect(points[points.length - 1]).toEqual({ date: "2026-11-13", count: 1 });
  });
});

describe("buildByGroup", () => {
  it("merangkum status per grup dan menaruh tamu tanpa grup di akhir", () => {
    const guests = [
      guest({ id: "a", groupId: "k", groupName: "Keluarga", status: "hadir", attendeeCount: 3,  }),
      guest({ id: "b", groupId: "k", groupName: "Keluarga", status: "tidak" }),
      guest({ id: "c", groupId: "t", groupName: "Teman", status: "belum" }),
      guest({ id: "d", groupId: "k", groupName: "Keluarga", status: "hadir", attendeeCount: 1 }),
      guest({ id: "e", status: "belum" }),
      guest({ id: "f", status: "belum" }),
    ];
    const rows = buildByGroup(guests);
    expect(rows.map((r) => r.name)).toEqual(["Keluarga", "Teman", "Tanpa grup"]);
    expect(rows[0]).toMatchObject({ total: 3, hadir: 2, tidak: 1, belum: 0, attendeeCount: 4,  });
    expect(rows[2]).toMatchObject({ groupId: null, total: 2, belum: 2 });
  });
});
