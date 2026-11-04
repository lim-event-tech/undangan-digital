import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { betterAuth } from "better-auth";
import { and, eq } from "drizzle-orm";
import { account, session, user } from "@/db/schema";
import { authOptions } from "@/lib/auth-options";
import { forwardGoogleCallback } from "@/lib/google-callback";
import { createTestDb, type TestDb } from "@/test/db";
import { changeOwnEmail, getAccountMethods } from "./service";

let db: TestDb;
let counter = 0;
const origin = "http://localhost:3000";
const password = "kata-sandi-aman-123";

beforeAll(async () => { db = await createTestDb(); });
afterEach(() => { vi.unstubAllGlobals(); });

function makeAuth(googleEmail = "google@example.com", subject = "google-uji", verified = true) {
  const options = authOptions(db);
  return betterAuth({
    ...options,
    plugins: [],
    secret: "rahasia-uji-rahasia-uji-rahasia-uji-123",
    baseURL: origin,
    socialProviders: {
      google: {
        ...options.socialProviders.google,
        clientId: "client-uji.apps.googleusercontent.com",
        clientSecret: "secret-uji",
        getUserInfo: async () => ({
          user: { name: "Google Uji", email: googleEmail, emailVerified: verified },
          data: {
            sub: subject, name: "Google Uji", given_name: "Google", family_name: "Uji", picture: "",
            email: googleEmail, email_verified: verified, aud: "client-uji.apps.googleusercontent.com",
            azp: "client-uji.apps.googleusercontent.com", iss: "https://accounts.google.com",
            iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 3600,
          },
        }),
      },
    },
  });
}

function cookies(headers: Headers) {
  return headers.getSetCookie().map((value) => value.split(";")[0]).join("; ");
}

async function registered() {
  counter += 1;
  const auth = makeAuth();
  const email = `pengaturan-${counter}@example.com`;
  const signed = await auth.api.signUpEmail({ body: { name: "Pengguna", email, password }, returnHeaders: true });
  const headers = new Headers({ cookie: cookies(signed.headers) });
  const current = (await auth.api.getSession({ headers }))!;
  return { auth, headers, email, current, identity: { userId: current.user.id, sessionId: current.session.id } };
}

function emailForm(email: string, currentPassword = password) {
  const form = new FormData();
  form.set("email", email);
  form.set("password", currentPassword);
  return form;
}

async function oauth(auth: ReturnType<typeof makeAuth>, headers?: Headers, link = true) {
  const response = await auth.handler(new Request(`${origin}/api/auth/${link ? "link-social" : "sign-in/social"}`, {
    method: "POST",
    headers: { "content-type": "application/json", origin, cookie: headers?.get("cookie") ?? "" },
    body: JSON.stringify({ provider: "google", callbackURL: "/undangan/akun?google=terhubung", errorCallbackURL: "/undangan/akun?google=gagal", disableRedirect: true }),
  }));
  expect(response.status).toBe(200);
  const url = new URL((await response.json()).url);
  expect(url.searchParams.get("code_challenge")).toBeTruthy();
  vi.stubGlobal("fetch", vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ access_token: "akses-uji", token_type: "Bearer", expires_in: 3600 }), { headers: { "content-type": "application/json" } })));
  return auth.handler(forwardGoogleCallback(new Request(`${origin}/api/auth/google/callback?code=kode-uji&state=${url.searchParams.get("state")}`, {
    headers: { cookie: [headers?.get("cookie"), cookies(response.headers)].filter(Boolean).join("; ") },
  })));
}

describe("pengaturan email pengguna", () => {
  it("meminta kata sandi saat ini dan mempertahankan email jika salah", async () => {
    const data = await registered();
    expect(await changeOwnEmail(db, data.identity, emailForm("baru@example.com", "salah"))).toEqual({ ok: false, errors: { password: "Kata sandi saat ini salah." } });
    expect((await data.auth.api.getSession({ headers: data.headers }))?.user.email).toBe(data.email);
  });

  it("menormalkan email, membuang status verifikasi lama, dan mengakhiri sesi lain", async () => {
    const data = await registered();
    await db.update(user).set({ emailVerified: true }).where(eq(user.id, data.identity.userId));
    await data.auth.api.signInEmail({ body: { email: data.email, password } });
    expect(await changeOwnEmail(db, data.identity, emailForm("  Email.Baru@Example.com  "))).toEqual({ ok: true });
    const updated = (await data.auth.api.getSession({ headers: data.headers }))!;
    expect(updated.user).toMatchObject({ email: "email.baru@example.com", emailVerified: false });
    expect(await db.select().from(session).where(eq(session.userId, data.identity.userId))).toHaveLength(1);
    expect((await data.auth.api.signInEmail({ body: { email: "email.baru@example.com", password } })).user.id).toBe(data.identity.userId);
    await expect(data.auth.api.signInEmail({ body: { email: data.email, password } })).rejects.toThrow();
  });

  it("menolak email milik pengguna lain, email sama, dan format salah", async () => {
    const first = await registered();
    const other = await registered();
    for (const email of [other.email, first.email, "bukan-email"]) {
      expect(await changeOwnEmail(db, first.identity, emailForm(email))).toMatchObject({ ok: false, errors: { email: expect.any(String) } });
    }
    expect((await first.auth.api.getSession({ headers: first.headers }))?.user.email).toBe(first.email);
  });

  it("menolak sesi milik pengguna lain dan sesi yang sudah dicabut", async () => {
    const first = await registered();
    const other = await registered();
    expect(await changeOwnEmail(db, { ...first.identity, sessionId: other.identity.sessionId }, emailForm("curang@example.com"))).toMatchObject({ ok: false });
    await db.delete(session).where(eq(session.id, first.identity.sessionId));
    expect(await changeOwnEmail(db, first.identity, emailForm("curang@example.com"))).toMatchObject({ ok: false });
  });

  it.each(["diblokir", "admin"])("menolak perubahan akun %s meskipun sesi masih ada", async (kind) => {
    const data = await registered();
    await db.update(user).set(kind === "admin" ? { adminRole: "super" } : { status: "diblokir" }).where(eq(user.id, data.identity.userId));
    expect(await changeOwnEmail(db, data.identity, emailForm(`${kind}@example.com`))).toMatchObject({ ok: false });
  });
});

