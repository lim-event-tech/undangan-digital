"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { db } from "@/db";
import { MAX_EVENTS, parseEventForm, parseEventName } from "@/lib/events/form";
import { createEvent, deleteEvent, listEventDetails, updateEvent } from "@/lib/events/service";
import {
  parseTitleForm,
  parsePenutupForm,
  parseRsvpForm,
  parseSambutanForm,
} from "@/lib/invitations/editor-form";
import {
  deleteInvitation,
  publishInvitation,
  saveContentText,
  saveTitle,
  saveRsvpSettings,
  unpublishInvitation,
} from "@/lib/invitations/editor";
import {
  parseCheckinForm,
  parseSampulForm,
  parseSusunanForm,
  parseTampilanForm,
} from "@/lib/invitations/section-form";
import { deletePhoto } from "@/lib/photos/service";
import { parseFormalForm } from "@/lib/invitations/formal-form";
import { SAVED, type SaveResult } from "@/lib/save-result";
import { ACTING_COOKIE, getActing, requireInvitationById } from "@/lib/session";
import { recordAudit } from "@/lib/admin/audit";
import { isUuid } from "@/lib/uuid";

const NOT_FOUND: SaveResult = { ok: false, formError: "Undangan tidak ditemukan." };

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export async function simpanTitleAction(invitationId: string, formData: FormData): Promise<SaveResult> {
  const { invitation } = await requireInvitationById(invitationId);
  const parsed = parseTitleForm(formData);
  if (!parsed.ok) return { ok: false, errors: parsed.errors };
  if (!(await saveTitle(db, invitation.id, parsed.input))) return NOT_FOUND;
  revalidatePath("/undangan", "layout");
  return SAVED;
}

export async function simpanSambutanAction(invitationId: string, formData: FormData): Promise<SaveResult> {
  const { invitation } = await requireInvitationById(invitationId);
  const parsed = parseSambutanForm(formData);
  if (!parsed.ok) return { ok: false, errors: parsed.errors };
  if (!(await saveContentText(db, invitation.id, parsed.input))) return NOT_FOUND;
  return SAVED;
}

export async function simpanPenutupAction(invitationId: string, formData: FormData): Promise<SaveResult> {
  const { invitation } = await requireInvitationById(invitationId);
  const parsed = parsePenutupForm(formData);
  if (!parsed.ok) return { ok: false, errors: parsed.errors };
  if (!(await saveContentText(db, invitation.id, parsed.input))) return NOT_FOUND;
  return SAVED;
}

export async function simpanFormalAction(group: string, invitationId: string, formData: FormData): Promise<SaveResult> {
  const { invitation } = await requireInvitationById(invitationId);
  const parsed = parseFormalForm(group, formData);
  if (!parsed.ok) return { ok: false, errors: parsed.errors };
  if (!(await saveContentText(db, invitation.id, parsed.input))) return NOT_FOUND;
  if (group === "penyelenggara") revalidatePath(`/undangan/${invitation.id}/isi`);
  return SAVED;
}

export async function simpanSusunanAction(invitationId: string, formData: FormData): Promise<SaveResult> {
  const { invitation } = await requireInvitationById(invitationId);
  const parsed = parseSusunanForm(formData);
  if (!parsed.ok) return { ok: false, errors: parsed.errors };
  if (!(await saveContentText(db, invitation.id, parsed.input))) return NOT_FOUND;
  return SAVED;
}

export async function simpanSampulAction(invitationId: string, formData: FormData): Promise<SaveResult> {
  const { invitation } = await requireInvitationById(invitationId);
  const parsed = parseSampulForm(formData);
  if (!parsed.ok) return { ok: false, errors: parsed.errors };
  if (!(await saveContentText(db, invitation.id, parsed.input))) return NOT_FOUND;
  return SAVED;
}

export async function simpanTampilanAction(invitationId: string, formData: FormData): Promise<SaveResult> {
  const { invitation } = await requireInvitationById(invitationId);
  const parsed = parseTampilanForm(formData);
  if (!parsed.ok) return { ok: false, errors: parsed.errors };
  if (!(await saveContentText(db, invitation.id, parsed.input))) return NOT_FOUND;
  return SAVED;
}

export async function simpanCheckinAction(invitationId: string, formData: FormData): Promise<SaveResult> {
  const { invitation } = await requireInvitationById(invitationId);
  const parsed = parseCheckinForm(formData);
  if (!parsed.ok) return { ok: false, errors: parsed.errors };
  if (!(await saveContentText(db, invitation.id, parsed.input))) return NOT_FOUND;
  revalidatePath(`/undangan/${invitation.id}/checkin`);
  return SAVED;
}

