"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { setInvitationTemplate } from "@/lib/invitations/service";
import { canUseTemplate } from "@/lib/platform/templates";
import { requireInvitation } from "@/lib/session";

export async function gantiTemplateAction(formData: FormData) {
  const { invitation } = await requireInvitation();
  const key = formData.get("template");
  if (typeof key !== "string" || !(await canUseTemplate(db, key, invitation.templateKey))) {
    redirect("/undangan/template");
  }
  if (key !== invitation.templateKey) {
    await setInvitationTemplate(db, invitation.id, key);
    revalidatePath("/undangan", "layout");
    revalidatePath(`/${invitation.slug}`, "layout");
  }
  redirect("/undangan/isi");
}
