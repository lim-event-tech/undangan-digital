import { beforeAll, describe, expect, it } from "vitest";
import { listEventDetails } from "@/lib/events/service";
import { createTestDb, seedInvitation, type TestDb } from "@/test/db";
import { createGuest, firstGuestToken } from "./service";

let db: TestDb;

beforeAll(async () => {
  db = await createTestDb();
});

describe("firstGuestToken", () => {
  it("null bila undangan belum punya tamu", async () => {
    const { invitation } = await seedInvitation(db);
    expect(await firstGuestToken(db, invitation.id)).toBeNull();
  });

  it("mengembalikan token tamu yang paling awal dibuat dan tidak mengambil dari undangan lain", async () => {
    const mine = await seedInvitation(db);
    const other = await seedInvitation(db);
    const myEvents = await listEventDetails(db, mine.invitation.id);
    const otherEvents = await listEventDetails(db, other.invitation.id);

    const first = await createGuest(db, mine.invitation.id, {
      name: "Tamu Pertama",
      phone: "+6281500000001",
      groupName: null,
      eventIds: [myEvents[0].id],
      maxAdults: 2,
      maxChildren: 0,
    });
    await createGuest(db, mine.invitation.id, {
      name: "Tamu Kedua",
      phone: "+6281500000002",
      groupName: null,
      eventIds: [myEvents[0].id],
      maxAdults: 2,
      maxChildren: 0,
    });
    await createGuest(db, other.invitation.id, {
      name: "Tamu Orang Lain",
      phone: "+6281500000003",
      groupName: null,
      eventIds: [otherEvents[0].id],
      maxAdults: 2,
      maxChildren: 0,
    });

    expect(await firstGuestToken(db, mine.invitation.id)).toBe(first.token);
  });
});
