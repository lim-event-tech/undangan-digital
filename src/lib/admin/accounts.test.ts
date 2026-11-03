import { beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { account, session, user } from "@/db/schema";
import { createTestDb, seedInvitation, type TestDb } from "@/test/db";
import { setAccountPassword, updateAccountProfile } from "./accounts";
import { createAdmin } from "./team";

let db: TestDb;

beforeAll(async () => {
  db = await createTestDb();
});

describe("ubah akun pasangan oleh admin", () => {
  it("mengubah nama dan email dengan rapi dan melaporkan apa yang berubah", async () => {
    const seeded = await seedInvitation(db);
    const [before] = await db.select().from(user).where(eq(user.id, seeded.ownerId));

    expect(
      await updateAccountProfile(db, seeded.ownerId, { name: "  Raka   Pratama ", email: " Raka.P@Example.com " }),
    ).toEqual({ ok: true, changed: ["nama", "email"] });
    const [after] = await db.select().from(user).where(eq(user.id, seeded.ownerId));
    expect(after).toMatchObject({ name: "Raka Pratama", email: "raka.p@example.com" });
    expect(before.email).not.toBe(after.email);

    expect(await updateAccountProfile(db, seeded.ownerId, { name: "Raka Pratama", email: "raka.p@example.com" })).toEqual({
      ok: true,
      changed: [],
    });
  });

  it("menolak nama kosong, email rusak, email milik akun lain, dan akun yang tidak ada", async () => {
    const a = await seedInvitation(db);
    const b = await seedInvitation(db);
    const [bRow] = await db.select().from(user).where(eq(user.id, b.ownerId));
    const [aRow] = await db.select().from(user).where(eq(user.id, a.ownerId));

    expect(await updateAccountProfile(db, a.ownerId, { name: " ", email: aRow.email })).toEqual({
      ok: false,
      error: "nama",
    });
    expect(await updateAccountProfile(db, a.ownerId, { name: "A", email: "bukan-email" })).toEqual({
      ok: false,
      error: "email",
    });
    expect(await updateAccountProfile(db, a.ownerId, { name: "A", email: bRow.email.toUpperCase() })).toEqual({
      ok: false,
      error: "email-dipakai",
    });
    expect(await updateAccountProfile(db, "tidak-ada", { name: "A", email: "x@example.com" })).toEqual({
      ok: false,
      error: "tidak-ada",
    });
  });

  it("tidak mengubah akun admin lewat jalur akun pasangan", async () => {
    const admin = await createAdmin(db, {
      name: "Admin",
      email: "admin-akun@example.com",
      password: "kata-sandi-panjang",
      role: "lihat",
    });
    if (!admin.ok) throw new Error("gagal");
    expect(await updateAccountProfile(db, admin.id, { name: "Lain", email: "lain@example.com" })).toEqual({
      ok: false,
      error: "tidak-ada",
    });
    expect(await setAccountPassword(db, admin.id, "kata-sandi-baru")).toEqual({ ok: false, error: "tidak-ada" });
  });

  it("mengatur kata sandi baru, membuat akun kata sandi bila belum ada, dan mengeluarkan sesi", async () => {
    const seeded = await seedInvitation(db);
    await db.insert(session).values({
      id: `sesi-${seeded.ownerId}`,
      token: `token-${seeded.ownerId}`,
      userId: seeded.ownerId,
      expiresAt: new Date(Date.now() + 3_600_000),
    });

    expect(await setAccountPassword(db, seeded.ownerId, "pendek")).toMatchObject({ ok: false, error: "sandi" });
    expect(await setAccountPassword(db, seeded.ownerId, "x".repeat(129))).toMatchObject({ ok: false, error: "sandi" });

    expect(await setAccountPassword(db, seeded.ownerId, "kata-sandi-pertama")).toEqual({ ok: true, created: true });
    const [first] = await db.select().from(account).where(eq(account.userId, seeded.ownerId));
    expect(first.providerId).toBe("credential");
    expect(first.password).not.toContain("kata-sandi-pertama");
    expect(await db.select().from(session).where(eq(session.userId, seeded.ownerId))).toHaveLength(0);

    expect(await setAccountPassword(db, seeded.ownerId, "kata-sandi-kedua")).toEqual({ ok: true, created: false });
    const rows = await db.select().from(account).where(eq(account.userId, seeded.ownerId));
    expect(rows).toHaveLength(1);
    expect(rows[0].password).not.toBe(first.password);
  });
});
