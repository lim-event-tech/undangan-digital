"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { markReminded, markSent, markUnsent } from "@/lib/guests/sending";
import { saveContentText } from "@/lib/invitations/editor";
import { parseWaPosterForm } from "@/lib/invitations/section-form";
import { deletePhoto } from "@/lib/photos/service";
import { SAVED, type SaveResult } from "@/lib/save-result";
import { getGuest } from "@/lib/guests/service";
import { requireInvitationAccess, requireInvitationById } from "@/lib/session";
import { isUuid } from "@/lib/uuid";
import { checkMessageTemplate } from "@/lib/whatsapp";
import { queueBlast } from "@/lib/wa/blast";
import { getWaConfig } from "@/lib/wa/config-service";
import { getWaManager } from "@/lib/wa/manager";
import { cancelPending, type JobKind } from "@/lib/wa/queue";
import {
  sendBatchInvitationViaWaba,
  sendGuestInvitationViaWaba,
  type BatchWabaResult,
} from "@/lib/waba/service";
import { getWabaConfig as getPlatformWabaConfig } from "@/lib/waba/config-service";
import {
  submitWabaTemplate,
  type CreateWabaTemplatePayload,
  type WabaTemplateItem,
} from "@/lib/waba/client";
import { validateTemplateName } from "@/lib/waba/templates-guide";


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

export async function simpanPosterWaAction(invitationId: string, formData: FormData): Promise<SaveResult> {
  const { invitation } = await requireInvitationById(invitationId);
  const parsed = parseWaPosterForm(formData);
  if (!parsed.ok) return { ok: false, errors: parsed.errors };
  if (!(await saveContentText(db, invitation.id, parsed.input))) {
    return { ok: false, formError: "Undangan tidak ditemukan." };
  }
  revalidatePath(`/undangan/${invitation.id}/kirim`);
  return SAVED;
}

export async function hapusPosterWaAction(invitationId: string, formData: FormData): Promise<void> {
  const { invitation } = await requireInvitationById(invitationId);
  const id = formData.get("id");
  if (typeof id === "string" && isUuid(id)) await deletePhoto(db, invitation.id, id);
  revalidatePath(`/undangan/${invitation.id}/kirim`);
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
  const { invitation, scope } = await requireInvitationAccess(invitationId);
  if (!isUuid(guestId) || !(await getGuest(db, invitation.id, guestId, scope ?? undefined))) return;
  await markReminded(db, invitation.id, guestId);
  revalidatePath(`/undangan/${invitation.id}/kirim`);
}

export async function tandaiTerkirimAction(invitationId: string, guestId: string): Promise<void> {
  const { invitation, scope } = await requireInvitationAccess(invitationId);
  if (!isUuid(guestId) || !(await getGuest(db, invitation.id, guestId, scope ?? undefined))) return;
  await markSent(db, invitation.id, guestId);
  revalidatePath(`/undangan/${invitation.id}/kirim`);
}

export async function tandaiBelumTerkirimAction(invitationId: string, formData: FormData): Promise<void> {
  const { invitation, scope } = await requireInvitationAccess(invitationId);
  const id = formData.get("id");
  if (typeof id === "string" && isUuid(id) && (await getGuest(db, invitation.id, id, scope ?? undefined))) await markUnsent(db, invitation.id, id);
  revalidatePath(`/undangan/${invitation.id}/kirim`);
}

export type BlastState = { ok: true; added: number } | { ok: false; error: string } | null;

export async function kirimOtomatisAction(invitationId: string, _state: BlastState,
  formData: FormData,
): Promise<BlastState> {
  const { invitation, user, scope } = await requireInvitationAccess(invitationId);
  const raw = formData.get("jenis");
  const kind: JobKind = raw === "pengingat" ? "pengingat" : "undangan";

  const config = await getWaConfig(db);
  if (!config.aktif) return { ok: false, error: "Kirim otomatis sedang dimatikan oleh admin." };
  if (!getWaManager().for(user.id).ready()) {
    return { ok: false, error: "Nomor WhatsApp Anda belum terhubung. Tautkan dulu di bagian Nomor WhatsApp Anda, atau kirim manual." };
  }

  const result = await queueBlast(db, invitation, kind, new Date(), { senderUserId: user.id, addedBy: scope ?? undefined });
  if (result.ok) revalidatePath(`/undangan/${invitation.id}/kirim`);
  return result;
}

