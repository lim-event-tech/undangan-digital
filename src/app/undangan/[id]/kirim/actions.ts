"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { markReminded, markSent, markUnsent } from "@/lib/guests/sending";
import { saveContentText } from "@/lib/invitations/editor";
import { SAVED, type SaveResult } from "@/lib/save-result";
import { requireInvitationById } from "@/lib/session";
import { isUuid } from "@/lib/uuid";
import { checkMessageTemplate } from "@/lib/whatsapp";
import { queueBlast } from "@/lib/wa/blast";
import { getWaConfig } from "@/lib/wa/config-service";
import { getWaManager } from "@/lib/wa/manager";
import { cancelPending, type JobKind } from "@/lib/wa/queue";


export async function simpanPesanAction(invitationId: string, formData: FormData): Promise<SaveResult> {
  const { invitation } = await requireInvitationById(invitationId);
  const raw = formData.get("pesan");
  const checked = checkMessageTemplate(typeof raw === "string" ? raw : "");
  if (!checked.ok) return { ok: false, errors: { pesan: checked.error } };

  if (!(await saveContentText(db, invitation.id, { pesanWa: checked.template }))) {
    return { ok: false, formError: "Undangan tidak ditemukan." };
  }
  revalidatePath(`/undangan/${invitation.id}/kirim`);
  return SAVED;
}

export async function simpanPengingatAction(invitationId: string, formData: FormData): Promise<SaveResult> {
  const { invitation } = await requireInvitationById(invitationId);
  const raw = formData.get("pesan");
  const checked = checkMessageTemplate(typeof raw === "string" ? raw : "");
  if (!checked.ok) return { ok: false, errors: { pesan: checked.error } };

  if (!(await saveContentText(db, invitation.id, { pesanPengingat: checked.template }))) {
    return { ok: false, formError: "Undangan tidak ditemukan." };
  }
  revalidatePath(`/undangan/${invitation.id}/kirim`);
  return SAVED;
}

export async function tandaiDiingatkanAction(invitationId: string, guestId: string): Promise<void> {
  const { invitation } = await requireInvitationById(invitationId);
  if (!isUuid(guestId)) return;
  await markReminded(db, invitation.id, guestId);
  revalidatePath(`/undangan/${invitation.id}/kirim`);
}

export async function tandaiTerkirimAction(invitationId: string, guestId: string): Promise<void> {
  const { invitation } = await requireInvitationById(invitationId);
  if (!isUuid(guestId)) return;
  await markSent(db, invitation.id, guestId);
  revalidatePath(`/undangan/${invitation.id}/kirim`);
}

export async function tandaiBelumTerkirimAction(invitationId: string, formData: FormData): Promise<void> {
  const { invitation } = await requireInvitationById(invitationId);
  const id = formData.get("id");
  if (typeof id === "string" && isUuid(id)) await markUnsent(db, invitation.id, id);
  revalidatePath(`/undangan/${invitation.id}/kirim`);
}

export type BlastState = { ok: true; added: number } | { ok: false; error: string } | null;

export async function kirimOtomatisAction(invitationId: string, _state: BlastState,
  formData: FormData,
): Promise<BlastState> {
  const { invitation } = await requireInvitationById(invitationId);
  const raw = formData.get("jenis");
  const kind: JobKind = raw === "pengingat" ? "pengingat" : "undangan";

  const config = await getWaConfig(db);
  if (!config.aktif) return { ok: false, error: "Kirim otomatis sedang dimatikan oleh admin." };
  if (!getWaManager().ready()) {
    return { ok: false, error: "WhatsApp pengirim belum terhubung. Hubungi admin atau kirim manual." };
  }

  const result = await queueBlast(db, invitation, kind);
  if (result.ok) revalidatePath(`/undangan/${invitation.id}/kirim`);
  return result;
}

export async function batalkanAntreanAction(invitationId: string): Promise<void> {
  const { invitation } = await requireInvitationById(invitationId);
  await cancelPending(db, invitation.id);
  revalidatePath(`/undangan/${invitation.id}/kirim`);
}
