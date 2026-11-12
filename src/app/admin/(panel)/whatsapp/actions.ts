"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { recordAudit } from "@/lib/admin/audit";
import { requireAdmin } from "@/lib/admin/guard";
import { SAVED, type SaveResult } from "@/lib/save-result";
import { describeWaChanges, parseWaForm } from "@/lib/wa/config";
import { getWaConfig, saveWaConfig } from "@/lib/wa/config-service";
import { getWaManager } from "@/lib/wa/manager";
import { fetchWabaTemplates, type WabaTemplateItem } from "@/lib/waba/client";
import { getWabaConfig as getDbWabaConfig, saveWabaConfig as saveDbWabaConfig } from "@/lib/waba/config-service";

const PATH = "/admin/whatsapp";

export type UjiWabaState =
  | { ok: true; templates: WabaTemplateItem[] }
  | { ok: false; error: string }
  | null;

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

export async function simpanWabaAction(
  _state: SaveResult | null,
  formData: FormData,
): Promise<SaveResult> {
  const admin = await requireAdmin("pengaturan");
  const aktif = formData.get("aktif") === "1";
  const baseUrl = (formData.get("baseUrl") as string)?.trim() || "";
  const apiKey = (formData.get("apiKey") as string)?.trim() || "";
  const defaultTemplate = (formData.get("defaultTemplate") as string)?.trim() || "";
  const language = (formData.get("language") as string)?.trim() || "id";

  if (aktif && !apiKey) {
    return { ok: false, formError: "API Key WABA wajib diisi untuk mengaktifkan gateway resmi." };
  }

  await saveDbWabaConfig(db, {
    aktif,
    baseUrl,
    apiKey,
    defaultTemplate,
    language,
  });

  await recordAudit(db, {
    actor: admin,
    category: "pengaturan",
    action: "Mengubah pengaturan WABA Gateway",
    target: "WABA Gateway",
    detail: `Status: ${aktif ? "Aktif" : "Nonaktif"}, Template: ${defaultTemplate}`,
  });

  revalidatePath(PATH);
  return SAVED;
}

export async function ujiWabaAction(): Promise<UjiWabaState> {
  await requireAdmin("pengaturan");
  const config = await getDbWabaConfig(db);
  const result = await fetchWabaTemplates(config);
  return result;
}
