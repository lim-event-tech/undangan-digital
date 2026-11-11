"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { recordAudit } from "@/lib/admin/audit";
import { requireAdmin } from "@/lib/admin/guard";
import { SAVED, type SaveResult } from "@/lib/save-result";
import { describeWaChanges, parseWaForm } from "@/lib/wa/config";
import { getWaConfig, saveWaConfig } from "@/lib/wa/config-service";
import { getWaManager } from "@/lib/wa/manager";

const PATH = "/admin/whatsapp";

export async function putuskanPenggunaAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin("pengaturan");
  const userId = formData.get("userId");
  if (typeof userId !== "string" || !userId) return;
  await getWaManager().for(userId).disconnect();
  await recordAudit(db, {
    actor: admin,
    category: "pengaturan",
    action: "Memutus sambungan WhatsApp pengguna",
    target: "WhatsApp",
    detail: userId,
  });
  revalidatePath(PATH);
}

export async function keluarkanPenggunaAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin("pengaturan");
  const userId = formData.get("userId");
  if (typeof userId !== "string" || !userId) return;
  await getWaManager().for(userId).logout();
  await recordAudit(db, {
    actor: admin,
    category: "pengaturan",
    action: "Mengeluarkan perangkat WhatsApp pengguna",
    target: "WhatsApp",
    detail: userId,
  });
  revalidatePath(PATH);
}

export async function simpanWaAction(
  _state: SaveResult | null,
  formData: FormData,
): Promise<SaveResult> {
  const admin = await requireAdmin("pengaturan");
  const parsed = parseWaForm(formData);
  if (!parsed.ok) return { ok: false, errors: parsed.errors };

  const before = await getWaConfig(db);
  const after = await saveWaConfig(db, parsed.input);
  const changes = describeWaChanges(before, after);
  if (changes.length > 0) {
    await recordAudit(db, {
      actor: admin,
      category: "pengaturan",
      action: "Mengubah pengaturan WhatsApp",
      target: "WhatsApp",
      detail: changes.join("; "),
    });
  }
  revalidatePath(PATH);
  return SAVED;
}
