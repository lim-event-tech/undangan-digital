import { beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { invitation, rsvp } from "@/db/schema";
import { listEventDetails, updateEvent } from "@/lib/events/service";
import { createGuest } from "@/lib/guests/service";
import { saveContentText, saveRsvpSettings } from "@/lib/invitations/editor";
import { addPhoto } from "@/lib/photos/service";
import { createTestDb, seedInvitation, type TestDb } from "@/test/db";
import { findGuestPage, submitRsvp, type RawAnswer } from "./service";

let db: TestDb;

beforeAll(async () => {
  db = await createTestDb();
});

function jpeg(): Buffer {
  const bytes = Buffer.alloc(64, 7);
  bytes[0] = 0xff;
  bytes[1] = 0xd8;
  bytes[2] = 0xff;
  return bytes;
}

async function setup(options: { published?: boolean; maxAttendees?: number } = {}) {
  const seeded = await seedInvitation(db, { title: "Raka" });
  const events = await listEventDetails(db, seeded.invitation.id);
  const created = await createGuest(db, seeded.invitation.id, {
    name: "Bapak Hendra & Istri",
    phone: "+6281200000001",
    groupName: "Keluarga",
    eventIds: events.map((e) => e.id),
    maxAttendees: options.maxAttendees ?? 3,
  });
  if (options.published ?? true) {
    await db.update(invitation).set({ status: "terbit" }).where(eq(invitation.id, seeded.invitation.id));
  }
  return { ...seeded, events, guest: created };
}

const hadir = (adults = "2", children = "0", note = ""): RawAnswer => ({
  attending: "ya",
  attendeeCount: String(Number(adults) + Number(children)),
  note,
});
const tidak = (note = ""): RawAnswer => ({ attending: "tidak", attendeeCount: "",  note });

function submit(
  ctx: Awaited<ReturnType<typeof setup>>,
  answers: Record<string, RawAnswer>,
  extra: { now?: Date; token?: string } = {},
) {
  return submitRsvp(db, {
    token: extra.token ?? ctx.guest.token,
    read: (eventId) => answers[eventId] ?? { attending: null, attendeeCount: "",  note: "" },
    now: extra.now,
  });
}

describe("findGuestPage", () => {
  it("memuat sapaan nama tamu, acara yang diundang, dan foto", async () => {
    const ctx = await setup();
    await saveContentText(db, ctx.invitation.id, { sambutan: "Selamat datang" });
    await addPhoto(db, ctx.invitation.id, { kind: "cover", fileName: "cover.jpg", bytes: jpeg() });

    const page = await findGuestPage(db, ctx.guest.token);
    expect(page).not.toBeNull();
    expect(page!.guest).toMatchObject({ name: "Bapak Hendra & Istri", maxAttendees: 3,  });
    expect(page!.invitation).toMatchObject({ slug: "raka", title: "Raka", status: "terbit" });
    expect(page!.invitation.content.sambutan).toBe("Selamat datang");
    expect(page!.events.map((e) => e.name)).toEqual(["Acara utama", "Sesi lanjutan"]);
    expect(page!.events.every((e) => e.response === null)).toBe(true);
    expect(page!.photos.map((p) => p.kind)).toEqual(["cover"]);
  });

  it("hanya menampilkan acara yang diundangkan untuk tamu itu", async () => {
    const seeded = await seedInvitation(db);
    const [utama] = await listEventDetails(db, seeded.invitation.id);
    const created = await createGuest(db, seeded.invitation.id, {
      name: "Ibu Sari",
      phone: "+6281200000002",
      groupName: null,
      eventIds: [utama.id],
      maxAttendees: 1,
    });
    const page = await findGuestPage(db, created.token);
    expect(page!.events.map((e) => e.name)).toEqual(["Acara utama"]);
  });

  it("mengembalikan null untuk token yang tidak dikenal dan halaman untuk token tamu", async () => {
    const first = await setup();
    expect(await findGuestPage(db, "TokenSalahTokenSa")).toBeNull();
    expect(await findGuestPage(db, "TokenSal")).toBeNull();
    expect((await findGuestPage(db, first.guest.token))?.invitation.id).toBe(first.invitation.id);
  });

  it("mengisi jawaban sebelumnya per acara", async () => {
    const ctx = await setup();
    const [utama, lanjutan] = ctx.events;
    await submit(ctx, { [utama.id]: hadir("2", "1", "Datang bersama cucu"), [lanjutan.id]: tidak() });

    const page = await findGuestPage(db, ctx.guest.token);
    expect(page!.events[0].response).toEqual({
      attending: true,
      attendeeCount: 3,
      note: "Datang bersama cucu",
      visits: [],
    });
    expect(page!.events[1].response).toEqual({ attending: false, attendeeCount: 0,  note: "", visits: [] });
  });
});

describe("submitRsvp", () => {
  it("menyimpan jawaban tiap acara dengan jumlah dewasa dan anak terpisah", async () => {
    const ctx = await setup();
    const [utama, lanjutan] = ctx.events;
    const result = await submit(ctx, {
      [utama.id]: hadir("2", "1", "  Mohon kursi dekat pintu  "),
      [lanjutan.id]: tidak("Berhalangan"),
    });
    expect(result).toEqual({ ok: true });

    const rows = await db.select().from(rsvp).where(eq(rsvp.guestId, ctx.guest.id));
    const byEvent = new Map(rows.map((r) => [r.eventId, r]));
    expect(byEvent.get(utama.id)).toMatchObject({
      attending: true,
      attendeeCount: 3,
      note: "Mohon kursi dekat pintu",
    });
    expect(byEvent.get(lanjutan.id)).toMatchObject({
      attending: false,
      attendeeCount: 0,
      note: "Berhalangan",
    });
  });

  it("memperbarui jawaban lama tanpa membuat baris ganda", async () => {
    const ctx = await setup();
    const [utama, lanjutan] = ctx.events;
    await submit(ctx, { [utama.id]: tidak(), [lanjutan.id]: tidak() });
    await submit(ctx, { [utama.id]: hadir("1", "0"), [lanjutan.id]: hadir("2", "1") });

    const rows = await db.select().from(rsvp).where(eq(rsvp.guestId, ctx.guest.id));
    expect(rows).toHaveLength(2);
    expect(rows.find((r) => r.eventId === utama.id)).toMatchObject({ attending: true, attendeeCount: 1 });
    expect(rows.find((r) => r.eventId === lanjutan.id)).toMatchObject({ attending: true, attendeeCount: 3,  });
  });

  it("menolak jumlah di atas batas tamu dan menyebut acara yang bermasalah", async () => {
    const ctx = await setup({ maxAttendees: 3,  });
    const [utama, lanjutan] = ctx.events;
    const result = await submit(ctx, { [utama.id]: hadir("4", "0"), [lanjutan.id]: hadir("2", "2") });

    expect(result).toEqual({
      ok: false,
      error: "tidak-valid",
      errors: {
        [utama.id]: "Jumlah peserta harus 1 sampai 3.",
        [lanjutan.id]: "Jumlah peserta harus 1 sampai 3.",
      },
    });
    expect(await db.select().from(rsvp).where(eq(rsvp.guestId, ctx.guest.id))).toEqual([]);
  });

  it("menolak hadir dengan nol peserta, jumlah melampaui kuota, dan angka bukan bilangan", async () => {
    const ctx = await setup({ maxAttendees: 2,  });
    const [utama, lanjutan] = ctx.events;
    const result = await submit(ctx, { [utama.id]: hadir("0", "0"), [lanjutan.id]: hadir("3", "0") });
    expect(result.ok).toBe(false);
    if (!result.ok && result.error === "tidak-valid") {
      expect(result.errors[utama.id]).toBe("Jumlah peserta harus 1 sampai 2.");
      expect(result.errors[lanjutan.id]).toBe("Jumlah peserta harus 1 sampai 2.");
    }
    const garbage = await submit(ctx, { [utama.id]: hadir("dua", "0"), [lanjutan.id]: hadir("-1", "0") });
    expect(garbage.ok).toBe(false);
  });

  it("wajib menjawab semua acara yang diundang", async () => {
    const ctx = await setup();
    const [utama, lanjutan] = ctx.events;
    const result = await submit(ctx, { [utama.id]: hadir() });
    expect(result).toEqual({
      ok: false,
      error: "tidak-valid",
      errors: { [lanjutan.id]: "Pilih hadir atau tidak hadir." },
    });
  });

  it("menolak pesan yang terlalu panjang", async () => {
    const ctx = await setup();
    const [utama, lanjutan] = ctx.events;
    const result = await submit(ctx, { [utama.id]: hadir("2", "0", "x".repeat(301)), [lanjutan.id]: tidak() });
    expect(result).toMatchObject({ ok: false, error: "tidak-valid" });
  });

  it("tidak mencatat jawaban untuk acara yang tidak diundangkan", async () => {
    const seeded = await seedInvitation(db);
    const [utama, lanjutan] = await listEventDetails(db, seeded.invitation.id);
    await db.update(invitation).set({ status: "terbit" }).where(eq(invitation.id, seeded.invitation.id));
    const created = await createGuest(db, seeded.invitation.id, {
      name: "Ibu Sari",
      phone: "+6281200000003",
      groupName: null,
      eventIds: [utama.id],
      maxAttendees: 2,
    });

    const result = await submitRsvp(db, {
      token: created.token,
      read: () => hadir("2", "0"),
    });
    expect(result).toEqual({ ok: true });
    const rows = await db.select().from(rsvp).where(eq(rsvp.guestId, created.id));
    expect(rows.map((r) => r.eventId)).toEqual([utama.id]);
    expect(rows.some((r) => r.eventId === lanjutan.id)).toBe(false);
  });

  it("menolak token yang salah dan undangan yang belum terbit atau ditangguhkan", async () => {
    const ctx = await setup();
    const [utama, lanjutan] = ctx.events;
    const answers = { [utama.id]: hadir(), [lanjutan.id]: hadir() };
    expect(await submit(ctx, answers, { token: "TokenSalahTokenSa" })).toEqual({ ok: false, error: "tidak-ditemukan" });

    await db.update(invitation).set({ status: "draf" }).where(eq(invitation.id, ctx.invitation.id));
    expect(await submit(ctx, answers)).toEqual({ ok: false, error: "belum-terbit" });
    await db.update(invitation).set({ status: "ditangguhkan" }).where(eq(invitation.id, ctx.invitation.id));
    expect(await submit(ctx, answers)).toEqual({ ok: false, error: "belum-terbit" });
    expect(await db.select().from(rsvp).where(eq(rsvp.guestId, ctx.guest.id))).toEqual([]);
  });

  it("menolak jawaban setelah batas waktu RSVP dan menerimanya tepat sebelum batas", async () => {
    const ctx = await setup();
    const [utama, lanjutan] = ctx.events;
    const answers = { [utama.id]: hadir(), [lanjutan.id]: hadir() };
    const deadline = new Date("2026-12-10T16:59:59.000Z");
    await saveRsvpSettings(db, ctx.invitation.id, { deadline, maxAttendees: 3,  });

    expect(await submit(ctx, answers, { now: new Date("2026-12-10T17:00:00.000Z") })).toEqual({
      ok: false,
      error: "ditutup",
    });
    expect(await submit(ctx, answers, { now: new Date("2026-12-10T16:59:00.000Z") })).toEqual({ ok: true });
  });

  it("menerima jawaban kapan saja bila tidak ada batas waktu", async () => {
    const ctx = await setup();
    const [utama, lanjutan] = ctx.events;
    const result = await submit(ctx, { [utama.id]: hadir(), [lanjutan.id]: tidak() }, {
      now: new Date("2099-01-01T00:00:00.000Z"),
    });
    expect(result).toEqual({ ok: true });
  });

  it("tidak membocorkan jawaban antar tamu dan memuat jadwal acara terbaru", async () => {
    const ctx = await setup();
    const other = await createGuest(db, ctx.invitation.id, {
      name: "Tamu Lain",
      phone: "+6281200000004",
      groupName: null,
      eventIds: ctx.events.map((e) => e.id),
      maxAttendees: 2,
    });
    const [utama, lanjutan] = ctx.events;
    await submit(ctx, { [utama.id]: hadir("2", "1", "Rahasia tamu pertama"), [lanjutan.id]: tidak() });

    const otherPage = await findGuestPage(db, other.token);
    expect(otherPage!.events.every((e) => e.response === null)).toBe(true);
    await updateEvent(db, ctx.invitation.id, utama.id, {
      name: "Acara utama",
      date: "2026-12-20",
      endTime: null, agenda: [], time: "09:00",
      timezone: "WIB",
      venueName: null,
      address: null,
      mapsUrl: null,
    });
    const page = await findGuestPage(db, ctx.guest.token);
    expect(page!.events[0]).toMatchObject({ date: "2026-12-20", endTime: null, agenda: [], time: "09:00" });
  });
});

describe("kehadiran per hari dan jam datang", () => {
  async function acaraTigaHari() {
    const ctx = await setup();
    const [utama, lanjutan] = ctx.events;
    await updateEvent(db, ctx.invitation.id, utama.id, {
      name: "Acara utama", date: "2026-12-20", endDate: "2026-12-22", time: "09:00", endTime: "11:00",
      dayTimes: [{ date: "2026-12-21", start: "13:00", end: "15:00" }], agenda: [], timezone: "WIB",
      venueName: null, address: null, mapsUrl: null,
    });
    return { ctx, utama, lanjutan };
  }
  const pilih = (days: string[], times: Record<string, string> = {}): RawAnswer => ({ ...hadir("1"), days, times });

  it("menyimpan hari yang dipilih dengan jam datang, memakai jam mulai hari itu bila kosong", async () => {
    const { ctx, utama, lanjutan } = await acaraTigaHari();
    const result = await submit(ctx, { [utama.id]: pilih(["2026-12-21", "2026-12-20"], { "2026-12-21": "14:00" }), [lanjutan.id]: tidak() });
    expect(result).toEqual({ ok: true });
    const page = await findGuestPage(db, ctx.guest.token);
    expect(page!.events[0].response?.visits).toEqual([
      { date: "2026-12-20", time: "09:00" },
      { date: "2026-12-21", time: "14:00" },
    ]);
    expect(page!.events[1].response?.visits).toEqual([]);
  });

  it("menolak acara beberapa hari tanpa hari terpilih, hari di luar rentang, dan jam di luar jendela", async () => {
    const { ctx, utama, lanjutan } = await acaraTigaHari();
    for (const answer of [pilih([]), pilih(["2026-12-23"]), pilih(["2026-12-21"], { "2026-12-21": "12:30" }), pilih(["2026-12-20"], { "2026-12-20": "11:30" }), pilih(["2026-12-20"], { "2026-12-20": "bukan-jam" })]) {
      const result = await submit(ctx, { [utama.id]: answer, [lanjutan.id]: tidak() });
      expect(result).toMatchObject({ ok: false, error: "tidak-valid", errors: { [utama.id]: expect.any(String) } });
    }
    expect(await db.select().from(rsvp).where(eq(rsvp.guestId, ctx.guest.id))).toHaveLength(0);
  });

  it("mengosongkan hari saat tamu berubah menjadi tidak hadir dan menggantinya saat dikirim ulang", async () => {
    const { ctx, utama, lanjutan } = await acaraTigaHari();
    await submit(ctx, { [utama.id]: pilih(["2026-12-20", "2026-12-22"]), [lanjutan.id]: tidak() });
    await submit(ctx, { [utama.id]: pilih(["2026-12-22"], { "2026-12-22": "10:30" }), [lanjutan.id]: tidak() });
    let page = await findGuestPage(db, ctx.guest.token);
    expect(page!.events[0].response?.visits).toEqual([{ date: "2026-12-22", time: "10:30" }]);
    await submit(ctx, { [utama.id]: tidak(), [lanjutan.id]: tidak() });
    page = await findGuestPage(db, ctx.guest.token);
    expect(page!.events[0].response).toMatchObject({ attending: false, visits: [] });
  });

  it("acara satu hari otomatis memakai harinya dan hanya memeriksa jam datang", async () => {
    const ctx = await setup();
    const [utama, lanjutan] = ctx.events;
    await updateEvent(db, ctx.invitation.id, utama.id, {
      name: "Acara utama", date: "2026-12-20", time: "09:00", endTime: "11:00", agenda: [], timezone: "WIB",
      venueName: null, address: null, mapsUrl: null,
    });
    expect(await submit(ctx, { [utama.id]: pilih(["2030-01-01"], { "2026-12-20": "10:00" }), [lanjutan.id]: tidak() })).toEqual({ ok: true });
    const page = await findGuestPage(db, ctx.guest.token);
    expect(page!.events[0].response?.visits).toEqual([{ date: "2026-12-20", time: "10:00" }]);
    expect(await submit(ctx, { [utama.id]: pilih([], { "2026-12-20": "12:00" }), [lanjutan.id]: tidak() })).toMatchObject({ ok: false, error: "tidak-valid" });
  });
});
