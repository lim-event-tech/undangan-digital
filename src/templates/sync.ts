import { templateRegistry } from "@/db/schema";
import type { AppDb } from "@/db/types";
import { TEMPLATES } from "./registry";

export async function syncTemplates(
  db: AppDb,
  options: { show?: boolean } = {},
): Promise<number> {
  const show = options.show ?? false;
  for (const [index, template] of TEMPLATES.entries()) {
    await db
      .insert(templateRegistry)
      .values({
        key: template.key,
        label: template.label,
        sortOrder: index,
        visible: show,
      })
      .onConflictDoUpdate({
        target: templateRegistry.key,
        set: {
          label: template.label,
          sortOrder: index,
          ...(show ? { visible: true } : {}),
        },
      });
  }
  return TEMPLATES.length;
}
