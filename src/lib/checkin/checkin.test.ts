import { beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { invitation } from "@/db/schema";
import { listEventDetails } from "@/lib/events/service";
import { createGuest } from "@/lib/guests/service";
import { submitRsvp } from "@/lib/rsvp/service";
import { createTestDb, seedInvitation, type TestDb } from "@/test/db";
import { checkinCode, looksLikeCheckinKey, parseCheckinCode } from "./code";
import { qrSvg } from "./qr";
import {
  checkinCounts,
  findInvitationByKey,
  forceCheckIn,
  getOrCreateCheckinKey,
  listCheckinGuests,
  markCheckedIn,
  regenerateCheckinKey,
  scanCheckin,
  undoCheckIn,
} from "./service";

let db: TestDb;

beforeAll(async () => {
  db = await createTestDb();
});

async function setup() {
  const seeded = await seedInvitation(db, { groom: "Raka", bride: "Nadia" });
  await db.update(invitation).set({ status: "terbit" }).where(eq(invitation.id, seeded.invitation.id));
  const events = await listEventDetails(db, seeded.invitation.id);
  const make = (name: string, phone: string) =>
    createGuest(db, seeded.invitation.id, {
      name,
      phone,
      groupName: null,
      eventIds: events.map((e) => e.id),
      maxAdults: 3,
      maxChildren: 2,
    });
  const hadir = await make("Bapak Hendra", "+6282000000001");
  const tidak = await make("Ibu Sari", "+6282000000002");
  const belum = await make("Dewi", "+6282000000003");

  const answer = (token: string, attending: "ya" | "tidak", adults = "2", children = "1") =>
    submitRsvp(db, {
      slug: seeded.invitation.slug,
      token,
      read: () => ({ attending, adults, children, note: "" }),
    });
  await answer(hadir.token, "ya");
  await answer(tidak.token, "tidak");
  return { ...seeded, hadir, tidak, belum };
}

describe("kode check-in", () => {
  it("membuat dan membaca kode dengan bentuk yang ketat", () => {
    const token = "AbCdEfGhIjKlMnOp";
    const code = checkinCode("raka-dan-nadia", token);
    expect(code).toBe(`UD1.raka-dan-nadia.${token}`);
    expect(parseCheckinCode(` ${code}\n`)).toEqual({ slug: "raka-dan-nadia", token });
  });

  it("menolak kode rusak", () => {
    for (const value of ["", "abc", "UD2.raka.AbCdEfGhIjKlMnOp", "UD1.RAKA.AbCdEfGhIjKlMnOp", "UD1.raka.pendek", "UD1.raka.AbCdEfGhIjKlMnOp.x"]) {
      expect(parseCheckinCode(value), value).toBeNull();
    }
  });

  it("mengenali kunci petugas 20 karakter", () => {
    expect(looksLikeCheckinKey("a".repeat(20))).toBe(true);
    expect(looksLikeCheckinKey("a".repeat(19))).toBe(false);
    expect(looksLikeCheckinKey("a b".padEnd(20, "x"))).toBe(false);
  });

  it("menggambar QR sebagai SVG", async () => {
    const svg = await qrSvg(checkinCode("raka-dan-nadia", "AbCdEfGhIjKlMnOp"));
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg).toContain("</svg>");
  });
});

describe("kunci petugas", () => {
  it("dibuat sekali, stabil, dan bisa diganti sehingga kunci lama mati", async () => {
    const ctx = await setup();
    const first = await getOrCreateCheckinKey(db, ctx.invitation.id);
    expect(first).not.toBeNull();
    expect(looksLikeCheckinKey(first)).toBe(true);
    expect(await getOrCreateCheckinKey(db, ctx.invitation.id)).toBe(first);
    expect((await findInvitationByKey(db, ctx.invitation.slug, first!))?.id).toBe(ctx.invitation.id);

    const next = await regenerateCheckinKey(db, ctx.invitation.id);
    expect(next).not.toBe(first);
    expect(await findInvitationByKey(db, ctx.invitation.slug, first!)).toBeNull();
    expect(await findInvitationByKey(db, "slug-lain", next!)).toBeNull();
    expect(await getOrCreateCheckinKey(db, "00000000-0000-4000-8000-000000000000")).toBeNull();
  });
});

