"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { markCheckedIn, regenerateCheckinKey, undoCheckIn } from "@/lib/checkin/service";
import { requireInvitationById } from "@/lib/session";
import { isUuid } from "@/lib/uuid";


export async function gantiKunciAction(invitationId: string): Promise<void> {
  const { invitation } = await requireInvitationById(invitationId);
  await regenerateCheckinKey(db, invitation.id);
  revalidatePath(`/undangan/${invitation.id}/checkin`);
}

export async function masukkanTamuAction(invitationId: string, formData: FormData): Promise<void> {
  const { invitation } = await requireInvitationById(invitationId);
  const id = formData.get("id");
  if (typeof id === "string" && isUuid(id)) await markCheckedIn(db, invitation.id, id);
  revalidatePath(`/undangan/${invitation.id}/checkin`);
}

export async function batalkanMasukAction(invitationId: string, formData: FormData): Promise<void> {
  const { invitation } = await requireInvitationById(invitationId);
  const id = formData.get("id");
  if (typeof id === "string" && isUuid(id)) await undoCheckIn(db, invitation.id, id);
  revalidatePath(`/undangan/${invitation.id}/checkin`);
}
