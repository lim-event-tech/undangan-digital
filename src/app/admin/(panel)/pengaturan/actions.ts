"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { recordAudit } from "@/lib/admin/audit";
import { requireAdmin } from "@/lib/admin/guard";
import { getSettings, saveSettings } from "@/lib/platform/service";
import { describeSettingChanges, parseSettingsForm } from "@/lib/platform/settings-form";
import { SAVED, type SaveResult } from "@/lib/save-result";

export async function simpanPengaturanAction(
  _state: SaveResult | null,
  formData: FormData,
): Promise<SaveResult> {
  const admin = await requireAdmin("pengaturan");
  const parsed = parseSettingsForm(formData);
  if (!parsed.ok) return { ok: false, errors: parsed.errors };

  const before = await getSettings(db);
  const after = await saveSettings(db, parsed.input);
  const changes = describeSettingChanges(before, after);
  if (changes.length > 0) {
    await recordAudit(db, {
      actor: admin,
      category: "pengaturan",
      action: "Mengubah pengaturan platform",
      target: "Pengaturan platform",
      detail: changes.join("; "),
    });
  }
  revalidatePath("/admin/pengaturan");
  revalidatePath("/undangan", "layout");
  return SAVED;
}
