"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import {
  parseGuestForm,
  type GuestFormState,
} from "@/lib/guests/form";
import {
  createGuest,
  deleteGuest,
  findPhoneConflict,
  listEvents,
  updateGuest,
} from "@/lib/guests/service";
import { requireInvitationAccess } from "@/lib/session";
import { isUuid } from "@/lib/uuid";

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export async function saveGuestAction(invitationId: string, _state: GuestFormState,
  formData: FormData,
): Promise<GuestFormState> {
  const { invitation, user, scope } = await requireInvitationAccess(invitationId);

  const id = field(formData, "id");
  const parsed = parseGuestForm(formData);
  if (!parsed.ok) return { errors: parsed.errors, values: parsed.values };
  const { values } = parsed;

  if (id && !isUuid(id)) {
    return { formError: "Tamu tidak ditemukan.", values };
  }

  const events = await listEvents(db, invitation.id);
  const knownEvents = new Set(events.map((e) => e.id));
  const eventIds = parsed.input.eventIds.filter((e) => knownEvents.has(e));
  if (eventIds.length === 0) {
    return { errors: { acara: "Pilih minimal satu acara" }, values };
  }
  const input = { ...parsed.input, eventIds };

  if (field(formData, "izinkanDuplikat") !== "1") {
    const conflict = await findPhoneConflict(
      db,
      invitation.id,
      input.phone,
      id || undefined,
      scope ?? undefined,
    );
    if (conflict) return { duplicate: { name: conflict.name }, values };
  }

  if (id) {
    const updated = await updateGuest(db, invitation.id, id, input, scope ?? undefined);
    if (!updated) {
      return {
        formError: "Tamu tidak ditemukan. Mungkin sudah dihapus.",
        values,
      };
    }
  } else {
    await createGuest(db, invitation.id, input, user.id);
  }

  revalidatePath(`/undangan/${invitation.id}/tamu`);
  redirect(id ? `/undangan/${invitation.id}/tamu?ok=diubah` : `/undangan/${invitation.id}/tamu?ok=ditambah`);
}

export async function deleteGuestAction(invitationId: string, formData: FormData) {
  const { invitation, scope } = await requireInvitationAccess(invitationId);
  const id = field(formData, "id");
  if (isUuid(id)) await deleteGuest(db, invitation.id, id, scope ?? undefined);
  revalidatePath(`/undangan/${invitation.id}/tamu`);
  redirect(`/undangan/${invitation.id}/tamu?ok=dihapus`);
}
