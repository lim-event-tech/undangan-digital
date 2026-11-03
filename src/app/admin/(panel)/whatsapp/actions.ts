"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { recordAudit } from "@/lib/admin/audit";
import { requireAdmin } from "@/lib/admin/guard";
import { normalizePhone } from "@/lib/phone";
import { SAVED, type SaveResult } from "@/lib/save-result";
import { describeWaChanges, parseWaForm } from "@/lib/wa/config";
import { getWaConfig, saveWaConfig } from "@/lib/wa/config-service";
import { getWaManager } from "@/lib/wa/manager";

const PATH = "/admin/whatsapp";

export async function hubungkanAction(): Promise<void> {
  const admin = await requireAdmin("pengaturan");
  await getWaManager().connect();
  await recordAudit(db, {
    actor: admin,
    category: "pengaturan",
    action: "Menyambungkan WhatsApp",
    target: "WhatsApp",
  });
  revalidatePath(PATH);
}

export async function putuskanAction(): Promise<void> {
  const admin = await requireAdmin("pengaturan");
  await getWaManager().disconnect();
  await recordAudit(db, {
    actor: admin,
    category: "pengaturan",
    action: "Memutus sambungan WhatsApp",
    target: "WhatsApp",
  });
  revalidatePath(PATH);
}

export async function keluarkanAction(): Promise<void> {
  const admin = await requireAdmin("pengaturan");
  await getWaManager().logout();
  await recordAudit(db, {
    actor: admin,
    category: "pengaturan",
    action: "Mengeluarkan perangkat WhatsApp",
    target: "WhatsApp",
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

export type UjiResult = { ok: true } | { ok: false; error: string } | null;

export async function ujiKirimAction(_state: UjiResult, formData: FormData): Promise<UjiResult> {
  const admin = await requireAdmin("pengaturan");
  const raw = formData.get("nomor");
  const phone = normalizePhone(typeof raw === "string" ? raw : "");
  if (!phone.ok) return { ok: false, error: phone.error };

  const manager = getWaManager();
  if (!manager.ready()) return { ok: false, error: "WhatsApp belum terhubung." };

  const outcome = await manager.send(
    phone.value,
    "Pesan uji dari UndanganDigital. Jika Anda menerima ini, pengiriman WhatsApp sudah berfungsi.",
  );
  await recordAudit(db, {
    actor: admin,
    category: "pengaturan",
    action: "Mengirim pesan uji WhatsApp",
    target: "WhatsApp",
    detail: outcome.ok ? "Berhasil" : outcome.error,
  });
  return outcome;
}
