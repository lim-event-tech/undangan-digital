import { beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { invitation } from "@/db/schema";
import { listEventDetails } from "@/lib/events/service";
import { createGuest } from "@/lib/guests/service";
import { markSent } from "@/lib/guests/sending";
import { checkCustomSlug } from "@/lib/slug";
import { createTestDb, seedInvitation, type TestDb } from "@/test/db";
import { changeSlug, isSlugLocked } from "./editor";

let db: TestDb;

beforeAll(async () => {
  db = await createTestDb();
});

async function slugOf(id: string) {
  const [row] = await db.select({ slug: invitation.slug }).from(invitation).where(eq(invitation.id, id));
  return row.slug;
}

async function addGuest(invitationId: string) {
  const events = await listEventDetails(db, invitationId);
  return createGuest(db, invitationId, {
    name: "Tamu",
    phone: "+6281300000001",
    groupName: null,
    eventIds: [events[0].id],
    maxAttendees: 2,
  });
}

describe("checkCustomSlug", () => {
  it("menerima nama link yang benar dan menyeragamkan huruf besar", () => {
    expect(checkCustomSlug("  Budi-dan-Ani ")).toEqual({ ok: true, slug: "budi-dan-ani" });
    expect(checkCustomSlug("b2b").ok).toBe(true);
  });

  it("menolak yang terlalu pendek, terlalu panjang, berspasi, bersimbol, atau dicadangkan", () => {
    for (const value of ["ab", "a".repeat(61), "budi ani", "budi_ani", "-budi", "budi-", "bu--di", "admin", "undangan", "é"]) {
      expect(checkCustomSlug(value).ok, value).toBe(false);
    }
  });
});

describe("changeSlug", () => {
  it("mengganti nama link selama belum ada tamu yang ditandai terkirim", async () => {
    const { invitation: created } = await seedInvitation(db);
    expect(await changeSlug(db, created.id, "budi-dan-ani")).toEqual({ ok: true, slug: "budi-dan-ani" });
    expect(await slugOf(created.id)).toBe("budi-dan-ani");
    expect(await changeSlug(db, created.id, "budi-dan-ani")).toEqual({ ok: true, slug: "budi-dan-ani" });
  });

  it("menolak nama link yang dipakai undangan lain", async () => {
    const first = await seedInvitation(db);
    const second = await seedInvitation(db);
    await changeSlug(db, first.invitation.id, "nama-favorit");
    expect(await changeSlug(db, second.invitation.id, "nama-favorit")).toEqual({
      ok: false,
      reason: "dipakai",
    });
    expect(await slugOf(second.invitation.id)).toBe(second.invitation.slug);
  });

  it("terkunci setelah ada tamu yang ditandai terkirim", async () => {
    const { invitation: created } = await seedInvitation(db);
    const guest = await addGuest(created.id);
    expect(await isSlugLocked(db, created.id)).toBe(false);

    await markSent(db, created.id, guest.id);
    expect(await isSlugLocked(db, created.id)).toBe(true);
    expect(await changeSlug(db, created.id, "terlambat")).toEqual({ ok: false, reason: "terkunci" });
    expect(await slugOf(created.id)).toBe(created.slug);
  });

  it("melaporkan undangan yang tidak ada", async () => {
    expect(await changeSlug(db, "00000000-0000-4000-8000-000000000000", "tidak-ada")).toEqual({
      ok: false,
      reason: "tidak-ada",
    });
  });
});
