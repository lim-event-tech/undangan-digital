import { beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { betterAuth } from "better-auth";
import { account, user } from "@/db/schema";
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

async function rejection(promise: Promise<unknown>) {
  try {
    await promise;
  } catch (error) {
    return error as { body?: { code?: string } };
  }
  throw new Error("seharusnya ditolak");
}

describe("daftar dan masuk dengan email dan kata sandi", () => {
  it("langsung masuk setelah daftar tanpa verifikasi email dan tanpa mengirim email", async () => {
    const auth = makeAuth();
    const result = await auth.api.signUpEmail({
      body: { name: "Nadia", email: "nadia@example.com", password: "kata-sandi-aman-1" },
    });

    expect(result.token).toBeTruthy();
    const [stored] = await db.select().from(user).where(eq(user.email, "nadia@example.com"));
    expect(stored.status).toBe("aktif");
    expect(stored.emailVerified).toBe(false);
    const accounts = await db.select().from(account).where(eq(account.userId, stored.id));
    expect(accounts.map((a) => a.providerId)).toEqual(["credential"]);
  });

  it("bisa masuk lagi dengan kata sandi yang benar, dengan huruf besar-kecil email bebas", async () => {
    const auth = makeAuth();
    await auth.api.signUpEmail({
      body: { name: "Raka", email: "Raka.Pratama@Example.com", password: "kata-sandi-aman-1" },
    });
    const signedIn = await auth.api.signInEmail({
      body: { email: "raka.pratama@example.com", password: "kata-sandi-aman-1" },
    });
    expect(signedIn.token).toBeTruthy();
    expect(signedIn.user.email).toBe("raka.pratama@example.com");
  });

  it("menolak kata sandi salah dan email yang belum terdaftar dengan pesan yang sama", async () => {
    const auth = makeAuth();
    await auth.api.signUpEmail({
      body: { name: "Sinta", email: "sinta@example.com", password: "kata-sandi-aman-1" },
    });
    const wrong = await rejection(
      auth.api.signInEmail({ body: { email: "sinta@example.com", password: "bukan-kata-sandinya" } }),
    );
    const unknown = await rejection(
      auth.api.signInEmail({ body: { email: "tidak-ada@example.com", password: "kata-sandi-aman-1" } }),
    );
    expect(wrong.body?.code).toBe("INVALID_EMAIL_OR_PASSWORD");
    expect(unknown.body?.code).toBe("INVALID_EMAIL_OR_PASSWORD");
  });

  it("menolak kata sandi yang terlalu pendek dan tidak membuat akun", async () => {
    const auth = makeAuth();
    const error = await rejection(
      auth.api.signUpEmail({
        body: { name: "Pendek", email: "pendek@example.com", password: "pendek" },
      }),
    );
    expect(error.body?.code).toBe("PASSWORD_TOO_SHORT");
    expect(await db.select().from(user).where(eq(user.email, "pendek@example.com"))).toEqual([]);
  });

  it("menolak email yang sudah terdaftar dan tidak membuat akun ganda", async () => {
    const auth = makeAuth();
    await auth.api.signUpEmail({
      body: { name: "Asli", email: "ganda@example.com", password: "kata-sandi-aman-1" },
    });
    const error = await rejection(
      auth.api.signUpEmail({
        body: { name: "Penyusup", email: "ganda@example.com", password: "kata-sandi-lain-22" },
      }),
    );
    expect(error.body?.code).toMatch(/^USER_ALREADY_EXISTS/);
    const rows = await db.select().from(user).where(eq(user.email, "ganda@example.com"));
    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe("Asli");
  });
});
