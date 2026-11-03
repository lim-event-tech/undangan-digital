"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { markCheckedIn, regenerateCheckinKey, undoCheckIn } from "@/lib/checkin/service";
import { requireInvitation } from "@/lib/session";
import { isUuid } from "@/lib/uuid";

const CHECKIN_PATH = "/undangan/checkin";

export async function gantiKunciAction(): Promise<void> {
  const { invitation } = await requireInvitation();
  await regenerateCheckinKey(db, invitation.id);
  revalidatePath(CHECKIN_PATH);
}

export async function masukkanTamuAction(formData: FormData): Promise<void> {
  const { invitation } = await requireInvitation();
  const id = formData.get("id");
  if (typeof id === "string" && isUuid(id)) await markCheckedIn(db, invitation.id, id);
  revalidatePath(CHECKIN_PATH);
}

export async function batalkanMasukAction(formData: FormData): Promise<void> {
  const { invitation } = await requireInvitation();
  const id = formData.get("id");
  if (typeof id === "string" && isUuid(id)) await undoCheckIn(db, invitation.id, id);
  revalidatePath(CHECKIN_PATH);
}
