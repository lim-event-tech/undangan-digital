"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { requireInvitation } from "@/lib/session";
import { isUuid } from "@/lib/uuid";
import { deleteWish, setWishStatus } from "@/lib/wishes/service";
import { isWishStatus } from "@/lib/wishes/shared";

const UCAPAN_PATH = "/undangan/ucapan";

export async function ubahStatusUcapanAction(formData: FormData): Promise<void> {
  const { invitation } = await requireInvitation();
  const id = formData.get("id");
  const status = formData.get("status");
  if (typeof id === "string" && isUuid(id) && isWishStatus(status)) {
    await setWishStatus(db, invitation.id, id, status);
  }
  revalidatePath(UCAPAN_PATH);
}

export async function hapusUcapanAction(formData: FormData): Promise<void> {
  const { invitation } = await requireInvitation();
  const id = formData.get("id");
  if (typeof id === "string" && isUuid(id)) await deleteWish(db, invitation.id, id);
  revalidatePath(UCAPAN_PATH);
}
