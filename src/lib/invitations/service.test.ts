import { beforeAll, describe, expect, it } from "vitest";
import { asc, eq } from "drizzle-orm";
import { event, invitation } from "@/db/schema";
import { createTestDb, seedInvitation, type TestDb } from "@/test/db";
import { createInvitation, getOwnedInvitation, listInvitationsForOwner, setInvitationTemplate } from "./service";

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
    expect(created.defaultMaxAttendees).toBe(1);

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

describe("beberapa undangan per pemilik", () => {
  it("mendaftar semua undangan milik akun dengan urutan stabil dan tanpa data akun lain", async () => {
    const { ownerId, invitation: first } = await seedInvitation(db);
    const second = await createInvitation(db, ownerId, { title: "Workshop Bersama", templateKey: "keraton" });
    const third = await createInvitation(db, ownerId, { title: "Gathering Anggota" });
    const other = await seedInvitation(db);
    const sama = new Date("2026-10-01T00:00:00Z");
    await db.update(invitation).set({ createdAt: sama }).where(eq(invitation.ownerId, ownerId));
    await db.update(invitation).set({ createdAt: new Date("2026-10-02T00:00:00Z") }).where(eq(invitation.id, third.id));
    const rows = await listInvitationsForOwner(db, ownerId);
    expect(rows.map((row) => row.id)).toEqual([third.id, ...[first.id, second.id].sort().reverse()]);
    expect(rows.find((row) => row.id === second.id)).toMatchObject({ title: "Workshop Bersama", templateKey: "keraton", status: "draf" });
    expect(rows).not.toEqual(expect.arrayContaining([expect.objectContaining({ id: other.invitation.id })]));
    expect(rows[0]).not.toHaveProperty("content");
    expect(rows[0]).not.toHaveProperty("checkinKey");
    expect(await listInvitationsForOwner(db, "akun-tanpa-undangan")).toEqual([]);
  });

  it("mengambil ID yang diminta walaupun pemilik mempunyai undangan lebih baru", async () => {
    const { ownerId, invitation: first } = await seedInvitation(db);
    const second = await createInvitation(db, ownerId, { title: "Undangan Kedua" });
    expect((await getOwnedInvitation(db, ownerId, first.id))?.id).toBe(first.id);
    expect((await getOwnedInvitation(db, ownerId, second.id))?.id).toBe(second.id);
    expect((await getOwnedInvitation(db, ownerId, first.id.toUpperCase()))?.id).toBe(first.id);
  });

  it("menolak pemilik lain dan ID yang hilang atau tidak valid tanpa memilih undangan cadangan", async () => {
    const first = await seedInvitation(db);
    const second = await seedInvitation(db);
    expect(await getOwnedInvitation(db, first.ownerId, second.invitation.id)).toBeNull();
    expect(await getOwnedInvitation(db, second.ownerId, first.invitation.id)).toBeNull();
    for (const id of [undefined, null, "", "terbaru", "../isi", [], {}, "00000000-0000-4000-8000-000000000000"]) {
      expect(await getOwnedInvitation(db, first.ownerId, id)).toBeNull();
    }
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