export async function simpanRsvpAction(invitationId: string, formData: FormData): Promise<SaveResult> {
  const { invitation } = await requireInvitationById(invitationId);
  const parsed = parseRsvpForm(formData, invitation.rsvpDeadline);
  if (!parsed.ok) return { ok: false, errors: parsed.errors };
  if (!(await saveRsvpSettings(db, invitation.id, parsed.input))) return NOT_FOUND;
  return SAVED;
}

export async function simpanAcaraAction(invitationId: string, formData: FormData): Promise<SaveResult> {
  const { invitation } = await requireInvitationById(invitationId);
  const id = field(formData, "id");
  if (!isUuid(id)) return { ok: false, formError: "Acara tidak ditemukan." };

  const currentEvent = (await listEventDetails(db, invitation.id)).find((event) => event.id === id);
  if (!currentEvent) return { ok: false, formError: "Acara tidak ditemukan. Mungkin sudah dihapus." };
  const parsed = parseEventForm(formData, currentEvent);
  if (!parsed.ok) return { ok: false, errors: parsed.errors };

  const updated = await updateEvent(db, invitation.id, id, parsed.input);
  if (!updated) {
    return { ok: false, formError: "Acara tidak ditemukan. Mungkin sudah dihapus." };
  }
  revalidatePath(`/undangan/${invitation.id}/isi`);
  revalidatePath(`/undangan/${invitation.id}/tamu`);
  return SAVED;
}

export async function tambahAcaraAction(invitationId: string, _state: SaveResult | null,
  formData: FormData,
): Promise<SaveResult> {
  const { invitation } = await requireInvitationById(invitationId);
  const parsed = parseEventName(formData);
  if ("error" in parsed) return { ok: false, errors: { nama: parsed.error } };

  const created = await createEvent(db, invitation.id, parsed.name);
  if (!created.ok) {
    return { ok: false, formError: `Maksimal ${MAX_EVENTS} acara per undangan.` };
  }
  revalidatePath(`/undangan/${invitation.id}/isi`);
  revalidatePath(`/undangan/${invitation.id}/tamu`);
  return SAVED;
}

export async function hapusAcaraAction(invitationId: string, _state: SaveResult | null,
  formData: FormData,
): Promise<SaveResult> {
  const { invitation } = await requireInvitationById(invitationId);
  const id = field(formData, "id");
  if (!isUuid(id)) return { ok: false, formError: "Acara tidak ditemukan." };

  const result = await deleteEvent(db, invitation.id, id);
  if (result === "terakhir") {
    return { ok: false, formError: "Undangan harus punya minimal satu acara." };
  }
  if (result === "tidak-ada") {
    return { ok: false, formError: "Acara tidak ditemukan. Mungkin sudah dihapus." };
  }
  revalidatePath(`/undangan/${invitation.id}/isi`);
  revalidatePath(`/undangan/${invitation.id}/tamu`);
  return SAVED;
}

export async function hapusFotoAction(invitationId: string, formData: FormData) {
  const { invitation } = await requireInvitationById(invitationId);
  const id = field(formData, "id");
  if (isUuid(id)) await deletePhoto(db, invitation.id, id);
  revalidatePath(`/undangan/${invitation.id}/isi`);
}

export async function terbitkanAction(invitationId: string): Promise<SaveResult> {
  const { invitation } = await requireInvitationById(invitationId);
  const result = await publishInvitation(db, invitation.id);
  revalidatePath("/undangan", "layout");
  if (result.ok) return SAVED;
  if (result.reason === "ditangguhkan") {
    return { ok: false, formError: "Undangan ini sedang ditangguhkan dan tidak bisa diterbitkan." };
  }
  if (result.reason === "belum-lengkap") {
    return { ok: false, formError: "Masih ada isian wajib yang belum lengkap." };
  }
  return NOT_FOUND;
}

export async function tarikTerbitAction(invitationId: string): Promise<SaveResult> {
  const { invitation } = await requireInvitationById(invitationId);
  const changed = await unpublishInvitation(db, invitation.id);
  revalidatePath("/undangan", "layout");
  return changed ? SAVED : { ok: false, formError: "Undangan ini tidak sedang terbit." };
}

export async function hapusUndanganAction(invitationId: string) {
  const { user, invitation } = await requireInvitationById(invitationId);
  const acting = await getActing();
  const deleted = await deleteInvitation(db, invitation.id, user.id);
  revalidatePath("/undangan", "layout");
  if (deleted && acting) {
    (await cookies()).delete(ACTING_COOKIE);
    await recordAudit(db, { actor: acting.admin, category: "undangan", action: "Selesai mengelola undangan sebagai pengguna", target: `/u/${invitation.slug}` });
    redirect("/admin/undangan");
  }
  redirect("/undangan");
}
