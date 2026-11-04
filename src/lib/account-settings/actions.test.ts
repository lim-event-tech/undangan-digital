import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  identity: vi.fn(), methods: vi.fn(), email: vi.fn(),
  change: vi.fn(), create: vi.fn(), revoke: vi.fn(), revalidate: vi.fn(),
}));
vi.mock("@/db", () => ({ db: {} }));
vi.mock("@/lib/auth", () => ({ auth: { api: { changePassword: mocks.change, setPassword: mocks.create, revokeOtherSessions: mocks.revoke } } }));
vi.mock("@/lib/session", () => ({ requireOwnAccount: mocks.identity }));
vi.mock("@/lib/account-settings/service", () => ({ getAccountMethods: mocks.methods, changeOwnEmail: mocks.email }));
vi.mock("next/headers", () => ({ headers: async () => new Headers({ cookie: "sesi-sendiri" }) }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));

import { ubahEmailAction, ubahKataSandiAction } from "@/app/undangan/akun/actions";

let counter = 0;
beforeEach(() => {
  vi.resetAllMocks();
  counter += 1;
  mocks.identity.mockResolvedValue({ user: { id: `pengguna-${counter}` }, session: { id: `sesi-${counter}`, createdAt: new Date() } });
  mocks.methods.mockResolvedValue({ hasPassword: true, googleConnected: false });
});

function passwordForm() {
  const form = new FormData();
  form.set("currentPassword", "sandi-sekarang");
  form.set("password", "sandi-baru-aman");
  form.set("confirmation", "sandi-baru-aman");
  return form;
}

describe("server action pengaturan akun", () => {
  it.each([ubahEmailAction, ubahKataSandiAction])("memeriksa akses sebelum membaca atau mengubah kredensial", async (action) => {
    mocks.identity.mockRejectedValue(new Error("akses-ditolak"));
    await expect(action(passwordForm())).rejects.toThrow("akses-ditolak");
    expect(mocks.methods).not.toHaveBeenCalled();
    expect(mocks.email).not.toHaveBeenCalled();
    expect(mocks.change).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("mengabaikan userId kiriman klien dan memakai sesi yang sedang masuk", async () => {
    const form = new FormData();
    form.set("userId", "pemilik-lain");
    mocks.email.mockResolvedValue({ ok: true });
    expect(await ubahEmailAction(form)).toEqual({ ok: true });
    expect(mocks.email).toHaveBeenCalledWith({}, { userId: `pengguna-${counter}`, sessionId: `sesi-${counter}` }, form);
  });

  it("meminta sandi saat ini dan mencabut sesi lain saat mengganti sandi", async () => {
    expect(await ubahKataSandiAction(passwordForm())).toEqual({ ok: true });
    expect(mocks.change).toHaveBeenCalledWith({ headers: expect.any(Headers), body: { currentPassword: "sandi-sekarang", newPassword: "sandi-baru-aman", revokeOtherSessions: true } });
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("menolak konfirmasi berbeda sebelum memanggil autentikasi", async () => {
    const form = passwordForm();
    form.set("confirmation", "beda");
    expect(await ubahKataSandiAction(form)).toMatchObject({ ok: false, errors: { confirmation: expect.any(String) } });
    expect(mocks.change).not.toHaveBeenCalled();
  });

  it("memakai setPassword hanya untuk akun Google tanpa sandi yang sesinya masih baru", async () => {
    mocks.methods.mockResolvedValue({ hasPassword: false, googleConnected: true });
    expect(await ubahKataSandiAction(passwordForm())).toEqual({ ok: true });
    expect(mocks.create).toHaveBeenCalledWith({ headers: expect.any(Headers), body: { newPassword: "sandi-baru-aman" } });
    expect(mocks.revoke).toHaveBeenCalled();
    expect(mocks.change).not.toHaveBeenCalled();
  });

  it("menolak pembuatan sandi dari sesi Google lama", async () => {
    mocks.methods.mockResolvedValue({ hasPassword: false, googleConnected: true });
    mocks.identity.mockResolvedValue({ user: { id: `pengguna-${counter}` }, session: { id: "sesi-lama", createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000) } });
    expect(await ubahKataSandiAction(passwordForm())).toMatchObject({ ok: false });
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("membatasi percobaan yang gagal per pengguna", async () => {
    mocks.email.mockResolvedValue({ ok: false, errors: { password: "Salah" } });
    for (let i = 0; i < 5; i += 1) await ubahEmailAction(new FormData());
    expect(await ubahEmailAction(new FormData())).toMatchObject({ ok: false, formError: expect.stringContaining("Terlalu banyak percobaan") });
    expect(mocks.email).toHaveBeenCalledTimes(5);
  });
});
