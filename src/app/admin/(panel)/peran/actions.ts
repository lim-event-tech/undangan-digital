"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { recordAudit } from "@/lib/admin/audit";
import { requireAdmin } from "@/lib/admin/guard";
import { createRole, deleteRole, listRoles, updateRole } from "@/lib/admin/role-service";
import { PERMISSION_INFO, normalizePermissions, type Permission } from "@/lib/admin/roles";
import { SAVED, type SaveResult } from "@/lib/save-result";

function izinDari(formData: FormData) {
  return normalizePermissions(formData.getAll("izin"));
}

function ringkasIzin(izin: readonly Permission[]): string {
  return izin.map((p) => PERMISSION_INFO[p].label).join("; ").slice(0, 480);
}

function galatLabel(error: "label" | "label-dipakai" | "tidak-ada" | "super"): SaveResult {
  if (error === "label") return { ok: false, errors: { label: "Nama peran wajib diisi, maksimal 40 karakter" } };
  if (error === "label-dipakai") return { ok: false, errors: { label: "Nama peran ini sudah ada" } };
  if (error === "super") return { ok: false, formError: "Peran Super admin tidak bisa diubah." };
  return { ok: false, formError: "Peran tidak ditemukan." };
}

export async function tambahPeranAction(
  _state: SaveResult | null,
  formData: FormData,
): Promise<SaveResult> {
  const admin = await requireAdmin("tim");
  const izin = izinDari(formData);
  const hasil = await createRole(db, { label: String(formData.get("label") ?? ""), permissions: izin });
  if (!hasil.ok) return galatLabel(hasil.error);

  await recordAudit(db, {
    actor: admin,
    category: "tim",
    action: "Menambah peran",
    target: hasil.key,
    detail: ringkasIzin(izin),
  });
  revalidatePath("/admin/peran");
  revalidatePath("/admin/tim");
  return SAVED;
}

export async function simpanPeranAction(
  _state: SaveResult | null,
  formData: FormData,
): Promise<SaveResult> {
  const admin = await requireAdmin("tim");
  const key = String(formData.get("key") ?? "");
  const izin = izinDari(formData);
  const hasil = await updateRole(db, key, { label: String(formData.get("label") ?? ""), permissions: izin });
  if (!hasil.ok) return galatLabel(hasil.error);

  await recordAudit(db, {
    actor: admin,
    category: "tim",
    action: "Mengubah peran",
    target: key,
    detail: ringkasIzin(izin),
  });
  revalidatePath("/admin", "layout");
  return SAVED;
}

export async function hapusPeranAction(
  _state: SaveResult | null,
  formData: FormData,
): Promise<SaveResult> {
  const admin = await requireAdmin("tim");
  const key = String(formData.get("key") ?? "");
  const sebelum = (await listRoles(db)).find((role) => role.key === key);
  const hasil = await deleteRole(db, key);
  if (!hasil.ok) {
    if (hasil.error === "dipakai") {
      return { ok: false, formError: "Peran ini masih dipakai anggota tim. Pindahkan mereka ke peran lain dulu." };
    }
    if (hasil.error === "super") return { ok: false, formError: "Peran Super admin tidak bisa dihapus." };
    return { ok: false, formError: "Peran tidak ditemukan." };
  }

  await recordAudit(db, {
    actor: admin,
    category: "tim",
    action: "Menghapus peran",
    target: key,
    detail: sebelum?.label ?? "",
  });
  revalidatePath("/admin/peran");
  revalidatePath("/admin/tim");
  return SAVED;
}
