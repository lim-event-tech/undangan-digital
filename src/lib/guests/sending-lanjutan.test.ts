import { beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { guest } from "@/db/schema";
import { listEventDetails } from "@/lib/events/service";
import { createTestDb, seedInvitation, type TestDb } from "@/test/db";
import { createGuest } from "./service";
import { isLinkCrawler, markOpened, markReminded, markSent } from "./sending";

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

describe("markOpened", () => {
  async function openedAt(guestId: string) {
    const [row] = await db
      .select({ openedAt: guest.firstOpenedAt })
      .from(guest)
      .where(eq(guest.id, guestId));
    return row.openedAt;
  }

  it("mencatat waktu pertama dibuka dan tidak menimpanya", async () => {
    const { invitation } = await seedInvitation(db);
    const g = await newGuest(invitation.id, "Tamu G", "+6281400000007");
    expect(await openedAt(g.id)).toBeNull();

    const first = new Date("2026-11-03T05:00:00.000Z");
    expect(await markOpened(db, g.id, first)).toBe(true);
    expect((await openedAt(g.id))?.toISOString()).toBe(first.toISOString());

    expect(await markOpened(db, g.id, new Date("2026-11-04T05:00:00.000Z"))).toBe(false);
    expect((await openedAt(g.id))?.toISOString()).toBe(first.toISOString());
  });
});

describe("markReminded", () => {
  it("mencatat pengingat terakhir tanpa mengubah penanda terkirim", async () => {
    const { invitation } = await seedInvitation(db);
    const g = await newGuest(invitation.id, "Tamu H", "+6281400000008");
    const sent = new Date("2026-11-02T03:00:00.000Z");
    await markSent(db, invitation.id, g.id, sent);

    const first = new Date("2026-11-08T03:00:00.000Z");
    const second = new Date("2026-11-09T03:00:00.000Z");
    expect(await markReminded(db, invitation.id, g.id, first)).toBe(true);
    expect(await markReminded(db, invitation.id, g.id, second)).toBe(true);

    const [row] = await db
      .select({ sentAt: guest.sentAt, remindedAt: guest.lastRemindedAt })
      .from(guest)
      .where(eq(guest.id, g.id));
    expect(row.sentAt?.toISOString()).toBe(sent.toISOString());
    expect(row.remindedAt?.toISOString()).toBe(second.toISOString());
  });

  it("menolak tamu milik undangan lain", async () => {
    const owner = await seedInvitation(db);
    const intruder = await seedInvitation(db);
    const g = await newGuest(owner.invitation.id, "Tamu I", "+6281400000009");
    expect(await markReminded(db, intruder.invitation.id, g.id)).toBe(false);
  });
});

describe("isLinkCrawler", () => {
  it("mengenali crawler pratinjau link dan permintaan tanpa user agent", () => {
    expect(isLinkCrawler(null)).toBe(true);
    expect(isLinkCrawler("")).toBe(true);
    expect(isLinkCrawler("WhatsApp/2.23.20.0 A")).toBe(true);
    expect(
      isLinkCrawler("facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)"),
    ).toBe(true);
    expect(
      isLinkCrawler("Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"),
    ).toBe(true);
    expect(isLinkCrawler("TelegramBot (like TwitterBot)")).toBe(true);
  });

  it("tidak menganggap browser biasa sebagai crawler", () => {
    expect(
      isLinkCrawler(
        "Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36",
      ),
    ).toBe(false);
    expect(
      isLinkCrawler(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
      ),
    ).toBe(false);
  });
});
