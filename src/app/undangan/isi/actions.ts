"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { MAX_EVENTS, parseEventForm, parseEventName } from "@/lib/events/form";
import { createEvent, deleteEvent, listEventDetails, updateEvent } from "@/lib/events/service";
import {
  parseMempelaiForm,
  parsePenutupForm,
  parseRsvpForm,
  parseSambutanForm,
} from "@/lib/invitations/editor-form";
import {
  changeSlug,
  deleteInvitation,
  publishInvitation,
  saveContentText,
  saveMempelai,
  saveRsvpSettings,
  unpublishInvitation,
} from "@/lib/invitations/editor";
import {
  parseAmplopForm,
  parseCeritaForm,
  parseCheckinForm,
  parseHitungMundurForm,
  parseMusikForm,
  parseSusunanForm,
  parseUcapanForm,
} from "@/lib/invitations/section-form";
import { deleteMusic } from "@/lib/music/service";
import { getSettings } from "@/lib/platform/service";
import { deletePhoto } from "@/lib/photos/service";
import { SAVED, type SaveResult } from "@/lib/save-result";
import { requireInvitation } from "@/lib/session";
import { checkCustomSlug } from "@/lib/slug";
import { isUuid } from "@/lib/uuid";

const EDITOR_PATH = "/undangan/isi";
const NOT_FOUND: SaveResult = { ok: false, formError: "Undangan tidak ditemukan." };

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export async function simpanMempelaiAction(formData: FormData): Promise<SaveResult> {
  const { invitation } = await requireInvitation();
  const parsed = parseMempelaiForm(formData);
  if (!parsed.ok) return { ok: false, errors: parsed.errors };
  if (!(await saveMempelai(db, invitation.id, parsed.input))) return NOT_FOUND;
  revalidatePath("/undangan", "layout");
  return SAVED;
}

export async function simpanSambutanAction(formData: FormData): Promise<SaveResult> {
  const { invitation } = await requireInvitation();
  const parsed = parseSambutanForm(formData);
  if (!parsed.ok) return { ok: false, errors: parsed.errors };
  if (!(await saveContentText(db, invitation.id, parsed.input))) return NOT_FOUND;
  return SAVED;
}

export async function simpanPenutupAction(formData: FormData): Promise<SaveResult> {
  const { invitation } = await requireInvitation();
  const parsed = parsePenutupForm(formData);
  if (!parsed.ok) return { ok: false, errors: parsed.errors };
  if (!(await saveContentText(db, invitation.id, parsed.input))) return NOT_FOUND;
  return SAVED;
}

export async function simpanAmplopAction(formData: FormData): Promise<SaveResult> {
  const { invitation } = await requireInvitation();
  const parsed = parseAmplopForm(formData);
  if (!parsed.ok) return { ok: false, errors: parsed.errors };
  if (!(await saveContentText(db, invitation.id, parsed.input))) return NOT_FOUND;
  return SAVED;
}

export async function simpanCeritaAction(formData: FormData): Promise<SaveResult> {
  const { invitation } = await requireInvitation();
  const parsed = parseCeritaForm(formData);
  if (!parsed.ok) return { ok: false, errors: parsed.errors };
  if (!(await saveContentText(db, invitation.id, parsed.input))) return NOT_FOUND;
  return SAVED;
}

export async function simpanUcapanAction(formData: FormData): Promise<SaveResult> {
  const { invitation } = await requireInvitation();
  const parsed = parseUcapanForm(formData);
  if (!parsed.ok) return { ok: false, errors: parsed.errors };
  if (!(await saveContentText(db, invitation.id, parsed.input))) return NOT_FOUND;
  revalidatePath("/undangan/ucapan");
  return SAVED;
}

export async function simpanSusunanAction(formData: FormData): Promise<SaveResult> {
  const { invitation } = await requireInvitation();
  const parsed = parseSusunanForm(formData);
  if (!parsed.ok) return { ok: false, errors: parsed.errors };
  if (!(await saveContentText(db, invitation.id, parsed.input))) return NOT_FOUND;
  return SAVED;
}

export async function simpanHitungMundurAction(formData: FormData): Promise<SaveResult> {
  const { invitation } = await requireInvitation();
  const parsed = parseHitungMundurForm(formData);
  if (!parsed.ok) return { ok: false, errors: parsed.errors };
  if (!(await saveContentText(db, invitation.id, parsed.input))) return NOT_FOUND;
  return SAVED;
}

export async function simpanMusikAction(formData: FormData): Promise<SaveResult> {
  const { invitation } = await requireInvitation();
  const parsed = parseMusikForm(formData);
  if (!parsed.ok) return { ok: false, errors: parsed.errors };
  if (!(await saveContentText(db, invitation.id, parsed.input))) return NOT_FOUND;
  return SAVED;
}

