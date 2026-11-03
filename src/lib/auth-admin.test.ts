import { beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { betterAuth } from "better-auth";
import { user } from "@/db/schema";
import { createAdmin } from "@/lib/admin/team";
import { saveSettings } from "@/lib/platform/service";
import { createTestDb, type TestDb } from "@/test/db";
import { authOptions } from "./auth-options";

let db: TestDb;

beforeAll(async () => {
  db = await createTestDb();
});

function makeAuth() {
  return betterAuth({
    ...authOptions(db),
    plugins: [],
    secret: "rahasia-uji-rahasia-uji-rahasia-uji-123",
    baseURL: "http://localhost:3000",
  });
}

describe("akun admin dan Better Auth", () => {
  it("admin buatan sendiri bisa masuk dengan email dan kata sandinya, dan peran ikut di sesi", async () => {
    const created = await createAdmin(db, {
      name: "Admin Uji",
      email: "admin.uji@example.com",
      password: "kata-sandi-admin-panjang",
      role: "dukungan",
    });
    expect(created.ok).toBe(true);

    const auth = makeAuth();
    const signedIn = await auth.api.signInEmail({
      body: { email: "admin.uji@example.com", password: "kata-sandi-admin-panjang" },
    });
    expect(signedIn.token).toBeTruthy();
    expect((signedIn.user as { adminRole?: string }).adminRole).toBe("dukungan");

    await expect(
      auth.api.signInEmail({ body: { email: "admin.uji@example.com", password: "salah-salah-salah" } }),
    ).rejects.toThrow();
  });

  it("klien tidak bisa memberi dirinya peran admin saat mendaftar", async () => {
    const auth = makeAuth();
    await auth.api
      .signUpEmail({
        body: {
          name: "Nakal",
          email: "nakal.admin@example.com",
          password: "kata-sandi-uji-123",
          adminRole: "super",
        } as never,
      })
      .catch(() => undefined);
    const rows = await db.select().from(user).where(eq(user.email, "nakal.admin@example.com"));
    for (const row of rows) expect(row.adminRole).toBeNull();
  });

  it("menolak pendaftaran baru saat pendaftaran ditutup tetapi akun lama tetap bisa masuk", async () => {
    const auth = makeAuth();
    await auth.api.signUpEmail({
      body: { name: "Lama", email: "lama@example.com", password: "kata-sandi-uji-123" },
    });

    await saveSettings(db, { daftarTerbuka: false });
    await expect(
      auth.api.signUpEmail({
        body: { name: "Baru", email: "baru@example.com", password: "kata-sandi-uji-123" },
      }),
    ).rejects.toThrow();
    expect(await db.select().from(user).where(eq(user.email, "baru@example.com"))).toHaveLength(0);

    const signedIn = await auth.api.signInEmail({
      body: { email: "lama@example.com", password: "kata-sandi-uji-123" },
    });
    expect(signedIn.token).toBeTruthy();

    await saveSettings(db, { daftarTerbuka: true });
    await auth.api.signUpEmail({
      body: { name: "Baru", email: "baru@example.com", password: "kata-sandi-uji-123" },
    });
    expect(await db.select().from(user).where(eq(user.email, "baru@example.com"))).toHaveLength(1);
  });
});
