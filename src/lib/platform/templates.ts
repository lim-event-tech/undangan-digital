import { asc, eq, sql } from "drizzle-orm";
import { invitation, templateRegistry } from "@/db/schema";
import type { AppDb } from "@/db/types";
import { DEFAULT_TEMPLATE, isTemplateKey, namaTemplate, templateInfo, type TemplateKey } from "@/templates/registry";

export const RIBBONS = ["Baru", "Populer", "Unggulan"] as const;
export type Ribbon = (typeof RIBBONS)[number];

export function isRibbon(value: unknown): value is Ribbon {
  return typeof value === "string" && (RIBBONS as readonly string[]).includes(value);
}

export const TEMPLATE_LABEL_MAX = 40;

export type CatalogEntry = {
  key: string;
  label: string;
  visible: boolean;
  sortOrder: number;
  ribbon: Ribbon | null;
  used: number;
  published: number;
};

export async function listTemplateCatalog(db: AppDb): Promise<CatalogEntry[]> {
  const rows = await db
    .select({
      key: templateRegistry.key,
      label: templateRegistry.label,
      visible: templateRegistry.visible,
      sortOrder: templateRegistry.sortOrder,
      ribbon: templateRegistry.ribbon,
      used: sql<number>`(select count(*)::int from ${invitation} where ${invitation.templateKey} = ${templateRegistry.key})`,
      published: sql<number>`(select count(*)::int from ${invitation} where ${invitation.templateKey} = ${templateRegistry.key} and ${invitation.status} = 'terbit')`,
    })
    .from(templateRegistry)
    .orderBy(asc(templateRegistry.sortOrder), asc(templateRegistry.key));
  return rows.map(row => ({ ...row, label: namaTemplate(row.key, row.label) }));
}

export type UpdateTemplateResult = { ok: true } | { ok: false; error: "label" | "tidak-ada" };

export async function updateTemplate(
  db: AppDb,
  key: string,
  input: { label: string; visible: boolean; ribbon: Ribbon | null },
): Promise<UpdateTemplateResult> {
  const label = input.label.replace(/\s+/g, " ").trim();
  if (!label || label.length > TEMPLATE_LABEL_MAX) return { ok: false, error: "label" };
  const rows = await db
    .update(templateRegistry)
    .set({ label, visible: input.visible, ribbon: input.ribbon })
    .where(eq(templateRegistry.key, key))
    .returning({ key: templateRegistry.key });
  return rows.length > 0 ? { ok: true } : { ok: false, error: "tidak-ada" };
}

export async function moveTemplate(
  db: AppDb,
  key: string,
  direction: "naik" | "turun",
): Promise<boolean> {
  return db.transaction(async (tx) => {
    const rows = await tx
      .select({ key: templateRegistry.key })
      .from(templateRegistry)
      .orderBy(asc(templateRegistry.sortOrder), asc(templateRegistry.key));
    const index = rows.findIndex((row) => row.key === key);
    const target = direction === "naik" ? index - 1 : index + 1;
    if (index < 0 || target < 0 || target >= rows.length) return false;

    const order = rows.map((row) => row.key);
    [order[index], order[target]] = [order[target], order[index]];
    for (const [position, templateKey] of order.entries()) {
      await tx
        .update(templateRegistry)
        .set({ sortOrder: position })
        .where(eq(templateRegistry.key, templateKey));
    }
    return true;
  });
}

export async function listVisibleTemplates(db: AppDb) {
  const rows = await db
    .select({
      key: templateRegistry.key,
      label: templateRegistry.label,
      ribbon: templateRegistry.ribbon,
    })
    .from(templateRegistry)
    .where(eq(templateRegistry.visible, true))
    .orderBy(asc(templateRegistry.sortOrder), asc(templateRegistry.key));
  return rows.map(row => ({ ...row, label: namaTemplate(row.key, row.label) }));
}

export type PilihanKatalog = { key: TemplateKey; label: string; ribbon: string | null };

export async function listSelectableTemplates(
  db: AppDb,
  currentKey?: string | null,
): Promise<PilihanKatalog[]> {
  const [visible, all] = await Promise.all([
    listVisibleTemplates(db),
    db.select({ key: templateRegistry.key, label: templateRegistry.label }).from(templateRegistry),
  ]);
  const result: PilihanKatalog[] = [];
  for (const row of visible) {
    if (isTemplateKey(row.key)) result.push({ key: row.key, label: row.label, ribbon: row.ribbon });
  }
  if (currentKey && isTemplateKey(currentKey) && !result.some((t) => t.key === currentKey)) {
    const label = namaTemplate(currentKey, all.find((t) => t.key === currentKey)?.label);
    result.unshift({ key: currentKey, label, ribbon: null });
  }
  if (result.length === 0) {
    result.push({ key: DEFAULT_TEMPLATE, label: templateInfo(DEFAULT_TEMPLATE).label, ribbon: null });
  }
  return result;
}

export async function canUseTemplate(
  db: AppDb,
  key: unknown,
  currentKey?: string | null,
): Promise<boolean> {
  if (!isTemplateKey(key)) return false;
  const options = await listSelectableTemplates(db, currentKey);
  return options.some((t) => t.key === key);
}