export async function simpanCheckinAction(formData: FormData): Promise<SaveResult> {
  const { invitation } = await requireInvitation();
  const parsed = parseCheckinForm(formData);
  if (!parsed.ok) return { ok: false, errors: parsed.errors };
  if (!(await saveContentText(db, invitation.id, parsed.input))) return NOT_FOUND;
  revalidatePath("/undangan/checkin");
  return SAVED;
}

export async function hapusMusikAction() {
  const { invitation } = await requireInvitation();
  await deleteMusic(db, invitation.id);
  revalidatePath(EDITOR_PATH);
}

export async function simpanSlugAction(
  _state: SaveResult | null,
  formData: FormData,
): Promise<SaveResult> {
  const { invitation } = await requireInvitation();
  const checked = checkCustomSlug(field(formData, "slug"));
  if (!checked.ok) return { ok: false, errors: { slug: checked.error } };
  if ((await getSettings(db)).slugCadangan.includes(checked.slug)) {
    return { ok: false, errors: { slug: "Link ini tidak bisa dipakai" } };
  }

  const result = await changeSlug(db, invitation.id, checked.slug);
  if (!result.ok) {
    if (result.reason === "terkunci") {
      return {
        ok: false,
        formError: "Link sudah terkunci karena ada undangan yang ditandai terkirim.",
      };
    }
    if (result.reason === "dipakai") {
      return { ok: false, errors: { slug: "Link ini sudah dipakai undangan lain" } };
    }
    return NOT_FOUND;
  }
  revalidatePath("/undangan", "layout");
  return SAVED;
}

export async function simpanRsvpAction(formData: FormData): Promise<SaveResult> {
  const { invitation } = await requireInvitation();
  const parsed = parseRsvpForm(formData, invitation.rsvpDeadline);
  if (!parsed.ok) return { ok: false, errors: parsed.errors };
  if (!(await saveRsvpSettings(db, invitation.id, parsed.input))) return NOT_FOUND;
  return SAVED;
}

export async function simpanAcaraAction(formData: FormData): Promise<SaveResult> {
  const { invitation } = await requireInvitation();
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
  revalidatePath(EDITOR_PATH);
  revalidatePath("/undangan/tamu");
  return SAVED;
}

export async function tambahAcaraAction(
  _state: SaveResult | null,
  formData: FormData,
): Promise<SaveResult> {
  const { invitation } = await requireInvitation();
  const parsed = parseEventName(formData);
  if ("error" in parsed) return { ok: false, errors: { nama: parsed.error } };

  const created = await createEvent(db, invitation.id, parsed.name);
  if (!created.ok) {
    return { ok: false, formError: `Maksimal ${MAX_EVENTS} acara per undangan.` };
  }
  revalidatePath(EDITOR_PATH);
  revalidatePath("/undangan/tamu");
  return SAVED;
}

export async function hapusAcaraAction(
  _state: SaveResult | null,
  formData: FormData,
): Promise<SaveResult> {
  const { invitation } = await requireInvitation();
  const id = field(formData, "id");
  if (!isUuid(id)) return { ok: false, formError: "Acara tidak ditemukan." };

  const result = await deleteEvent(db, invitation.id, id);
  if (result === "terakhir") {
    return { ok: false, formError: "Undangan harus punya minimal satu acara." };
  }
  if (result === "tidak-ada") {
    return { ok: false, formError: "Acara tidak ditemukan. Mungkin sudah dihapus." };
  }
  revalidatePath(EDITOR_PATH);
  revalidatePath("/undangan/tamu");
  return SAVED;
}

export async function hapusFotoAction(formData: FormData) {
  const { invitation } = await requireInvitation();
  const id = field(formData, "id");
  if (isUuid(id)) await deletePhoto(db, invitation.id, id);
  revalidatePath(EDITOR_PATH);
}

export async function terbitkanAction(): Promise<SaveResult> {
  const { invitation } = await requireInvitation();
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

export async function tarikTerbitAction(): Promise<SaveResult> {
  const { invitation } = await requireInvitation();
  const changed = await unpublishInvitation(db, invitation.id);
  revalidatePath("/undangan", "layout");
  return changed ? SAVED : { ok: false, formError: "Undangan ini tidak sedang terbit." };
}

export async function hapusUndanganAction() {
  const { user, invitation } = await requireInvitation();
  await deleteInvitation(db, invitation.id, user.id);
  revalidatePath("/undangan", "layout");
  redirect("/undangan/baru");
}
