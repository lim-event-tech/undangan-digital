"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { recordAudit } from "@/lib/admin/audit";
import { requireAdmin } from "@/lib/admin/guard";
import {
  adminChangeSlug,
  adminDeleteInvitation,
  adminSetDeadline,
  getInvitationAdmin,
  setInvitationStatusAdmin,
} from "@/lib/admin/queries";
import { dateFromDeadline, deadlineFromDate, isDateString } from "@/lib/datetime";
import { SAVED, type SaveResult } from "@/lib/save-result";
import { checkCustomSlug } from "@/lib/slug";
import { getSettings } from "@/lib/platform/service";
import { isUuid } from "@/lib/uuid";

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

const NOT_FOUND: SaveResult = { ok: false, formError: "Undangan tidak ditemukan." };

function refresh(id: string) {
  revalidatePath(`/admin/undangan/${id}`);
  revalidatePath("/admin/undangan");
}

export async function ubahStatusAction(formData: FormData): Promise<void> {
  const id = field(formData, "id");
  const tindakan = field(formData, "tindakan");
  if (!isUuid(id) || (tindakan !== "tangguhkan" && tindakan !== "aktifkan")) return;
  const admin = await requireAdmin("tangguhkan");

  const detail = await getInvitationAdmin(db, id);
  if (!detail) return;
  const hasil = await setInvitationStatusAdmin(db, id, tindakan);
  await recordAudit(db, {
    actor: admin,
    category: "undangan",
    action: tindakan === "tangguhkan" ? "Menangguhkan undangan" : "Mengaktifkan undangan",
    target: `/u/${detail.slug}`,
    detail: `Status ${detail.status} menjadi ${hasil ?? detail.status}`,
  });
  refresh(id);
}

export async function ubahSlugAction(
  _state: SaveResult | null,
  formData: FormData,
): Promise<SaveResult> {
  const id = field(formData, "id");
  if (!isUuid(id)) return NOT_FOUND;
  const admin = await requireAdmin("ubah-undangan");

  const checked = checkCustomSlug(field(formData, "slug"));
  if (!checked.ok) return { ok: false, errors: { slug: checked.error } };
  const settings = await getSettings(db);
  if (settings.slugCadangan.includes(checked.slug)) {
    return { ok: false, errors: { slug: "Link ini termasuk kata yang dicadangkan" } };
  }

  const detail = await getInvitationAdmin(db, id);
  if (!detail) return NOT_FOUND;
  const result = await adminChangeSlug(db, id, checked.slug);
  if (!result.ok) {
    if (result.reason === "dipakai") {
      return { ok: false, errors: { slug: "Link ini sudah dipakai undangan lain" } };
    }
    return NOT_FOUND;
  }
  if (detail.slug !== checked.slug) {
    await recordAudit(db, {
      actor: admin,
      category: "undangan",
      action: "Mengubah slug",
      target: `/u/${checked.slug}`,
      detail: `Dari ${detail.slug}${detail.slugLocked ? ", walau sudah ada link terkirim" : ""}`,
    });
  }
  refresh(id);
  return SAVED;
}

export async function ubahBatasAction(
  _state: SaveResult | null,
  formData: FormData,
): Promise<SaveResult> {
  const id = field(formData, "id");
  if (!isUuid(id)) return NOT_FOUND;
  const admin = await requireAdmin("ubah-undangan");

  const text = field(formData, "batas").trim();
  if (text && !isDateString(text)) return { ok: false, errors: { batas: "Tanggal tidak valid" } };
  const detail = await getInvitationAdmin(db, id);
  if (!detail) return NOT_FOUND;

  await adminSetDeadline(db, id, text ? deadlineFromDate(text) : null);
  await recordAudit(db, {
    actor: admin,
    category: "undangan",
    action: "Mengubah batas RSVP",
    target: `/u/${detail.slug}`,
    detail: `${dateFromDeadline(detail.rsvpDeadline) || "tanpa batas"} menjadi ${text || "tanpa batas"}`,
  });
  refresh(id);
  return SAVED;
}

export async function hapusPermanenAction(
  _state: SaveResult | null,
  formData: FormData,
): Promise<SaveResult> {
  const id = field(formData, "id");
  if (!isUuid(id)) return NOT_FOUND;
  const admin = await requireAdmin("hapus");

  const detail = await getInvitationAdmin(db, id);
  if (!detail) return NOT_FOUND;
  if (field(formData, "konfirmasi").trim() !== detail.slug) {
    return { ok: false, errors: { konfirmasi: `Ketik ${detail.slug} untuk konfirmasi` } };
  }

  await adminDeleteInvitation(db, id);
  await recordAudit(db, {
    actor: admin,
    category: "undangan",
    action: "Menghapus undangan permanen",
    target: `/u/${detail.slug}`,
    detail: `${detail.guests} tamu ikut terhapus, pemilik ${detail.ownerEmail}`,
  });
  revalidatePath("/admin/undangan");
  redirect("/admin/undangan");
}
