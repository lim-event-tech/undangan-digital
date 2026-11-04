"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { user } from "@/db/schema";
import { recordAudit } from "@/lib/admin/audit";
import { requireAdmin } from "@/lib/admin/guard";
import { getRoleLabel } from "@/lib/admin/role-service";
import { changeAdminRole, createAdmin, removeAdmin, resetAdminPassword } from "@/lib/admin/team";
import { SAVED, type SaveResult } from "@/lib/save-result";

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export async function tambahAdminAction(
  _state: SaveResult | null,
  formData: FormData,
): Promise<SaveResult> {
  const admin = await requireAdmin("tim");
  const role = field(formData, "peran");
  const roleLabel = await getRoleLabel(db, role);
  if (!roleLabel) return { ok: false, errors: { peran: "Pilih peran" } };

  const password = field(formData, "kataSandi");
  const result = await createAdmin(db, {
    name: field(formData, "nama"),
    email: field(formData, "email"),
    password: password || undefined,
    role,
  });
  if (!result.ok) {
    if (result.error === "nama-kosong") return { ok: false, errors: { nama: "Nama wajib diisi" } };
    if (result.error === "email-tidak-valid") return { ok: false, errors: { email: "Format email tidak valid" } };
    if (result.error === "email-dipakai") return { ok: false, errors: { email: "Email ini sudah terdaftar sebagai admin" } };
    if (result.error === "email-pengguna") {
      return { ok: false, errors: { email: "Email ini sudah dipakai akun pengguna. Pakai email lain untuk admin." } };
    }
    if (result.error === "peran") return { ok: false, errors: { peran: "Pilih peran" } };
    return { ok: false, errors: { kataSandi: result.message ?? "Kata sandi tidak valid" } };
  }

  await recordAudit(db, {
    actor: admin,
    category: "tim",
    action: "Menambah admin",
    target: field(formData, "email").trim().toLowerCase(),
    detail: `Peran ${roleLabel}, masuk dengan ${password ? "kata sandi atau Google" : "Google"}`,
  });
  revalidatePath("/admin/tim");
  return SAVED;
}

export async function ubahPeranAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin("tim");
  const id = field(formData, "id");
  const role = field(formData, "peran");
  if (!id || !role) return;

  const [target] = await db.select({ email: user.email, role: user.adminRole }).from(user).where(eq(user.id, id));
  if (!target || target.role === role) return;
  const [dari, ke] = await Promise.all([
    target.role ? getRoleLabel(db, target.role) : null,
    getRoleLabel(db, role),
  ]);
  const result = await changeAdminRole(db, id, role);
  if (!result.ok) return;

  await recordAudit(db, {
    actor: admin,
    category: "tim",
    action: "Mengubah peran admin",
    target: target.email,
    detail: `${dari ?? "-"} menjadi ${ke ?? role}`,
  });
  revalidatePath("/admin/tim");
}

export async function cabutAdminAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin("tim");
  const id = field(formData, "id");
  if (!id || id === admin.id) return;

  const [target] = await db.select({ email: user.email }).from(user).where(eq(user.id, id));
  if (!target) return;
  const result = await removeAdmin(db, id);
  if (!result.ok) return;

  await recordAudit(db, {
    actor: admin,
    category: "tim",
    action: "Mencabut akses admin",
    target: target.email,
  });
  revalidatePath("/admin/tim");
}

export async function gantiSandiAction(
  _state: SaveResult | null,
  formData: FormData,
): Promise<SaveResult> {
  const admin = await requireAdmin("tim");
  const id = field(formData, "id");
  const [target] = await db.select({ email: user.email }).from(user).where(eq(user.id, id));
  if (!target) return { ok: false, formError: "Admin tidak ditemukan." };

  const result = await resetAdminPassword(db, id, field(formData, "kataSandi"));
  if (!result.ok) {
    return result.error === "sandi"
      ? { ok: false, errors: { kataSandi: result.message ?? "Kata sandi tidak valid" } }
      : { ok: false, formError: "Admin tidak ditemukan." };
  }

  await recordAudit(db, {
    actor: admin,
    category: "tim",
    action: result.created ? "Menambah kata sandi admin" : "Mengganti kata sandi admin",
    target: target.email,
    detail: "Semua sesi admin itu dikeluarkan",
  });
  revalidatePath("/admin/tim");
  return SAVED;
}
