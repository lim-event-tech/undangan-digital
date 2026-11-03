import { beforeAll, describe, expect, it } from "vitest";
import { asc, eq } from "drizzle-orm";
import { event, invitation } from "@/db/schema";
import { createTestDb, seedInvitation, type TestDb } from "@/test/db";
import { createInvitation, getInvitationForOwner, setInvitationTemplate } from "./service";

let db: TestDb;

beforeAll(async () => {
  db = await createTestDb();
});

describe("createInvitation", () => {
  it("membuat undangan draf dengan slug dari nama mempelai dan dua acara bawaan", async () => {
    const { invitation: created } = await seedInvitation(db, { groom: "Ardi", bride: "Sinta" });
    expect(created.slug).toBe("ardi-dan-sinta");
    expect(created.status).toBe("draf");
    expect(created.templateKey).toBe("melati");
    expect(created.defaultMaxAdults).toBe(2);
    expect(created.defaultMaxChildren).toBe(0);

    const events = await db
      .select({ key: event.key, name: event.name, sortOrder: event.sortOrder })
      .from(event)
      .where(eq(event.invitationId, created.id))
      .orderBy(asc(event.sortOrder));
    expect(events).toEqual([
      { key: "akad", name: "Akad Nikah", sortOrder: 0 },
      { key: "resepsi", name: "Resepsi", sortOrder: 1 },
    ]);
  });

  it("menjamin slug unik saat nama sama dipakai pasangan lain", async () => {
    const first = await seedInvitation(db, { groom: "Raka", bride: "Nadia" });
    const second = await seedInvitation(db, { groom: "Raka", bride: "Nadia" });
    const third = await seedInvitation(db, { groom: "Raka", bride: "Nadia" });
    expect([first, second, third].map((r) => r.invitation.slug)).toEqual([
      "raka-dan-nadia",
      "raka-dan-nadia-2",
      "raka-dan-nadia-3",
    ]);
  });

  it("tetap mendapat slug unik walau nama kembar sudah banyak", async () => {
    const slugs: string[] = [];
    for (let i = 0; i < 13; i++) {
      const { invitation } = await seedInvitation(db, { groom: "Sama", bride: "Persis" });
      slugs.push(invitation.slug);
    }
    expect(new Set(slugs).size).toBe(13);
    expect(slugs[0]).toBe("sama-dan-persis");
    expect(slugs[9]).toBe("sama-dan-persis-10");
    expect(slugs[12]).toMatch(/^sama-dan-persis-[0-9a-f]{6}$/);
  });

  it("tidak meninggalkan undangan setengah jadi bila pemilik tidak ada", async () => {
    await expect(
      createInvitation(db, "pemilik-tidak-ada", { groomName: "Gagal", brideName: "Total" }),
    ).rejects.toThrow();
    const rows = await db.select().from(invitation).where(eq(invitation.slug, "gagal-dan-total"));
    expect(rows).toEqual([]);
  });
});

describe("getInvitationForOwner", () => {
  it("mengembalikan undangan terbaru milik pemilik dan null untuk pemilik lain", async () => {
    const { ownerId, invitation: created } = await seedInvitation(db);
    const found = await getInvitationForOwner(db, ownerId);
    expect(found?.id).toBe(created.id);
    expect(await getInvitationForOwner(db, "tidak-ada")).toBeNull();
  });
});

describe("template undangan", () => {
  it("membuat undangan dengan template pilihan lalu menggantinya tanpa mengubah isi", async () => {
    const { ownerId } = await seedInvitation(db);
    const other = await createInvitation(db, ownerId, {
      groomName: "Bima",
      brideName: "Sekar",
      templateKey: "keraton",
    });
    expect(other.templateKey).toBe("keraton");

    expect(await setInvitationTemplate(db, other.id, "pasundan")).toBe(true);
    const [row] = await db.select().from(invitation).where(eq(invitation.id, other.id));
    expect(row.templateKey).toBe("pasundan");
    expect(row.groomName).toBe("Bima");
    expect(row.content).toEqual(other.content);

    expect(await setInvitationTemplate(db, "00000000-0000-4000-8000-000000000000", "melati")).toBe(false);
  });
});