describe("pemindaian", () => {
  it("memasukkan tamu yang hadir dan menandai pemindaian kedua sebagai sudah masuk", async () => {
    const ctx = await setup();
    const code = checkinCode(ctx.invitation.slug, ctx.hadir.token);
    const first = await scanCheckin(db, ctx.invitation, code, new Date("2026-12-12T01:00:00.000Z"));
    expect(first.result).toBe("masuk");
    if (first.result === "masuk") {
      expect(first.guest).toMatchObject({ name: "Bapak Hendra", adults: 2, children: 1 });
    }

    const second = await scanCheckin(db, ctx.invitation, code, new Date("2026-12-12T02:00:00.000Z"));
    expect(second.result).toBe("sudah-masuk");
    if (second.result === "sudah-masuk") {
      expect(second.guest.checkedInAt?.toISOString()).toBe("2026-12-12T01:00:00.000Z");
    }
  });

  it("menolak QR dari undangan lain, kode rusak, dan tamu tak dikenal", async () => {
    const ctx = await setup();
    const other = await setup();
    expect((await scanCheckin(db, ctx.invitation, checkinCode(other.invitation.slug, other.hadir.token))).result).toBe(
      "undangan-lain",
    );
    expect((await scanCheckin(db, ctx.invitation, "bukan-kode")).result).toBe("kode-tidak-valid");
    expect(
      (await scanCheckin(db, ctx.invitation, checkinCode(ctx.invitation.slug, "TokenTakDikenal1"))).result,
    ).toBe("tidak-dikenal");
    expect(
      (await scanCheckin(db, ctx.invitation, checkinCode(ctx.invitation.slug, other.hadir.token))).result,
    ).toBe("tidak-dikenal");
  });

  it("tidak memasukkan tamu yang menolak atau belum menjawab tanpa konfirmasi petugas", async () => {
    const ctx = await setup();
    const refused = await scanCheckin(db, ctx.invitation, checkinCode(ctx.invitation.slug, ctx.tidak.token));
    expect(refused.result).toBe("belum-konfirmasi");
    const pending = await scanCheckin(db, ctx.invitation, checkinCode(ctx.invitation.slug, ctx.belum.token));
    expect(pending.result).toBe("belum-konfirmasi");
    expect((await checkinCounts(db, ctx.invitation.id)).inside).toBe(0);

    const forced = await forceCheckIn(db, ctx.invitation.id, ctx.belum.id);
    expect(forced.result).toBe("masuk");
    expect((await forceCheckIn(db, ctx.invitation.id, ctx.belum.id)).result).toBe("sudah-masuk");
    expect((await forceCheckIn(db, ctx.invitation.id, "00000000-0000-4000-8000-000000000000")).result).toBe(
      "tidak-dikenal",
    );
  });

  it("tamu undangan lain tidak bisa dimasukkan lewat id", async () => {
    const ctx = await setup();
    const other = await setup();
    expect(await markCheckedIn(db, ctx.invitation.id, other.hadir.id)).toBe("tidak-ada");
    expect(await undoCheckIn(db, ctx.invitation.id, other.hadir.id)).toBe(false);
  });
});

describe("daftar dan hitungan", () => {
  it("mendahulukan yang hadir, bisa dicari, dan bisa membatalkan check-in", async () => {
    const ctx = await setup();
    await markCheckedIn(db, ctx.invitation.id, ctx.hadir.id);

    const all = await listCheckinGuests(db, ctx.invitation.id);
    expect(all.map((g) => g.name)).toEqual(["Bapak Hendra", "Dewi", "Ibu Sari"]);
    expect(all[0]).toMatchObject({ attending: true, adults: 2, children: 1 });
    expect(all[0].checkedInAt).not.toBeNull();
    expect((await listCheckinGuests(db, ctx.invitation.id, { onlyAttending: true })).map((g) => g.name)).toEqual([
      "Bapak Hendra",
    ]);
    expect((await listCheckinGuests(db, ctx.invitation.id, { q: "sari" })).map((g) => g.name)).toEqual(["Ibu Sari"]);
    expect((await listCheckinGuests(db, ctx.invitation.id, { q: "100%" })).length).toBe(0);

    expect(await checkinCounts(db, ctx.invitation.id)).toEqual({
      confirmed: 1,
      inside: 1,
      insidePeople: 3,
      other: 0,
    });
    expect(await undoCheckIn(db, ctx.invitation.id, ctx.hadir.id)).toBe(true);
    expect((await checkinCounts(db, ctx.invitation.id)).inside).toBe(0);
  });
});
