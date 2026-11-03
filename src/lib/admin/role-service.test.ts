import { beforeAll, describe, expect, it } from "vitest";
import { createTestDb, type TestDb } from "@/test/db";
import { createRole, deleteRole, getRolePermissions, listRoles, updateRole } from "./role-service";
import { PERMISSIONS } from "./roles";
import { createAdmin } from "./team";

let db: TestDb;

beforeAll(async () => {
  db = await createTestDb();
});

describe("peran admin di database", () => {
  it("memuat tiga peran bawaan dengan Super admin selalu memegang semua izin", async () => {
    const roles = await listRoles(db);
    expect(roles.map((r) => r.key)).toEqual(["super", "dukungan", "lihat"]);
    expect(roles[0].permissions).toEqual([...PERMISSIONS]);
    expect(roles[1].permissions).toEqual(["lihat", "ubah-undangan"]);
    expect(await getRolePermissions(db, "lihat")).toEqual(["lihat"]);
    expect(await getRolePermissions(db, "tidak-ada")).toBeNull();
  });

  it("menambah peran baru dengan kunci dari nama dan izin yang dinormalkan", async () => {
    const created = await createRole(db, {
      label: "  Staf   Keuangan ",
      permissions: ["lihat-tamu", "tim", "asing", "kelola-akun"],
    });
    expect(created).toEqual({ ok: true, key: "staf-keuangan" });
    expect(await getRolePermissions(db, "staf-keuangan")).toEqual(["lihat", "lihat-tamu", "kelola-akun"]);

    expect(await createRole(db, { label: "staf keuangan", permissions: [] })).toEqual({
      ok: false,
      error: "label-dipakai",
    });
    expect(await createRole(db, { label: "   ", permissions: [] })).toEqual({ ok: false, error: "label" });
    expect(await createRole(db, { label: "x".repeat(41), permissions: [] })).toEqual({ ok: false, error: "label" });

    const mirip = await createRole(db, { label: "Staf-Keuangan!", permissions: [] });
    expect(mirip).toEqual({ ok: true, key: "staf-keuangan-2" });
  });

  it("tidak pernah memakai kunci super untuk peran baru", async () => {
    expect(await createRole(db, { label: "Super", permissions: [] })).toEqual({ ok: true, key: "super-2" });
    expect(await createRole(db, { label: "SUPER!!", permissions: [] })).toEqual({ ok: true, key: "super-3" });
  });

  it("mengubah nama dan izin peran kecuali Super admin", async () => {
    expect(await updateRole(db, "dukungan", { label: "Tim dukungan", permissions: ["hapus", "lihat-tamu"] })).toEqual({
      ok: true,
      key: "dukungan",
    });
    expect(await getRolePermissions(db, "dukungan")).toEqual(["lihat", "lihat-tamu", "hapus"]);
    expect((await listRoles(db)).find((r) => r.key === "dukungan")?.label).toBe("Tim dukungan");

    expect(await updateRole(db, "super", { label: "Boss", permissions: [] })).toEqual({ ok: false, error: "super" });
    expect(await updateRole(db, "tidak-ada", { label: "X", permissions: [] })).toEqual({
      ok: false,
      error: "tidak-ada",
    });
    expect(await updateRole(db, "lihat", { label: "Tim dukungan", permissions: [] })).toEqual({
      ok: false,
      error: "label-dipakai",
    });
  });

  it("menghapus peran hanya bila tidak dipakai dan bukan Super admin", async () => {
    await createRole(db, { label: "Sementara", permissions: [] });
    const admin = await createAdmin(db, {
      name: "Pakai",
      email: "pakai@example.com",
      password: "kata-sandi-panjang",
      role: "sementara",
    });
    expect(admin.ok).toBe(true);
    expect(await deleteRole(db, "sementara")).toEqual({ ok: false, error: "dipakai" });
    expect(await deleteRole(db, "super")).toEqual({ ok: false, error: "super" });
    expect(await deleteRole(db, "tidak-ada")).toEqual({ ok: false, error: "tidak-ada" });

    await createRole(db, { label: "Kosong", permissions: [] });
    expect(await deleteRole(db, "kosong")).toEqual({ ok: true });
    expect(await getRolePermissions(db, "kosong")).toBeNull();
  });
});