export async function batalkanAntreanAction(invitationId: string): Promise<void> {
  const { invitation, user, scope } = await requireInvitationAccess(invitationId);
  await cancelPending(db, invitation.id, scope ? user.id : undefined);
  revalidatePath(`/undangan/${invitation.id}/kirim`);
}

export async function hubungkanSayaAction(invitationId: string): Promise<void> {
  const { user } = await requireInvitationAccess(invitationId);
  await getWaManager().for(user.id).connect();
}

export async function putuskanSayaAction(invitationId: string): Promise<void> {
  const { user } = await requireInvitationAccess(invitationId);
  await getWaManager().for(user.id).disconnect();
}

export async function keluarkanSayaAction(invitationId: string): Promise<void> {
  const { user } = await requireInvitationAccess(invitationId);
  await getWaManager().for(user.id).logout();
}

export async function kirimWabaTamuAction(
  invitationId: string,
  guestId: string,
  templateOverride?: string,
): Promise<{ ok: boolean; error?: string; remainingQuota?: number }> {
  const { invitation, user, scope } = await requireInvitationAccess(invitationId);
  if (!isUuid(guestId) || !(await getGuest(db, invitation.id, guestId, scope ?? undefined))) {
    return { ok: false, error: "Tamu tidak ditemukan." };
  }

  const result = await sendGuestInvitationViaWaba(db, {
    invitationId: invitation.id,
    guestId,
    senderUserId: user.id,
    templateOverride,
  });

  if (result.ok) {
    revalidatePath(`/undangan/${invitation.id}/kirim`);
    return { ok: true, remainingQuota: result.remainingQuota };
  }
  return { ok: false, error: result.error };
}

export async function kirimBatchWabaAction(
  invitationId: string,
  templateOverride?: string,
): Promise<BatchWabaResult> {
  const { invitation, user, scope } = await requireInvitationAccess(invitationId);

  const result = await sendBatchInvitationViaWaba(db, {
    invitationId: invitation.id,
    senderUserId: user.id,
    addedBy: scope ?? undefined,
    templateOverride,
  });

  revalidatePath(`/undangan/${invitation.id}/kirim`);
  return result;
}

export async function simpanPilihanTemplateWabaAction(
  invitationId: string,
  templateName: string,
): Promise<{ ok: boolean; error?: string }> {
  const { invitation } = await requireInvitationAccess(invitationId);
  const trimmed = templateName.trim();
  if (!trimmed) {
    return { ok: false, error: "Nama template tidak valid." };
  }

  const success = await saveContentText(db, invitation.id, {
    wabaTemplate: trimmed,
  });

  if (!success) {
    return { ok: false, error: "Gagal menyimpan pilihan template." };
  }

  revalidatePath(`/undangan/${invitation.id}/kirim`);
  return { ok: true };
}

export async function ajukanTemplateWabaAction(
  invitationId: string,
  payload: CreateWabaTemplatePayload,
): Promise<{ ok: boolean; data?: WabaTemplateItem; error?: string }> {
  await requireInvitationAccess(invitationId);

  const validName = validateTemplateName(payload.name);
  if (!validName.ok) {
    return { ok: false, error: validName.error };
  }

  if (!payload.bodyText?.trim()) {
    return { ok: false, error: "Teks isi (Body Text) template wajib diisi." };
  }

  const config = await getPlatformWabaConfig(db);
  if (!config.apiKey) {
    return { ok: false, error: "WABA Gateway belum dikonfigurasi di Admin Panel." };
  }

  const result = await submitWabaTemplate(config, {
    ...payload,
    name: validName.name,
  });

  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  revalidatePath(`/undangan/${invitationId}/kirim`);
  return { ok: true, data: result.data };
}
