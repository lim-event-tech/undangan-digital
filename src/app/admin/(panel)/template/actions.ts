"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { recordAudit } from "@/lib/admin/audit";
import { requireAdmin } from "@/lib/admin/guard";
import { isRibbon, listTemplateCatalog, moveTemplate, updateTemplate } from "@/lib/platform/templates";

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export async function simpanTemplateAction(formData: FormData): Promise<void> {
  const key = field(formData, "kunci");
  const admin = await requireAdmin("template");

  const before = (await listTemplateCatalog(db)).find((item) => item.key === key);
  if (!before) return;
  const ribbonText = field(formData, "pita");
  const next = {
    label: field(formData, "label"),
    visible: formData.get("tampil") !== null,
    ribbon: isRibbon(ribbonText) ? ribbonText : null,
  };
  const result = await updateTemplate(db, key, next);
  if (!result.ok) return;

  const changes: string[] = [];
  if (before.visible !== next.visible) changes.push(next.visible ? "ditampilkan" : "disembunyikan");
  if (before.label !== next.label.trim()) changes.push(`label ${before.label} menjadi ${next.label.trim()}`);
  if ((before.ribbon ?? "") !== (next.ribbon ?? "")) {
    changes.push(`pita ${before.ribbon ?? "tanpa"} menjadi ${next.ribbon ?? "tanpa"}`);
  }
  if (changes.length > 0) {
    await recordAudit(db, {
      actor: admin,
      category: "template",
      action: "Mengatur katalog template",
      target: `templates/${key}`,
      detail: changes.join("; "),
    });
  }
  revalidatePath("/admin/template");
}

export async function geserTemplateAction(formData: FormData): Promise<void> {
  const key = field(formData, "kunci");
  const arah = field(formData, "arah");
  if (arah !== "naik" && arah !== "turun") return;
  const admin = await requireAdmin("template");

  if (await moveTemplate(db, key, arah)) {
    await recordAudit(db, {
      actor: admin,
      category: "template",
      action: "Mengubah urutan template",
      target: `templates/${key}`,
      detail: arah === "naik" ? "Naik satu urutan" : "Turun satu urutan",
    });
    revalidatePath("/admin/template");
  }
}
