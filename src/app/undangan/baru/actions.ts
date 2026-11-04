"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import {
  createInvitation,
  getInvitationForOwner,
} from "@/lib/invitations/service";
import { canUseTemplate } from "@/lib/platform/templates";
import { requireUser } from "@/lib/session";
import { parseInvitationTitle } from "@/lib/invitations/title";
import { DEFAULT_TEMPLATE } from "@/templates/registry";

export type BaruState = {
  error?: string;
  values?: { title: string };
};

export async function createInvitationAction(
  _state: BaruState,
  formData: FormData,
): Promise<BaruState> {
  const user = await requireUser();
  const parsed = parseInvitationTitle(formData.get("title"));
  const rawTitle = formData.get("title");
  const values = { title: typeof rawTitle === "string" ? rawTitle : "" };
  if (!parsed.ok) return { error: parsed.error, values };
  const pilihan = formData.get("template");
  const templateKey =
    typeof pilihan === "string" && (await canUseTemplate(db, pilihan)) ? pilihan : DEFAULT_TEMPLATE;

  const existing = await getInvitationForOwner(db, user.id);
  if (!existing) {
    await createInvitation(db, user.id, { title: parsed.title, templateKey });
  }
  revalidatePath("/undangan", "layout");
  redirect("/undangan/isi");
}
