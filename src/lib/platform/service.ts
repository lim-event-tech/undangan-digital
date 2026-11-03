import { inArray } from "drizzle-orm";
import { platformSetting } from "@/db/schema";
import type { AppDb } from "@/db/types";
import { readSettings, type PlatformSettings } from "./settings";

const KEYS = ["daftarTerbuka", "pengumuman", "pemeliharaan", "slugCadangan", "pesanWaBawaan"] as const;

export async function getSettings(db: AppDb): Promise<PlatformSettings> {
  const rows = await db
    .select({ key: platformSetting.key, value: platformSetting.value })
    .from(platformSetting)
    .where(inArray(platformSetting.key, [...KEYS]));
  return readSettings(Object.fromEntries(rows.map((row) => [row.key, row.value])));
}

export async function saveSettings(
  db: AppDb,
  patch: Partial<PlatformSettings>,
): Promise<PlatformSettings> {
  const entries = Object.entries(patch).filter(([key]) => (KEYS as readonly string[]).includes(key));
  await db.transaction(async (tx) => {
    for (const [key, value] of entries) {
      await tx
        .insert(platformSetting)
        .values({ key, value })
        .onConflictDoUpdate({ target: platformSetting.key, set: { value } });
    }
  });
  return getSettings(db);
}
