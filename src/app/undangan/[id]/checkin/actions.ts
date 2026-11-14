"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { markCheckedIn, regenerateCheckinKey, undoCheckIn } from "@/lib/checkin/service";
import { getGuest } from "@/lib/guests/service";
import { notFound } from "next/navigation";
import { requireInvitationById, requireInvitationAccess } from "@/lib/session";
import { checkinScope } from "@/lib/team/access";
import { isUuid } from "@/lib/uuid";


export async function gantiKunciAction(invitationId: string): Promise<void> {
  const { invitation } = await requireInvitationById(invitationId);
  await regenerateCheckinKey(db, invitation.id);
  revalidatePath(`/undangan/${invitation.id}/checkin`);
}

export async function masukkanTamuAction(invitationId: string, formData: FormData): Promise<void> {
  const { invitation, scope, checkinAccess } = await requireInvitationAccess(invitationId);
  if (checkinAccess === "tidak") notFound();
  const id = formData.get("id");
  if (typeof id === "string" && isUuid(id) && (await getGuest(db, invitation.id, id, checkinScope(checkinAccess, scope)))) await markCheckedIn(db, invitation.id, id);
  revalidatePath(`/undangan/${invitation.id}/checkin`);
}

export async function batalkanMasukAction(invitationId: string, formData: FormData): Promise<void> {
  const { invitation, scope, checkinAccess } = await requireInvitationAccess(invitationId);
  if (checkinAccess === "tidak") notFound();
  const id = formData.get("id");
  if (typeof id === "string" && isUuid(id) && (await getGuest(db, invitation.id, id, checkinScope(checkinAccess, scope)))) await undoCheckIn(db, invitation.id, id);
  revalidatePath(`/undangan/${invitation.id}/checkin`);
}
