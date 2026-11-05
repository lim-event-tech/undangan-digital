"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { setInvitationTemplate } from "@/lib/invitations/service";
import { canUseTemplate } from "@/lib/platform/templates";
import { requireInvitationById } from "@/lib/session";

export async function gantiTemplateAction(invitationId: string, formData: FormData) {
  const { invitation } = await requireInvitationById(invitationId);
  const key = formData.get("template");
  if (typeof key !== "string" || !(await canUseTemplate(db, key, invitation.templateKey))) {
    redirect(`/undangan/${invitation.id}/template`);
  }
  if (key !== invitation.templateKey) {
    await setInvitationTemplate(db, invitation.id, key);
    revalidatePath("/undangan", "layout");
    revalidatePath(`/${invitation.slug}`, "layout");
  }
  redirect(`/undangan/${invitation.id}/isi`);
}