describe("kata sandi dan koneksi Google", () => {
  it("mengubah kata sandi melalui Better Auth, menolak sandi lama, dan mencabut sesi lain", async () => {
    const data = await registered();
    await data.auth.api.signInEmail({ body: { email: data.email, password } });
    await expect(data.auth.api.changePassword({ headers: data.headers, body: { currentPassword: "salah", newPassword: "sandi-baru-aman-123", revokeOtherSessions: true } })).rejects.toThrow();
    const changed = await data.auth.api.changePassword({ headers: data.headers, body: { currentPassword: password, newPassword: "sandi-baru-aman-123", revokeOtherSessions: true }, returnHeaders: true });
    expect(await data.auth.api.getSession({ headers: data.headers })).toBeNull();
    expect(await data.auth.api.getSession({ headers: new Headers({ cookie: cookies(changed.headers) }) })).toBeTruthy();
    expect(await db.select().from(session).where(eq(session.userId, data.identity.userId))).toHaveLength(1);
    await expect(data.auth.api.signInEmail({ body: { email: data.email, password } })).rejects.toThrow();
    expect((await data.auth.api.signInEmail({ body: { email: data.email, password: "sandi-baru-aman-123" } })).user.id).toBe(data.identity.userId);
  });

  it("akun Google dapat membuat kata sandi dan tidak bisa menimpa kata sandi yang sudah ada", async () => {
    await db.insert(user).values({ id: "google-pengaturan", name: "Google", email: "google-pengaturan@example.com", emailVerified: true });
    await db.insert(account).values({ id: "akun-google-pengaturan", userId: "google-pengaturan", accountId: "google-pengaturan-sub", providerId: "google" });
    const auth = makeAuth("google-pengaturan@example.com", "google-pengaturan-sub");
    const signed = await oauth(auth, undefined, false);
    const headers = new Headers({ cookie: cookies(signed.headers) });
    expect(await auth.api.getSession({ headers })).toBeTruthy();
    expect(await getAccountMethods(db, "google-pengaturan")).toEqual({ hasPassword: false, googleConnected: true });
    await auth.api.setPassword({ headers, body: { newPassword: password } });
    expect(await getAccountMethods(db, "google-pengaturan")).toEqual({ hasPassword: true, googleConnected: true });
    await expect(auth.api.setPassword({ headers, body: { newPassword: "pengganti-tanpa-izin" } })).rejects.toThrow();
    expect((await auth.api.signInEmail({ body: { email: "google-pengaturan@example.com", password } })).user.id).toBe("google-pengaturan");
  });

  it("menautkan Google secara eksplisit ke akun lokal tanpa mengubah identitas pemilik", async () => {
    const data = await registered();
    const auth = makeAuth(data.email, "google-link-berhasil");
    const response = await oauth(auth, data.headers);
    expect(response.headers.get("location")).toBe("/undangan/akun?google=terhubung");
    expect(await getAccountMethods(db, data.identity.userId)).toEqual({ hasPassword: true, googleConnected: true });
    const stored = await db.select().from(account).where(and(eq(account.providerId, "google"), eq(account.accountId, "google-link-berhasil")));
    expect(stored[0].userId).toBe(data.identity.userId);
    const signed = await oauth(auth, undefined, false);
    expect((await auth.api.getSession({ headers: new Headers({ cookie: cookies(signed.headers) }) }))?.user.id).toBe(data.identity.userId);
  });

  it("tetap menolak penautan otomatis ke akun lokal yang emailnya belum diverifikasi", async () => {
    const data = await registered();
    const response = await oauth(makeAuth(data.email, "google-implisit"), undefined, false);
    expect(new URL(response.headers.get("location")!, origin).searchParams.get("error")).toBe("account_not_linked");
    expect((await getAccountMethods(db, data.identity.userId)).googleConnected).toBe(false);
  });

  it.each([true, false])("menolak Google dengan email berbeda atau belum diverifikasi (verified=%s)", async (verified) => {
    const data = await registered();
    const response = await oauth(makeAuth(verified ? "lain@example.com" : data.email, `google-ditolak-${verified}`, verified), data.headers);
    const error = new URL(response.headers.get("location")!, origin).searchParams.get("error");
    expect(error).toBe(verified ? "email_does_not_match" : "unable_to_link_account");
    expect((await getAccountMethods(db, data.identity.userId)).googleConnected).toBe(false);
  });

  it("menolak Google yang sudah dimiliki pengguna lain", async () => {
    const data = await registered();
    const other = await registered();
    await db.insert(account).values({ id: "google-sudah-dipakai", userId: other.identity.userId, accountId: "google-milik-orang-lain", providerId: "google" });
    const response = await oauth(makeAuth(data.email, "google-milik-orang-lain"), data.headers);
    expect(new URL(response.headers.get("location")!, origin).searchParams.get("error")).toBe("account_already_linked_to_different_user");
    expect((await getAccountMethods(db, data.identity.userId)).googleConnected).toBe(false);
  });
});
