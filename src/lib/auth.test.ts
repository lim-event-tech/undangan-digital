import { beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { betterAuth } from "better-auth";
import { account, session, user } from "@/db/schema";
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

describe("skema Better Auth", () => {
  it("cocok dengan tabel buatan sendiri: daftar, masuk, sesi, dan status bawaan aktif", async () => {
    const auth = makeAuth();
    const signedUp = await auth.api.signUpEmail({
      body: { name: "Davy", email: "davy@example.com", password: "kata-sandi-uji-123" },
    });
    expect(signedUp.user.email).toBe("davy@example.com");

    const [stored] = await db.select().from(user).where(eq(user.email, "davy@example.com"));
    expect(stored.status).toBe("aktif");
    expect(stored.emailVerified).toBe(false);

    const accounts = await db.select().from(account).where(eq(account.userId, stored.id));
    expect(accounts.map((a) => a.providerId)).toEqual(["credential"]);

    const signedIn = await auth.api.signInEmail({
      body: { email: "davy@example.com", password: "kata-sandi-uji-123" },
    });
    expect(signedIn.token).toBeTruthy();

    const sessions = await db.select().from(session).where(eq(session.userId, stored.id));
    expect(sessions.length).toBeGreaterThanOrEqual(1);
  });

  it("tidak mengizinkan klien menentukan status sendiri saat mendaftar", async () => {
    const auth = makeAuth();
    await auth.api
      .signUpEmail({
        body: {
          name: "Nakal",
          email: "nakal@example.com",
          password: "kata-sandi-uji-123",
          status: "diblokir",
        } as never,
      })
      .catch(() => undefined);
    const rows = await db.select().from(user).where(eq(user.email, "nakal@example.com"));
    for (const row of rows) expect(row.status).toBe("aktif");
  });

  it("mengembalikan status pengguna pada sesi agar akun diblokir bisa ditolak", async () => {
    const auth = makeAuth();
    await auth.api.signUpEmail({
      body: { name: "Blok", email: "blok@example.com", password: "kata-sandi-uji-123" },
    });
    await db.update(user).set({ status: "diblokir" }).where(eq(user.email, "blok@example.com"));
    const signedIn = await auth.api.signInEmail({
      body: { email: "blok@example.com", password: "kata-sandi-uji-123" },
      returnHeaders: true,
    });
    const cookie = signedIn.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ");
    const current = await auth.api.getSession({ headers: new Headers({ cookie }) });
    expect(current?.user.status).toBe("diblokir");
  });
});
