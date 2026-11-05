import { beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { invitation } from "@/db/schema";
import { listEventDetails } from "@/lib/events/service";
import { createGuest } from "@/lib/guests/service";
import { createTestDb, seedInvitation, type TestDb } from "@/test/db";
import { buildDashboard, getDashboard, type RawGuest, type RawLink, type RawResponse } from "./dashboard";
import { submitRsvp, type RawAnswer } from "./service";

let db: TestDb;

beforeAll(async () => {
  db = await createTestDb();
});

const events = [
  { id: "utama", name: "Acara utama" },
  { id: "lanjutan", name: "Sesi lanjutan" },
];

const guests: RawGuest[] = [
  { id: "g1", name: "Bapak Hendra", groupId: "keluarga", groupName: "Keluarga" },
  { id: "g2", name: "Ibu Sari", groupId: "keluarga", groupName: "Keluarga" },
  { id: "g3", name: "Dewi", groupId: "teman", groupName: "Teman" },
  { id: "g4", name: "Eko", groupId: null, groupName: null },
  { id: "g5", name: "Fajar", groupId: "teman", groupName: "Teman" },
];

const links: RawLink[] = [
  { guestId: "g1", eventId: "utama" },
  { guestId: "g1", eventId: "lanjutan" },
  { guestId: "g2", eventId: "utama" },
  { guestId: "g2", eventId: "lanjutan" },
  { guestId: "g3", eventId: "lanjutan" },
  { guestId: "g4", eventId: "utama" },
  { guestId: "g4", eventId: "lanjutan" },
  { guestId: "g5", eventId: "utama" },
  { guestId: "g5", eventId: "lanjutan" },
];

const at = new Date("2026-11-10T03:00:00.000Z");
const later = new Date("2026-11-12T03:00:00.000Z");

const responses: RawResponse[] = [
  { guestId: "g1", eventId: "utama", attending: true, attendeeCount: 3,  note: "Sampai jumpa", respondedAt: at },
  { guestId: "g1", eventId: "lanjutan", attending: true, attendeeCount: 3,  note: null, respondedAt: later },
  { guestId: "g2", eventId: "utama", attending: false, attendeeCount: 0,  note: null, respondedAt: at },
  { guestId: "g2", eventId: "lanjutan", attending: false, attendeeCount: 0,  note: null, respondedAt: at },
  { guestId: "g3", eventId: "lanjutan", attending: true, attendeeCount: 1,  note: null, respondedAt: at },
  { guestId: "g5", eventId: "utama", attending: false, attendeeCount: 0,  note: null, respondedAt: at },
];

describe("buildDashboard", () => {
  const data = buildDashboard(events, guests, links, responses);

  it("menghitung status tamu: hadir, tidak hadir, belum menjawab, dan jawaban sebagian", () => {
    const status = Object.fromEntries(data.guests.map((g) => [g.name, g.status]));
    expect(status).toEqual({
      "Bapak Hendra": "hadir",
      "Ibu Sari": "tidak",
      Dewi: "hadir",
      Eko: "belum",
      Fajar: "belum",
    });
  });

  it("merangkum total tamu serta orang hadir memakai jumlah terbanyak per tamu", () => {
    expect(data.totals).toEqual({
      invited: 5,
      attending: 2,
      notAttending: 1,
      pending: 2,
      attendeeCount: 4,
    });
  });

  it("merinci setiap acara dengan jumlah diundang, hadir, tidak hadir, belum, dan jumlah peserta", () => {
    expect(data.events).toEqual([
      { eventId: "utama", name: "Acara utama", invited: 4, attending: 1, notAttending: 2, pending: 1, attendeeCount: 3,  },
      { eventId: "lanjutan", name: "Sesi lanjutan", invited: 5, attending: 2, notAttending: 1, pending: 2, attendeeCount: 4,  },
    ]);
  });

  it("menyertakan jawaban per acara, pesan, dan waktu jawaban terbaru", () => {
    const hendra = data.guests.find((g) => g.id === "g1")!;
    expect(hendra.answers.map((a) => [a.eventName, a.attending, a.attendeeCount, a.note])).toEqual([
      ["Acara utama", true, 3, "Sampai jumpa"],
      ["Sesi lanjutan", true, 3, ""],
    ]);
    expect(hendra.attendeeCount).toBe(3);
    expect(hendra.respondedAt).toEqual(later);
    expect(data.guests.find((g) => g.id === "g4")!.respondedAt).toBeNull();
  });

  it("menyertakan waktu kirim, buka, dan pengingat serta data grafik yang tidak ikut tersaring", () => {
    const sentAt = new Date("2026-11-02T03:00:00.000Z");
    const openedAt = new Date("2026-11-03T03:00:00.000Z");
    const remindedAt = new Date("2026-11-08T03:00:00.000Z");
    const withTimes = guests.map((g) =>
      g.id === "g4" ? { ...g, phone: "+6281200000004", sentAt, openedAt, remindedAt } : g,
    );
    const result = buildDashboard(events, withTimes, links, responses, { status: "hadir" });
    expect(result.matched).toBe(2);
    expect(result.charts.funnel.map((s) => s.count)).toEqual([5, 1, 1, 4, 2]);
    expect(result.charts.groups.map((g) => g.name)).toEqual(["Keluarga", "Teman", "Tanpa grup"]);

    const all = buildDashboard(events, withTimes, links, responses);
    const eko = all.guests.find((g) => g.id === "g4")!;
    expect(eko).toMatchObject({ phone: "+6281200000004", sentAt, openedAt, remindedAt });
    expect(eko.invitedEventIds).toEqual(["utama", "lanjutan"]);
    expect(all.guests.find((g) => g.id === "g1")!.openedAt).toBeNull();
  });

  it("mengabaikan jawaban untuk acara yang tidak diundangkan", () => {
    const stray = buildDashboard(events, guests, links, [
      ...responses,
      { guestId: "g3", eventId: "utama", attending: true, attendeeCount: 10,  note: null, respondedAt: at },
    ]);
    expect(stray.guests.find((g) => g.id === "g3")!.attendeeCount).toBe(1);
    expect(stray.events[0].attendeeCount).toBe(3);
  });

  it("menyaring menurut status, grup, dan pencarian nama tanpa mengubah ringkasan", () => {
    expect(buildDashboard(events, guests, links, responses, { status: "belum" }).guests.map((g) => g.name)).toEqual([
      "Eko",
      "Fajar",
    ]);
    expect(buildDashboard(events, guests, links, responses, { groupId: "teman" }).guests.map((g) => g.name)).toEqual([
      "Dewi",
      "Fajar",
    ]);
    const searched = buildDashboard(events, guests, links, responses, { q: "  sARI " });
    expect(searched.guests.map((g) => g.name)).toEqual(["Ibu Sari"]);
    expect(searched.matched).toBe(1);
    expect(searched.totals).toEqual(data.totals);
  });

  it("menyaring per acara dengan status dihitung khusus untuk acara itu", () => {
    const akadBelum = buildDashboard(events, guests, links, responses, { eventId: "utama", status: "belum" });
    expect(akadBelum.guests.map((g) => g.name)).toEqual(["Eko"]);
    const resepsiHadir = buildDashboard(events, guests, links, responses, { eventId: "lanjutan", status: "hadir" });
    expect(resepsiHadir.guests.map((g) => g.name)).toEqual(["Bapak Hendra", "Dewi"]);
    const akadSemua = buildDashboard(events, guests, links, responses, { eventId: "utama" });
    expect(akadSemua.guests.map((g) => g.name)).toEqual(["Bapak Hendra", "Ibu Sari", "Eko", "Fajar"]);
  });

  it("aman untuk undangan tanpa tamu", () => {
    const empty = buildDashboard(events, [], [], []);
    expect(empty.totals).toEqual({ invited: 0, attending: 0, notAttending: 0, pending: 0, attendeeCount: 0,  });
    expect(empty.events.map((e) => e.invited)).toEqual([0, 0]);
  });
});

describe("getDashboard", () => {
  it("menghitung dari data nyata dan tidak mencampur undangan lain", async () => {
    const mine = await seedInvitation(db);
    const other = await seedInvitation(db);
    const myEvents = await listEventDetails(db, mine.invitation.id);
    const otherEvents = await listEventDetails(db, other.invitation.id);
    await db.update(invitation).set({ status: "terbit" }).where(eq(invitation.id, mine.invitation.id));
    await db.update(invitation).set({ status: "terbit" }).where(eq(invitation.id, other.invitation.id));

    const a = await createGuest(db, mine.invitation.id, {
      name: "Tamu A",
      phone: "+6281300000001",
      groupName: "Keluarga",
      eventIds: myEvents.map((e) => e.id),
      maxAttendees: 5,
    });
    await createGuest(db, mine.invitation.id, {
      name: "Tamu B",
      phone: "+6281300000002",
      groupName: null,
      eventIds: [myEvents[0].id],
      maxAttendees: 2,
    });
    const stranger = await createGuest(db, other.invitation.id, {
      name: "Orang Lain",
      phone: "+6281300000003",
      groupName: null,
      eventIds: otherEvents.map((e) => e.id),
      maxAttendees: 2,
    });

    const answers: Record<string, RawAnswer> = {
      [myEvents[0].id]: { attending: "ya", attendeeCount: "5",  note: "Siap hadir" },
      [myEvents[1].id]: { attending: "tidak", attendeeCount: "",  note: "" },
    };
    expect(
      await submitRsvp(db, {
        slug: mine.invitation.slug,
        token: a.token,
        read: (id) => answers[id],
      }),
    ).toEqual({ ok: true });
    await submitRsvp(db, {
      slug: other.invitation.slug,
      token: stranger.token,
      read: () => ({ attending: "ya", attendeeCount: "2",  note: "" }),
    });

    const data = await getDashboard(db, mine.invitation.id);
    expect(data.totals).toEqual({ invited: 2, attending: 1, notAttending: 0, pending: 1, attendeeCount: 5,  });
    expect(data.events.map((e) => [e.name, e.invited, e.attending, e.pending])).toEqual([
      ["Acara utama", 2, 1, 1],
      ["Sesi lanjutan", 1, 0, 0],
    ]);
    expect(data.events[1].notAttending).toBe(1);
    expect(data.guests.map((g) => g.name)).toEqual(["Tamu A", "Tamu B"]);
    expect(data.guests[0].answers[0].note).toBe("Siap hadir");
  });
});
