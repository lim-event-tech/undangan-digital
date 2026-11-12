"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { recordAudit } from "@/lib/admin/audit";
import { requireAdmin } from "@/lib/admin/guard";
import { setAccountPassword, updateAccountProfile } from "@/lib/admin/accounts";
import { isAccountStatus, setAccountStatus } from "@/lib/admin/queries";
import { SAVED, type SaveResult } from "@/lib/save-result";
import { updateUserWabaQuota } from "@/lib/waba/service";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function ubahStatusAkunAction(formData: FormData): Promise<void> {
  const id = formData.get("id");
  const status = formData.get("status");
  if (typeof id !== "string" || !id || !isAccountStatus(status)) return;
  const admin = await requireAdmin("tangguhkan");

  const [target] = await db.select({ email: user.email }).from(user).where(eq(user.id, id));
  if (!target) return;
  const result = await setAccountStatus(db, id, status);
  if (!result.ok) return;

  await recordAudit(db, {
    actor: admin,
    category: "akun",
    action: status === "diblokir" ? "Memblokir akun" : "Membuka blokir akun",
    target: target.email,
    detail: result.suspended > 0 ? `${result.suspended} undangan ikut ditangguhkan` : "",
  });
  revalidatePath("/admin/pengguna");
  revalidatePath("/admin/undangan");
}

export async function ubahAkunAction(
  _state: SaveResult | null,
  formData: FormData,
): Promise<SaveResult> {
  const admin = await requireAdmin("kelola-akun");
  const id = String(formData.get("id") ?? "");
  const [target] = await db.select({ email: user.email }).from(user).where(eq(user.id, id));
  if (!target) return { ok: false, formError: "Akun tidak ditemukan." };

  const result = await updateAccountProfile(db, id, {
    name: String(formData.get("nama") ?? ""),
    email: String(formData.get("email") ?? ""),
  });
  if (!result.ok) {
    if (result.error === "nama") return { ok: false, errors: { nama: "Nama wajib diisi, maksimal 80 karakter" } };
    if (result.error === "email") return { ok: false, errors: { email: "Format email tidak valid" } };
    if (result.error === "email-dipakai") return { ok: false, errors: { email: "Email ini sudah dipakai akun lain" } };
    return { ok: false, formError: "Akun tidak ditemukan." };
  }
  if (result.changed.length > 0) {
    await recordAudit(db, {
      actor: admin,
      category: "akun",
      action: "Mengubah data akun",
      target: target.email,
      detail: `Diubah: ${result.changed.join(", ")}`,
    });
  }
  revalidatePath("/admin/pengguna");
  revalidatePath("/admin/undangan");
  return SAVED;
}

export async function aturSandiAkunAction(
  _state: SaveResult | null,
  formData: FormData,
): Promise<SaveResult> {
  const admin = await requireAdmin("kelola-akun");
  const id = String(formData.get("id") ?? "");
  const [target] = await db.select({ email: user.email }).from(user).where(eq(user.id, id));
  if (!target) return { ok: false, formError: "Akun tidak ditemukan." };

  const result = await setAccountPassword(db, id, String(formData.get("kataSandi") ?? ""));
  if (!result.ok) {
    return result.error === "sandi"
      ? { ok: false, errors: { kataSandi: result.message ?? "Kata sandi tidak valid" } }
      : { ok: false, formError: "Akun tidak ditemukan." };
  }
  await recordAudit(db, {
    actor: admin,
    category: "akun",
    action: result.created ? "Menambah kata sandi akun" : "Mengganti kata sandi akun",
    target: target.email,
    detail: "Semua sesi akun itu dikeluarkan",
  });
  revalidatePath("/admin/pengguna");
  return SAVED;
}

export async function aturWabaAkunAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin("kelola-akun");
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const wabaAllowedRaw = formData.get("wabaAllowed");
  const allowed = wabaAllowedRaw !== null ? wabaAllowedRaw === "1" : undefined;

  const mode = formData.get("mode");
  const rawJumlah = Number(formData.get("jumlah"));
  const jumlah = Number.isFinite(rawJumlah) ? Math.round(rawJumlah) : undefined;

  await updateUserWabaQuota(db, admin, id, {
    allowed,
    deltaQuota: mode === "delta" ? jumlah : undefined,
    setQuota: mode === "set" ? jumlah : undefined,
  });

  revalidatePath("/admin/pengguna");
}
