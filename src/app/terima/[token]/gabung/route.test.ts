import { beforeEach, describe, expect, it, vi } from "vitest";
import { INVITE_COOKIE } from "@/lib/token";

const cookieDelete = vi.fn();
const getSession = vi.fn();
const previewInvite = vi.fn();
const getInvitationAccess = vi.fn();
const acceptInvite = vi.fn();

vi.mock("next/headers", () => ({ cookies: vi.fn(async () => ({ delete: cookieDelete })) }));
vi.mock("@/db", () => ({ db: {} }));
vi.mock("@/lib/session", () => ({ getSession: () => getSession() }));
vi.mock("@/lib/team/service", () => ({
  looksLikeInviteToken: (value: unknown) => typeof value === "string" && /^[A-Za-z0-9_-]{32}$/.test(value),
  previewInvite: (...args: unknown[]) => previewInvite(...args),
  getInvitationAccess: (...args: unknown[]) => getInvitationAccess(...args),
  acceptInvite: (...args: unknown[]) => acceptInvite(...args),
}));

import { GET } from "./route";

const TOKEN = "aB3dE6gH9jK2mN5pQ8sT1vW4yZ7cF0hJ";
const BASE = "https://rsvp.example.test";

async function jalankan(token: string = TOKEN) {
  const response = await GET(new Request(`${BASE}/terima/${token}/gabung`), { params: Promise.resolve({ token }) });
  return response.headers.get("location");
}

beforeEach(() => {
  vi.stubEnv("BETTER_AUTH_URL", BASE);
  cookieDelete.mockReset();
  getSession.mockReset();
  previewInvite.mockReset();
  getInvitationAccess.mockReset();
  acceptInvite.mockReset();
  previewInvite.mockResolvedValue({ state: "valid", invite: { invitationId: "inv-1" } });
  getInvitationAccess.mockResolvedValue(null);
});

describe("GET /terima/[token]/gabung", () => {
  it("kembali ke halaman terima bila belum masuk", async () => {
    getSession.mockResolvedValue(null);
    expect(await jalankan()).toBe(`${BASE}/terima/${TOKEN}`);
    expect(acceptInvite).not.toHaveBeenCalled();
  });

  it("kembali ke halaman terima bila akun diblokir", async () => {
    getSession.mockResolvedValue({ user: { id: "u1", status: "diblokir" } });
    expect(await jalankan()).toBe(`${BASE}/terima/${TOKEN}`);
    expect(acceptInvite).not.toHaveBeenCalled();
  });

  it("menerima undangan dan langsung membuka daftar tamu", async () => {
    getSession.mockResolvedValue({ user: { id: "u1", status: "aktif", adminRole: null } });
    acceptInvite.mockResolvedValue({ ok: true, invitationId: "inv-1" });
    expect(await jalankan()).toBe(`${BASE}/undangan/inv-1/tamu`);
    expect(acceptInvite).toHaveBeenCalledWith({}, TOKEN, { id: "u1", adminRole: null });
    expect(cookieDelete).toHaveBeenCalledWith(INVITE_COOKIE);
  });

  it("langsung membuka undangan bila pengguna sudah anggota, tanpa menerima ulang", async () => {
    getSession.mockResolvedValue({ user: { id: "u1", status: "aktif", adminRole: null } });
    getInvitationAccess.mockResolvedValue({ role: "anggota" });
    expect(await jalankan()).toBe(`${BASE}/undangan/inv-1/tamu`);
    expect(acceptInvite).not.toHaveBeenCalled();
    expect(cookieDelete).toHaveBeenCalledWith(INVITE_COOKIE);
  });

  it("membuka editor bagi pemilik", async () => {
    getSession.mockResolvedValue({ user: { id: "u1", status: "aktif", adminRole: null } });
    getInvitationAccess.mockResolvedValue({ role: "pemilik" });
    expect(await jalankan()).toBe(`${BASE}/undangan/inv-1/isi`);
  });

  it("menandai akun admin lewat parameter galat", async () => {
    getSession.mockResolvedValue({ user: { id: "a1", status: "aktif", adminRole: "super" } });
    acceptInvite.mockResolvedValue({ ok: false, error: "akun-admin" });
    expect(await jalankan()).toBe(`${BASE}/terima/${TOKEN}?galat=akun-admin`);
    expect(cookieDelete).not.toHaveBeenCalled();
  });

  it("memakai galat umum untuk kegagalan lain", async () => {
    getSession.mockResolvedValue({ user: { id: "u1", status: "aktif", adminRole: null } });
    acceptInvite.mockResolvedValue({ ok: false, error: "kedaluwarsa" });
    expect(await jalankan()).toBe(`${BASE}/terima/${TOKEN}?galat=gagal`);
  });

  it("mengarahkan token tidak valid ke /undangan", async () => {
    expect(await jalankan("token-palsu")).toBe(`${BASE}/undangan`);
    expect(getSession).not.toHaveBeenCalled();
  });
});
