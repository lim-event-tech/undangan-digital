import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ session: vi.fn(), cookies: vi.fn() }));
vi.mock("@/db", () => ({ db: {} }));
vi.mock("@/lib/auth", () => ({ auth: { api: { getSession: mocks.session } } }));
vi.mock("next/headers", () => ({ headers: async () => new Headers(), cookies: mocks.cookies }));
vi.mock("next/navigation", () => ({ redirect: (path: string) => { throw new Error(`redirect:${path}`); } }));

import { requireOwnAccount } from "./session";

beforeEach(() => { vi.clearAllMocks(); });

describe("akses pengaturan akun sendiri", () => {
  it("meminta pengguna masuk jika belum mempunyai sesi", async () => {
    mocks.session.mockResolvedValue(null);
    await expect(requireOwnAccount()).rejects.toThrow("redirect:/masuk");
  });

  it("menolak akun yang sudah diblokir", async () => {
    mocks.session.mockResolvedValue({ user: { id: "pemilik", status: "diblokir" }, session: { id: "sesi" } });
    await expect(requireOwnAccount()).rejects.toThrow("redirect:/masuk?galat=diblokir");
  });

  it("menolak admin tanpa memakai identitas pemilik dalam mode kelola", async () => {
    mocks.session.mockResolvedValue({ user: { id: "admin", adminRole: "super", status: "aktif" }, session: { id: "sesi" } });
    await expect(requireOwnAccount()).rejects.toThrow("redirect:/admin");
    expect(mocks.cookies).not.toHaveBeenCalled();
  });

  it("mengembalikan identitas dan sesi pengguna yang benar-benar sedang masuk", async () => {
    const current = { user: { id: "pengguna", status: "aktif", adminRole: null }, session: { id: "sesi-pengguna" } };
    mocks.session.mockResolvedValue(current);
    expect(await requireOwnAccount()).toEqual(current);
  });
});
