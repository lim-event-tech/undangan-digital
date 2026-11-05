import { beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { invitation, rsvp, wish } from "@/db/schema";
import { listEventDetails } from "@/lib/events/service";
import { createGuest } from "@/lib/guests/service";
import { saveContentText } from "@/lib/invitations/editor";
import { createTestDb, seedInvitation, type TestDb } from "@/test/db";
import {
  countWishesByStatus,
  deleteWish,
  listAllPublicWishes,
  listPublicWishes,
  listWishes,
  setWishStatus,
  submitWish,
} from "./service";
import { WISH_MAX_LENGTH, WISH_MAX_PER_GUEST } from "./shared";

let db: TestDb;

beforeAll(async () => {
  db = await createTestDb();
});

async function setup(options: { published?: boolean; guests?: number } = {}) {
  const seeded = await seedInvitation(db);
  await saveContentText(db, seeded.invitation.id, { ucapan: { tampil: true, tahan: false } });
  const events = await listEventDetails(db, seeded.invitation.id);
  const guests = [];
  for (let i = 0; i < (options.guests ?? 1); i += 1) {
    guests.push(
      await createGuest(db, seeded.invitation.id, {
        name: `Tamu ${i + 1}`,
        phone: `+62812000001${String(i).padStart(2, "0")}`,
        groupName: null,
        eventIds: [events[0].id],
        maxAttendees: 2,
      }),
    );
  }
  if (options.published ?? true) {
    await db.update(invitation).set({ status: "terbit" }).where(eq(invitation.id, seeded.invitation.id));
  }
  return { ...seeded, guests };
}

function send(ctx: Awaited<ReturnType<typeof setup>>, message: string, guestIndex = 0) {
  return submitWish(db, {
    slug: ctx.invitation.slug,
    token: ctx.guests[guestIndex].token,
    message,
  });
}

describe("submitWish", () => {
  it("menyimpan ucapan atas nama tamu dan langsung tampil", async () => {
    const ctx = await setup();
    expect(await send(ctx, "  Selamat menempuh hidup baru!  ")).toEqual({ ok: true, status: "tampil" });

    const [row] = await listWishes(db, ctx.invitation.id);
    expect(row).toMatchObject({
      authorName: "Tamu 1",
      message: "Selamat menempuh hidup baru!",
      status: "tampil",
    });
  });

  it("menahan ucapan baru bila pasangan mengaktifkan persetujuan", async () => {
    const ctx = await setup();
    await saveContentText(db, ctx.invitation.id, { ucapan: { tampil: true, tahan: true } });
    expect(await send(ctx, "Semoga bahagia")).toEqual({ ok: true, status: "ditahan" });
    expect((await listPublicWishes(db, ctx.invitation.id)).total).toBe(0);
  });

  it("menolak saat ucapan dimatikan", async () => {
    const ctx = await setup();
    await saveContentText(db, ctx.invitation.id, { ucapan: { tampil: false, tahan: false } });
    expect(await send(ctx, "Halo")).toEqual({ ok: false, error: "dimatikan" });
    expect(await listWishes(db, ctx.invitation.id)).toHaveLength(0);
  });

  it("menolak ucapan kosong atau melebihi batas panjang", async () => {
    const ctx = await setup();
    expect(await send(ctx, "   \n ")).toEqual({ ok: false, error: "kosong" });
    expect(await send(ctx, "a".repeat(WISH_MAX_LENGTH + 1))).toEqual({
      ok: false,
      error: "terlalu-panjang",
    });
    expect(await send(ctx, "a".repeat(WISH_MAX_LENGTH))).toMatchObject({ ok: true });
  });

  it("membatasi jumlah ucapan per tamu", async () => {
    const ctx = await setup({ guests: 2 });
    for (let i = 0; i < WISH_MAX_PER_GUEST; i += 1) {
      expect(await send(ctx, `Ucapan ${i}`)).toMatchObject({ ok: true });
    }
    expect(await send(ctx, "Satu lagi")).toEqual({ ok: false, error: "batas" });
    expect(await send(ctx, "Dari tamu lain", 1)).toMatchObject({ ok: true });
  });

  it("menolak token atau slug salah dan undangan yang belum terbit", async () => {
    const ctx = await setup();
    expect(
      await submitWish(db, { slug: ctx.invitation.slug, token: "TokenSalah123456", message: "Halo" }),
    ).toEqual({ ok: false, error: "tidak-ditemukan" });
    expect(
      await submitWish(db, { slug: "slug-lain", token: ctx.guests[0].token, message: "Halo" }),
    ).toEqual({ ok: false, error: "tidak-ditemukan" });

    const draft = await setup({ published: false });
    expect(await send(draft, "Halo")).toEqual({ ok: false, error: "belum-terbit" });
  });
});

describe("listPublicWishes", () => {
  it("menampilkan 4 ucapan per halaman, terbaru lebih dulu, hanya yang berstatus tampil", async () => {
    const ctx = await setup({ guests: 4 });
    for (let i = 0; i < 10; i += 1) {
      await db.insert(wish).values({
        invitationId: ctx.invitation.id,
        guestId: ctx.guests[i % 4].id,
        authorName: `Tamu ${i}`,
        message: `Ucapan ${i}`,
        status: i === 3 ? "disembunyikan" : i === 5 ? "ditahan" : "tampil",
        createdAt: new Date(Date.UTC(2026, 10, 10, 0, i)),
      });
    }

    const first = await listPublicWishes(db, ctx.invitation.id, 1);
    expect(first).toMatchObject({ page: 1, totalPages: 2, total: 8 });
    expect(first.items.map((w) => w.message)).toEqual(["Ucapan 9", "Ucapan 8", "Ucapan 7", "Ucapan 6"]);

    const second = await listPublicWishes(db, ctx.invitation.id, 2);
    expect(second.items.map((w) => w.message)).toEqual(["Ucapan 4", "Ucapan 2", "Ucapan 1", "Ucapan 0"]);

    const beyond = await listPublicWishes(db, ctx.invitation.id, 99);
    expect(beyond.page).toBe(2);
    const invalid = await listPublicWishes(db, ctx.invitation.id, Number.NaN);
    expect(invalid.page).toBe(1);
  });

  it("memberi halaman kosong bila belum ada ucapan", async () => {
    const ctx = await setup();
    expect(await listPublicWishes(db, ctx.invitation.id)).toEqual({
      items: [],
      page: 1,
      totalPages: 1,
      total: 0,
    });
  });
});

describe("moderasi", () => {
  it("mengubah status, menghitung per status, dan menyaring daftar", async () => {
    const ctx = await setup({ guests: 2 });
    await send(ctx, "Pertama", 0);
    await send(ctx, "Kedua", 1);
    const [newest, oldest] = await listWishes(db, ctx.invitation.id);

    expect(await setWishStatus(db, ctx.invitation.id, newest.id, "disembunyikan")).toBe(true);
    expect(await setWishStatus(db, ctx.invitation.id, oldest.id, "ditahan")).toBe(true);
    expect(await countWishesByStatus(db, ctx.invitation.id)).toEqual({
      tampil: 0,
      ditahan: 1,
      disembunyikan: 1,
    });
    expect((await listWishes(db, ctx.invitation.id, "ditahan")).map((w) => w.id)).toEqual([oldest.id]);
    expect((await listPublicWishes(db, ctx.invitation.id)).total).toBe(0);

    await setWishStatus(db, ctx.invitation.id, oldest.id, "tampil");
    expect((await listPublicWishes(db, ctx.invitation.id)).total).toBe(1);
  });

  it("tidak bisa mengubah atau menghapus ucapan undangan lain", async () => {
    const owner = await setup();
    const intruder = await setup();
    await send(owner, "Rahasia");
    const [row] = await listWishes(db, owner.invitation.id);

    expect(await setWishStatus(db, intruder.invitation.id, row.id, "disembunyikan")).toBe(false);
    expect(await deleteWish(db, intruder.invitation.id, row.id)).toBe(false);
    expect((await listWishes(db, owner.invitation.id))[0].status).toBe("tampil");

    expect(await deleteWish(db, owner.invitation.id, row.id)).toBe(true);
    expect(await listWishes(db, owner.invitation.id)).toHaveLength(0);
  });

  it("ucapan tetap ada saat tamunya dihapus dan ikut terhapus bersama undangan", async () => {
    const ctx = await setup();
    await send(ctx, "Tetap tersimpan");
    await db.delete(invitation).where(eq(invitation.id, ctx.invitation.id));
    const rows = await db.select().from(wish).where(eq(wish.invitationId, ctx.invitation.id));
    expect(rows).toHaveLength(0);
  });
});

describe("status kehadiran penulis ucapan", () => {
  it("menandai hadir, tidak hadir, atau belum menjawab dari RSVP penulis", async () => {
    const ctx = await setup({ guests: 3 });
    const [acara] = await listEventDetails(db, ctx.invitation.id);
    await db.insert(rsvp).values([
      { guestId: ctx.guests[0].id, eventId: acara.id, attending: true, attendeeCount: 1,  },
      { guestId: ctx.guests[1].id, eventId: acara.id, attending: false, attendeeCount: 0,  },
    ]);
    await send(ctx, "Dari tamu satu", 0);
    await send(ctx, "Dari tamu dua", 1);
    await send(ctx, "Dari tamu tiga", 2);

    const halaman = await listPublicWishes(db, ctx.invitation.id);
    const status = Object.fromEntries(halaman.items.map((w) => [w.message, w.authorStatus]));
    expect(status).toEqual({
      "Dari tamu satu": "hadir",
      "Dari tamu dua": "tidak",
      "Dari tamu tiga": "belum",
    });

    const semua = await listAllPublicWishes(db, ctx.invitation.id, 2);
    expect(semua).toHaveLength(2);
    expect(semua[0].message).toBe("Dari tamu tiga");
  });
});
