import { eq } from "drizzle-orm";
import { platformSetting } from "@/db/schema";
import type { AppDb } from "@/db/types";
import { readWabaConfig, type WabaConfig } from "./config";

const KEY = "waba_gateway";

export async function getWabaConfig(db: AppDb): Promise<WabaConfig> {
  const [row] = await db
    .select({ value: platformSetting.value })
    .from(platformSetting)
    .where(eq(platformSetting.key, KEY));
  return readWabaConfig(row?.value);
}

export async function saveWabaConfig(
  db: AppDb,
  patch: Partial<WabaConfig>,
): Promise<WabaConfig> {
  const current = await getWabaConfig(db);
  const next = readWabaConfig({ ...current, ...patch });
  await db
    .insert(platformSetting)
    .values({ key: KEY, value: next })
    .onConflictDoUpdate({ target: platformSetting.key, set: { value: next } });
  return next;
}

