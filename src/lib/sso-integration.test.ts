import { createHmac } from "node:crypto";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { betterAuth } from "better-auth";
import { eq } from "drizzle-orm";
import { session, user } from "@/db/schema";
import { createTestDb, type TestDb } from "@/test/db";
import { authOptions } from "./auth-options";
import { lingkarideSso } from "./sso-plugin";
import { forwardSsoRequest, ssoResponse } from "./sso-route";

const origin = "https://undangan.example.com";
const secret = "shared-secret-lingkaride-untuk-pengujian";
let db: TestDb;

beforeAll(async () => {
  db = await createTestDb();
  await db.insert(user).values([
    { id: "admin-sso", name: "Admin Terdaftar", email: "admin@example.com", adminRole: "dukungan" },
    { id: "blok-sso", name: "Admin Blok", email: "blok@example.com", adminRole: "super", status: "diblokir" },
    { id: "pemilik-sso", name: "Pemilik", email: "pemilik@example.com" },
  ]);
});

afterEach(() => vi.unstubAllEnvs());

function makeAuth(rateLimit = false) {
  vi.stubEnv("BETTER_AUTH_URL", origin);
  vi.stubEnv("SSO_SHARED_SECRET", secret);
  vi.stubEnv("SSO_PARENT_DOMAIN", "lingkaride.com");
  return betterAuth({
    ...authOptions(db),
    baseURL: origin,
    secret: "secret-auth-untuk-pengujian-sso-123456",
    plugins: [lingkarideSso(db)],
    rateLimit: { enabled: rateLimit, storage: "memory" },
  });
}

function token(email: string, exp = Math.floor(Date.now() / 1000) + 60) {
  const input = [{ alg: "HS256", typ: "JWT" }, { email, name: "Nama dari LingkarIDE", exp, role: "super" }]
    .map((part) => Buffer.from(JSON.stringify(part)).toString("base64url")).join(".");
  return `${input}.${createHmac("sha256", secret).update(input).digest("base64url")}`;
}

function request(value: string | null, referer: string | null = "https://lingkaride.com/") {
  const url = new URL("/admin/sso", origin);
  if (value !== null) url.searchParams.set("token", value);
  const headers = new Headers();
  if (referer) headers.set("referer", referer);
  return forwardSsoRequest(new Request(url, { headers }));
}

describe("SSO admin LingkarIDE", () => {
  it("membuat sesi Better Auth dengan peran DB, cookie HTTPS, dan logout yang bekerja", async () => {
    const auth = makeAuth();
    const response = ssoResponse(await auth.handler(request(token("ADMIN@example.com"))));
    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe(`${origin}/admin`);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
    const cookies = response.headers.getSetCookie();
    expect(cookies.some((value) => value.includes("session_token=") && value.includes("HttpOnly") && value.includes("Secure"))).toBe(true);
    expect(cookies.some((value) => value.startsWith("ud_kelola=") && value.includes("Max-Age=0"))).toBe(true);
    const cookie = cookies.map((value) => value.split(";")[0]).join("; ");
    const current = await auth.api.getSession({ headers: new Headers({ cookie }) });
    expect(current?.user.id).toBe("admin-sso");
    expect(current?.user.adminRole).toBe("dukungan");
    expect(current?.user.name).toBe("Admin Terdaftar");
    expect(current?.user.emailVerified).toBe(false);
    await auth.api.signOut({ headers: new Headers({ cookie }) });
    expect(await auth.api.getSession({ headers: new Headers({ cookie }) })).toBeNull();
  });

  it.each([
    ["baru@example.com", "sso_not_registered"],
    ["pemilik@example.com", "sso_not_registered"],
    ["blok@example.com", "sso_inactive"],
  ])("menolak %s tanpa membuat sesi atau memberi peran baru", async (email, code) => {
    const auth = makeAuth();
    const before = await db.select().from(session);
    const response = await auth.handler(request(token(email)));
    expect(response.headers.get("location")).toBe(`${origin}/admin/masuk?galat=${code}`);
    expect(response.headers.getSetCookie()).toEqual([]);
    expect(await db.select().from(session)).toHaveLength(before.length);
    const [stored] = await db.select().from(user).where(eq(user.email, email));
    if (email.startsWith("baru")) expect(stored).toBeUndefined();
    if (email.startsWith("pemilik")) expect(stored.adminRole).toBeNull();
  });

  it("menolak token hilang, rusak, kedaluwarsa, dan referer asing", async () => {
    const auth = makeAuth();
    const attempts = [
      [request(null), "invalid"],
      [request("rusak"), "invalid"],
      [request(token("admin@example.com", Math.floor(Date.now() / 1000) - 1)), "expired"],
      [request(token("admin@example.com"), "https://asing.example/"), "origin"],
    ] as const;
    for (const [req, code] of attempts) {
      const response = await auth.handler(req);
      expect(response.headers.get("location")).toBe(`${origin}/admin/masuk?galat=sso_${code}`);
      expect(response.headers.get("referrer-policy")).toBe("no-referrer");
      expect(response.headers.getSetCookie()).toEqual([]);
    }
  });

  it("tetap menerima navigasi tanpa referer seperti WordCloud", async () => {
    const auth = makeAuth();
    expect((await auth.handler(request(token("admin@example.com"), null))).headers.get("location")).toBe(`${origin}/admin`);
  });

  it("mengembalikan pesan konfigurasi bila secret belum diisi", async () => {
    const auth = makeAuth();
    vi.stubEnv("SSO_SHARED_SECRET", "");
    const response = await auth.handler(request(token("admin@example.com")));
    expect(response.headers.get("location")).toBe(`${origin}/admin/masuk?galat=sso_unavailable`);
    expect(response.headers.getSetCookie()).toEqual([]);
  });

  it("mengabaikan host permintaan dan parameter tujuan dari luar", () => {
    vi.stubEnv("BETTER_AUTH_URL", origin);
    const forwarded = forwardSsoRequest(new Request("https://host-asing.example/admin/sso?token=abc&next=https://asing.example"));
    expect(new URL(forwarded.url).origin).toBe(origin);
    expect(new URL(forwarded.url).pathname).toBe("/api/auth/lingkaride/sso");
  });

  it("membatasi percobaan SSO dan mengarahkannya ke pesan yang bisa dibaca", async () => {
    const auth = makeAuth(true);
    let last: Response | undefined;
    for (let index = 0; index < 21; index++) {
      const req = request("rusak");
      req.headers.set("x-forwarded-for", "192.0.2.99");
      last = await auth.handler(req);
    }
    expect(last?.status).toBe(429);
    const result = ssoResponse(last!);
    expect(result.status).toBe(302);
    expect(result.headers.get("location")).toBe(`${origin}/admin/masuk?galat=sso_rate_limited`);
    expect(result.headers.get("cache-control")).toBe("no-store");
  });
});
