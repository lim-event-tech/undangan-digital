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
  it("merapikan judul dan menolak judul kosong atau terlalu panjang sebelum membuat data", async () => {
    const { ownerId } = await seedInvitation(db);
    const created = await createInvitation(db, ownerId, { title: "  Seminar   Internal  " });
    expect(created).toMatchObject({ title: "Seminar Internal", slug: "seminar-internal" });
    const count = (await db.select().from(invitation)).length;
    for (const title of ["", " \n ", "a".repeat(121)]) {
      await expect(createInvitation(db, ownerId, { title })).rejects.toThrow(/Judul event/);
    }
    expect(await db.select().from(invitation)).toHaveLength(count);
  });
  it("membuat undangan draf dengan slug dari judul event dan satu acara bawaan", async () => {
    const { invitation: created } = await seedInvitation(db, { title: "Seminar Kreatif", extraEvent: false });
    expect(created.slug).toBe("seminar-kreatif");
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
      { key: "utama", name: "Acara utama", sortOrder: 0 },
    ]);
  });

  it("menjamin slug unik saat judul sama dipakai undangan lain", async () => {
    const first = await seedInvitation(db, { title: "Raka" });
    const second = await seedInvitation(db, { title: "Raka" });
    const third = await seedInvitation(db, { title: "Raka" });
    expect([first, second, third].map((r) => r.invitation.slug)).toEqual([
      "raka",
      "raka-2",
      "raka-3",
    ]);
  });

  it("tetap mendapat slug unik walau nama kembar sudah banyak", async () => {
    const slugs: string[] = [];
    for (let i = 0; i < 13; i++) {
      const { invitation } = await seedInvitation(db, { title: "Sama" });
      slugs.push(invitation.slug);
    }
    expect(new Set(slugs).size).toBe(13);
    expect(slugs[0]).toBe("sama");
    expect(slugs[9]).toBe("sama-10");
    expect(slugs[12]).toMatch(/^sama-[0-9a-f]{6}$/);
  });

  it("tidak meninggalkan undangan setengah jadi bila pemilik tidak ada", async () => {
    await expect(
      createInvitation(db, "pemilik-tidak-ada", { title: "Gagal", }),
    ).rejects.toThrow();
    const rows = await db.select().from(invitation).where(eq(invitation.slug, "gagal"));
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
      title: "Bima",
      templateKey: "keraton",
    });
    expect(other.templateKey).toBe("keraton");

    expect(await setInvitationTemplate(db, other.id, "pasundan")).toBe(true);
    const [row] = await db.select().from(invitation).where(eq(invitation.id, other.id));
    expect(row.templateKey).toBe("pasundan");
    expect(row.title).toBe("Bima");
    expect(row.content).toEqual(other.content);

    expect(await setInvitationTemplate(db, "00000000-0000-4000-8000-000000000000", "melati")).toBe(false);
  });
});
