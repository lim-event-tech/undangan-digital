"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { markReminded, markSent, markUnsent } from "@/lib/guests/sending";
import { saveContentText } from "@/lib/invitations/editor";
import { SAVED, type SaveResult } from "@/lib/save-result";
import { requireInvitation } from "@/lib/session";
import { isUuid } from "@/lib/uuid";
import { checkMessageTemplate } from "@/lib/whatsapp";

const KIRIM_PATH = "/undangan/kirim";

export async function simpanPesanAction(formData: FormData): Promise<SaveResult> {
  const { invitation } = await requireInvitation();
  const raw = formData.get("pesan");
  const checked = checkMessageTemplate(typeof raw === "string" ? raw : "");
  if (!checked.ok) return { ok: false, errors: { pesan: checked.error } };

  if (!(await saveContentText(db, invitation.id, { pesanWa: checked.template }))) {
    return { ok: false, formError: "Undangan tidak ditemukan." };
  }
  revalidatePath(KIRIM_PATH);
  return SAVED;
}

export async function simpanPengingatAction(formData: FormData): Promise<SaveResult> {
  const { invitation } = await requireInvitation();
  const raw = formData.get("pesan");
  const checked = checkMessageTemplate(typeof raw === "string" ? raw : "");
  if (!checked.ok) return { ok: false, errors: { pesan: checked.error } };

  if (!(await saveContentText(db, invitation.id, { pesanPengingat: checked.template }))) {
    return { ok: false, formError: "Undangan tidak ditemukan." };
  }
  revalidatePath(KIRIM_PATH);
  return SAVED;
}

export async function tandaiDiingatkanAction(guestId: string): Promise<void> {
  const { invitation } = await requireInvitation();
  if (!isUuid(guestId)) return;
  await markReminded(db, invitation.id, guestId);
  revalidatePath(KIRIM_PATH);
}

export async function tandaiTerkirimAction(guestId: string): Promise<void> {
  const { invitation } = await requireInvitation();
  if (!isUuid(guestId)) return;
  await markSent(db, invitation.id, guestId);
  revalidatePath(KIRIM_PATH);
}

export async function tandaiBelumTerkirimAction(formData: FormData): Promise<void> {
  const { invitation } = await requireInvitation();
  const id = formData.get("id");
  if (typeof id === "string" && isUuid(id)) await markUnsent(db, invitation.id, id);
  revalidatePath(KIRIM_PATH);
}
