import { beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { guest } from "@/db/schema";
import { listEventDetails } from "@/lib/events/service";
import { createTestDb, seedInvitation, type TestDb } from "@/test/db";
import { createGuest } from "./service";
import { countSent, markSent, markUnsent } from "./sending";

let db: TestDb;

beforeAll(async () => {
  db = await createTestDb();
});

async function newGuest(invitationId: string, name: string, phone: string) {
  const events = await listEventDetails(db, invitationId);
  return createGuest(db, invitationId, {
    name,
    phone,
    groupName: null,
    eventIds: [events[0].id],
    maxAdults: 2,
    maxChildren: 0,
  });
}

async function sentAt(guestId: string) {
  const [row] = await db.select({ sentAt: guest.sentAt }).from(guest).where(eq(guest.id, guestId));
  return row.sentAt;
}

describe("markSent dan markUnsent", () => {
  it("menandai terkirim dan mempertahankan waktu kirim pertama saat dikirim lagi", async () => {
    const { invitation } = await seedInvitation(db);
    const g = await newGuest(invitation.id, "Tamu A", "+6281400000001");
    expect(await sentAt(g.id)).toBeNull();

    const first = new Date("2026-11-02T03:00:00.000Z");
    expect(await markSent(db, invitation.id, g.id, first)).toBe(true);
    expect((await sentAt(g.id))?.toISOString()).toBe(first.toISOString());

    await markSent(db, invitation.id, g.id, new Date("2026-11-05T03:00:00.000Z"));
    expect((await sentAt(g.id))?.toISOString()).toBe(first.toISOString());
  });

  it("menghapus penanda terkirim", async () => {
    const { invitation } = await seedInvitation(db);
    const g = await newGuest(invitation.id, "Tamu B", "+6281400000002");
    await markSent(db, invitation.id, g.id);
    expect(await markUnsent(db, invitation.id, g.id)).toBe(true);
    expect(await sentAt(g.id)).toBeNull();
  });

  it("tidak mengubah tamu milik undangan lain", async () => {
    const owner = await seedInvitation(db);
    const intruder = await seedInvitation(db);
    const g = await newGuest(owner.invitation.id, "Tamu C", "+6281400000003");

    expect(await markSent(db, intruder.invitation.id, g.id)).toBe(false);
    expect(await sentAt(g.id)).toBeNull();
    await markSent(db, owner.invitation.id, g.id);
    expect(await markUnsent(db, intruder.invitation.id, g.id)).toBe(false);
    expect(await sentAt(g.id)).not.toBeNull();
  });
});

describe("countSent", () => {
  it("menghitung tamu yang sudah dikirimi dari seluruh tamu", async () => {
    const { invitation } = await seedInvitation(db);
    const a = await newGuest(invitation.id, "Tamu D", "+6281400000004");
    await newGuest(invitation.id, "Tamu E", "+6281400000005");
    await newGuest(invitation.id, "Tamu F", "+6281400000006");
    await markSent(db, invitation.id, a.id);
    expect(await countSent(db, invitation.id)).toEqual({ total: 3, sent: 1 });
  });
});
