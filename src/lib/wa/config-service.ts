import { eq } from "drizzle-orm";
import { platformSetting } from "@/db/schema";
import type { AppDb } from "@/db/types";
import { readWaConfig, type WaConfig } from "./config";

const KEY = "whatsapp";

export async function getWaConfig(db: AppDb): Promise<WaConfig> {
  const [row] = await db
    .select({ value: platformSetting.value })
    .from(platformSetting)
    .where(eq(platformSetting.key, KEY));
  return readWaConfig(row?.value);
}

export async function saveWaConfig(db: AppDb, patch: Partial<WaConfig>): Promise<WaConfig> {
  const next = readWaConfig({ ...(await getWaConfig(db)), ...patch });
  await db
    .insert(platformSetting)
    .values({ key: KEY, value: next })
    .onConflictDoUpdate({ target: platformSetting.key, set: { value: next } });
  return next;
}
