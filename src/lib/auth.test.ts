import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";
import { betterAuth } from "better-auth";
import { account, session, user } from "@/db/schema";
import { createTestDb, type TestDb } from "@/test/db";
import { authOptions } from "./auth-options";
import { forwardGoogleCallback } from "./google-callback";

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

describe("callback Google", () => {
  const origin = "https://3000.hantupenyiar.my.id";

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  function googleAuth() {
    vi.stubEnv("BETTER_AUTH_URL", origin);
    vi.stubEnv("GOOGLE_CLIENT_ID", "client-uji.apps.googleusercontent.com");
    vi.stubEnv("GOOGLE_CLIENT_SECRET", "secret-google-uji");
    return betterAuth({ ...authOptions(db), plugins: [], secret: "rahasia-uji-rahasia-uji-rahasia-uji-123" });
  }

  function signInRequest(callbackURL: string) {
    return new Request(`${origin}/api/auth/sign-in/social`, {
      method: "POST",
      headers: { "content-type": "application/json", origin },
      body: JSON.stringify({ provider: "google", callbackURL, requestSignUp: callbackURL === "/undangan", disableRedirect: true }),
    });
  }

  it.each(["/undangan", "/admin"])("mengirim callback kompatibel WordCLD dan PKCE untuk %s", async (callbackURL) => {
    const auth = googleAuth();
    const response = await auth.handler(signInRequest(callbackURL));
    expect(response.status).toBe(200);
    const body = await response.json();
    const url = new URL(body.url);
    expect(url.origin).toBe("https://accounts.google.com");
    expect(url.searchParams.get("redirect_uri")).toBe(`${origin}/api/auth/google/callback`);
    expect(url.searchParams.get("code_challenge_method")).toBe("S256");
    expect(url.searchParams.get("state")).toBeTruthy();
    expect(url.searchParams.get("code_challenge")).toBeTruthy();
  });

  it("tetap menolak callback yang tidak menyertakan state", async () => {
    const auth = googleAuth();
    const response = await auth.handler(forwardGoogleCallback(new Request(`${origin}/api/auth/google/callback?code=kode-uji`)));
    expect(response.status).toBe(302);
    expect(new URL(response.headers.get("location")!).searchParams.get("error")).toBe("state_not_found");
  });

  it("memakai URI yang sama saat menukar kode ke Google", async () => {
    const auth = googleAuth();
    const response = await auth.handler(signInRequest("/undangan"));
    const body = await response.json();
    const state = new URL(body.url).searchParams.get("state")!;
    const cookie = response.headers.getSetCookie().map((value) => value.split(";")[0]).join("; ");
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ error: "invalid_grant" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    }));
    vi.stubGlobal("fetch", fetchMock);
    await auth.handler(forwardGoogleCallback(new Request(`${origin}/api/auth/google/callback?code=kode-uji&state=${state}`, { headers: { cookie } })));
    expect(fetchMock).toHaveBeenCalled();
    const [endpoint, options] = fetchMock.mock.calls[0];
    expect(endpoint instanceof Request ? endpoint.url : String(endpoint)).toBe("https://oauth2.googleapis.com/token");
    const data = new URLSearchParams(String(options?.body));
    expect(data.get("redirect_uri")).toBe(`${origin}/api/auth/google/callback`);
    expect(data.get("code_verifier")).toBeTruthy();
  });
});

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
