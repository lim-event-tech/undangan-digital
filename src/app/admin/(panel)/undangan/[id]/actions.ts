"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { recordAudit } from "@/lib/admin/audit";
import { requireAdmin } from "@/lib/admin/guard";
import {
  adminDeleteInvitation,
  adminSetDeadline,
  getInvitationAdmin,
  setInvitationStatusAdmin,
} from "@/lib/admin/queries";
import { formatDeadline } from "@/lib/datetime";
import { saveContentText } from "@/lib/invitations/editor";
import { parseRsvpDeadline } from "@/lib/rsvp/shared";
import { SAVED, type SaveResult } from "@/lib/save-result";
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

export async function ubahWabaAction(
  _state: SaveResult | null,
  formData: FormData,
): Promise<SaveResult> {
  const id = field(formData, "id");
  if (!isUuid(id)) return NOT_FOUND;
  const admin = await requireAdmin("ubah-undangan");
  const detail = await getInvitationAdmin(db, id);
  if (!detail) return NOT_FOUND;
  const aktif = formData.get("aktif") !== null;
  if (!(await saveContentText(db, id, { wabaAktif: aktif }))) return NOT_FOUND;
  await recordAudit(db, {
    actor: admin,
    category: "undangan",
    action: aktif ? "Mengaktifkan WABA resmi untuk undangan" : "Menonaktifkan WABA resmi untuk undangan",
    target: `/u/${detail.slug}`,
    detail: `WABA resmi ${detail.wabaAktif ? "aktif" : "nonaktif"} menjadi ${aktif ? "aktif" : "nonaktif"}`,
  });
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
  const jamText = field(formData, "batasJam").trim() || "23:59";
  const parsed = parseRsvpDeadline(text, new Date(), jamText);
  if (!parsed.ok) return { ok: false, errors: parsed.error === "Jam tidak valid" ? { batasJam: parsed.error } : { batas: parsed.error } };
  const detail = await getInvitationAdmin(db, id);
  if (!detail) return NOT_FOUND;

  await adminSetDeadline(db, id, parsed.deadline);
  await recordAudit(db, {
    actor: admin,
    category: "undangan",
    action: "Mengubah batas RSVP",
    target: `/u/${detail.slug}`,
    detail: `${formatDeadline(detail.rsvpDeadline) ?? "tanpa batas"} menjadi ${formatDeadline(parsed.deadline) ?? "tanpa batas"}`,
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
