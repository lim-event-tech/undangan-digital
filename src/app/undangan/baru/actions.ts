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
import { DEFAULT_TEMPLATE } from "@/templates/registry";

export type BaruState = {
  error?: string;
  values?: { pria: string; wanita: string };
};

const MAKS_NAMA = 40;

function bersihkan(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

export async function createInvitationAction(
  _state: BaruState,
  formData: FormData,
): Promise<BaruState> {
  const user = await requireUser();
  const pria = bersihkan(formData.get("pria"));
  const wanita = bersihkan(formData.get("wanita"));
  const values = { pria, wanita };
  const pilihan = formData.get("template");
  const templateKey =
    typeof pilihan === "string" && (await canUseTemplate(db, pilihan)) ? pilihan : DEFAULT_TEMPLATE;

  if (!pria || !wanita) {
    return { error: "Isi nama panggilan kedua mempelai.", values };
  }
  if (pria.length > MAKS_NAMA || wanita.length > MAKS_NAMA) {
    return { error: `Nama maksimal ${MAKS_NAMA} karakter.`, values };
  }

  const existing = await getInvitationForOwner(db, user.id);
  if (!existing) {
    await createInvitation(db, user.id, { groomName: pria, brideName: wanita, templateKey });
  }
  revalidatePath("/undangan", "layout");
  redirect("/undangan/isi");
}
