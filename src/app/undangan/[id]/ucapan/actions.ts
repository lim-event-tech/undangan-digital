"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { requireInvitationById } from "@/lib/session";
import { isUuid } from "@/lib/uuid";
import { deleteWish, setWishStatus } from "@/lib/wishes/service";
import { isWishStatus } from "@/lib/wishes/shared";


export async function ubahStatusUcapanAction(invitationId: string, formData: FormData): Promise<void> {
  const { invitation } = await requireInvitationById(invitationId);
  const id = formData.get("id");
  const status = formData.get("status");
  if (typeof id === "string" && isUuid(id) && isWishStatus(status)) {
    await setWishStatus(db, invitation.id, id, status);
  }
  revalidatePath(`/undangan/${invitation.id}/ucapan`);
}

export async function hapusUcapanAction(invitationId: string, formData: FormData): Promise<void> {
  const { invitation } = await requireInvitationById(invitationId);
  const id = formData.get("id");
  if (typeof id === "string" && isUuid(id)) await deleteWish(db, invitation.id, id);
  revalidatePath(`/undangan/${invitation.id}/ucapan`);
}
