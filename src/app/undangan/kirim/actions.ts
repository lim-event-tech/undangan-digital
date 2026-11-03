"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { markReminded, markSent, markUnsent } from "@/lib/guests/sending";
import { saveContentText } from "@/lib/invitations/editor";
import { SAVED, type SaveResult } from "@/lib/save-result";
import { requireInvitation } from "@/lib/session";
import { isUuid } from "@/lib/uuid";
import { checkMessageTemplate } from "@/lib/whatsapp";
import { queueBlast } from "@/lib/wa/blast";
import { getWaConfig } from "@/lib/wa/config-service";
import { getWaManager } from "@/lib/wa/manager";
import { cancelPending, type JobKind } from "@/lib/wa/queue";

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

export type BlastState = { ok: true; added: number } | { ok: false; error: string } | null;

export async function kirimOtomatisAction(
  _state: BlastState,
  formData: FormData,
): Promise<BlastState> {
  const { invitation } = await requireInvitation();
  const raw = formData.get("jenis");
  const kind: JobKind = raw === "pengingat" ? "pengingat" : "undangan";

  const config = await getWaConfig(db);
  if (!config.aktif) return { ok: false, error: "Kirim otomatis sedang dimatikan oleh admin." };
  if (!getWaManager().ready()) {
    return { ok: false, error: "WhatsApp pengirim belum terhubung. Hubungi admin atau kirim manual." };
  }

  const result = await queueBlast(db, invitation, kind);
  if (result.ok) revalidatePath(KIRIM_PATH);
  return result;
}

export async function batalkanAntreanAction(): Promise<void> {
  const { invitation } = await requireInvitation();
  await cancelPending(db, invitation.id);
  revalidatePath(KIRIM_PATH);
}
