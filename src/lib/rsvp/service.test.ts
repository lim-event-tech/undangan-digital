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

async function setup(options: { published?: boolean; maxAdults?: number; maxChildren?: number } = {}) {
  const seeded = await seedInvitation(db, { title: "Raka" });
  const events = await listEventDetails(db, seeded.invitation.id);
  const created = await createGuest(db, seeded.invitation.id, {
    name: "Bapak Hendra & Istri",
    phone: "+6281200000001",
    groupName: "Keluarga",
    eventIds: events.map((e) => e.id),
    maxAdults: options.maxAdults ?? 2,
    maxChildren: options.maxChildren ?? 1,
  });
  if (options.published ?? true) {
    await db.update(invitation).set({ status: "terbit" }).where(eq(invitation.id, seeded.invitation.id));
  }
  return { ...seeded, events, guest: created };
}

const hadir = (adults = "2", children = "0", note = ""): RawAnswer => ({
  attending: "ya",
  adults,
  children,
  note,
});
const tidak = (note = ""): RawAnswer => ({ attending: "tidak", adults: "", children: "", note });

function submit(
  ctx: Awaited<ReturnType<typeof setup>>,
  answers: Record<string, RawAnswer>,
  extra: { now?: Date; token?: string; slug?: string } = {},
) {
  return submitRsvp(db, {
    slug: extra.slug ?? ctx.invitation.slug,
    token: extra.token ?? ctx.guest.token,
    read: (eventId) => answers[eventId] ?? { attending: null, adults: "", children: "", note: "" },
    now: extra.now,
  });
}

describe("findGuestPage", () => {
  it("memuat sapaan nama tamu, acara yang diundang, dan foto", async () => {
    const ctx = await setup();
    await saveContentText(db, ctx.invitation.id, { sambutan: "Selamat datang" });
    await addPhoto(db, ctx.invitation.id, { kind: "cover", fileName: "cover.jpg", bytes: jpeg() });

    const page = await findGuestPage(db, ctx.invitation.slug, ctx.guest.token);
    expect(page).not.toBeNull();
    expect(page!.guest).toMatchObject({ name: "Bapak Hendra & Istri", maxAdults: 2, maxChildren: 1 });
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
      maxAdults: 1,
      maxChildren: 0,
    });
    const page = await findGuestPage(db, seeded.invitation.slug, created.token);
    expect(page!.events.map((e) => e.name)).toEqual(["Acara utama"]);
  });

  it("mengembalikan null untuk token salah, slug salah, atau token milik undangan lain", async () => {
    const first = await setup();
    const second = await setup();
    expect(await findGuestPage(db, first.invitation.slug, "TokenSalahTokenSa")).toBeNull();
    expect(await findGuestPage(db, "slug-tidak-ada", first.guest.token)).toBeNull();
    expect(await findGuestPage(db, first.invitation.slug, second.guest.token)).toBeNull();
    expect(await findGuestPage(db, second.invitation.slug, first.guest.token)).toBeNull();
  });

  it("mengisi jawaban sebelumnya per acara", async () => {
    const ctx = await setup();
    const [utama, lanjutan] = ctx.events;
    await submit(ctx, { [utama.id]: hadir("2", "1", "Datang bersama cucu"), [lanjutan.id]: tidak() });

    const page = await findGuestPage(db, ctx.invitation.slug, ctx.guest.token);
    expect(page!.events[0].response).toEqual({
      attending: true,
      adults: 2,
      children: 1,
      note: "Datang bersama cucu",
    });
    expect(page!.events[1].response).toEqual({ attending: false, adults: 0, children: 0, note: "" });
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
      adults: 2,
      children: 1,
      note: "Mohon kursi dekat pintu",
    });
    expect(byEvent.get(lanjutan.id)).toMatchObject({
      attending: false,
      adults: 0,
      children: 0,
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
    expect(rows.find((r) => r.eventId === utama.id)).toMatchObject({ attending: true, adults: 1 });
    expect(rows.find((r) => r.eventId === lanjutan.id)).toMatchObject({ attending: true, adults: 2, children: 1 });
  });

  it("menolak jumlah di atas batas tamu dan menyebut acara yang bermasalah", async () => {
    const ctx = await setup({ maxAdults: 2, maxChildren: 1 });
    const [utama, lanjutan] = ctx.events;
    const result = await submit(ctx, { [utama.id]: hadir("3", "0"), [lanjutan.id]: hadir("2", "2") });

    expect(result).toEqual({
      ok: false,
      error: "tidak-valid",
      errors: {
        [utama.id]: "Jumlah dewasa harus 1 sampai 2.",
        [lanjutan.id]: "Jumlah anak maksimal 1.",
      },
    });
    expect(await db.select().from(rsvp).where(eq(rsvp.guestId, ctx.guest.id))).toEqual([]);
  });

  it("menolak hadir dengan nol dewasa, angka bukan bilangan, dan anak saat batas anak nol", async () => {
    const ctx = await setup({ maxAdults: 2, maxChildren: 0 });
    const [utama, lanjutan] = ctx.events;
    const result = await submit(ctx, { [utama.id]: hadir("0", "0"), [lanjutan.id]: hadir("1", "1") });
    expect(result.ok).toBe(false);
    if (!result.ok && result.error === "tidak-valid") {
      expect(result.errors[utama.id]).toBe("Jumlah dewasa harus 1 sampai 2.");
      expect(result.errors[lanjutan.id]).toBe("Undangan ini tidak mencakup anak.");
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
      maxAdults: 2,
      maxChildren: 0,
    });

    const result = await submitRsvp(db, {
      slug: seeded.invitation.slug,
      token: created.token,
      read: () => hadir("2", "0"),
    });
    expect(result).toEqual({ ok: true });
    const rows = await db.select().from(rsvp).where(eq(rsvp.guestId, created.id));
    expect(rows.map((r) => r.eventId)).toEqual([utama.id]);
    expect(rows.some((r) => r.eventId === lanjutan.id)).toBe(false);
  });

  it("menolak token atau slug yang salah dan undangan yang belum terbit atau ditangguhkan", async () => {
    const ctx = await setup();
    const [utama, lanjutan] = ctx.events;
    const answers = { [utama.id]: hadir(), [lanjutan.id]: hadir() };
    expect(await submit(ctx, answers, { token: "TokenSalahTokenSa" })).toEqual({ ok: false, error: "tidak-ditemukan" });
    expect(await submit(ctx, answers, { slug: "slug-lain" })).toEqual({ ok: false, error: "tidak-ditemukan" });

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
    await saveRsvpSettings(db, ctx.invitation.id, { deadline, maxAdults: 2, maxChildren: 1 });

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
      maxAdults: 2,
      maxChildren: 0,
    });
    const [utama, lanjutan] = ctx.events;
    await submit(ctx, { [utama.id]: hadir("2", "1", "Rahasia tamu pertama"), [lanjutan.id]: tidak() });

    const otherPage = await findGuestPage(db, ctx.invitation.slug, other.token);
    expect(otherPage!.events.every((e) => e.response === null)).toBe(true);
    await updateEvent(db, ctx.invitation.id, utama.id, {
      name: "Acara utama",
      date: "2026-12-20",
      time: "09:00",
      timezone: "WIB",
      venueName: null,
      address: null,
      mapsUrl: null,
    });
    const page = await findGuestPage(db, ctx.invitation.slug, ctx.guest.token);
    expect(page!.events[0]).toMatchObject({ date: "2026-12-20", time: "09:00" });
  });
});
