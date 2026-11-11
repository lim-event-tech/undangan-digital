"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { markCheckedIn, regenerateCheckinKey, undoCheckIn } from "@/lib/checkin/service";
import { getGuest } from "@/lib/guests/service";
import { requireInvitationById, requireInvitationAccess } from "@/lib/session";
import { isUuid } from "@/lib/uuid";


export async function gantiKunciAction(invitationId: string): Promise<void> {
  const { invitation } = await requireInvitationById(invitationId);
  await regenerateCheckinKey(db, invitation.id);
  revalidatePath(`/undangan/${invitation.id}/checkin`);
}

export async function masukkanTamuAction(invitationId: string, formData: FormData): Promise<void> {
  const { invitation, scope } = await requireInvitationAccess(invitationId);
  const id = formData.get("id");
  if (typeof id === "string" && isUuid(id) && (await getGuest(db, invitation.id, id, scope ?? undefined))) await markCheckedIn(db, invitation.id, id);
  revalidatePath(`/undangan/${invitation.id}/checkin`);
}

export async function batalkanMasukAction(invitationId: string, formData: FormData): Promise<void> {
  const { invitation, scope } = await requireInvitationAccess(invitationId);
  const id = formData.get("id");
  if (typeof id === "string" && isUuid(id) && (await getGuest(db, invitation.id, id, scope ?? undefined))) await undoCheckIn(db, invitation.id, id);
  revalidatePath(`/undangan/${invitation.id}/checkin`);
}
