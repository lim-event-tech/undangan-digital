import { asc, eq } from "drizzle-orm";
import { user, waSession } from "@/db/schema";
import type { AppDb } from "@/db/types";

export async function saveSessionState(db: AppDb, userId: string, patch: { sambungOtomatis?: boolean; nomor?: string | null }): Promise<void> {
  const values = { userId, ...patch };
  await db
    .insert(waSession)
    .values({ sambungOtomatis: false, ...values })
    .onConflictDoUpdate({ target: waSession.userId, set: patch });
}

export async function listAutoConnectUsers(db: AppDb): Promise<string[]> {
  const rows = await db.select({ userId: waSession.userId }).from(waSession).where(eq(waSession.sambungOtomatis, true));
  return rows.map((row) => row.userId);
}

export type SessionRow = { userId: string; name: string; email: string; nomor: string | null; sambungOtomatis: boolean };

export async function listSessionRows(db: AppDb): Promise<SessionRow[]> {
  return db
    .select({ userId: waSession.userId, name: user.name, email: user.email, nomor: waSession.nomor, sambungOtomatis: waSession.sambungOtomatis })
    .from(waSession)
    .innerJoin(user, eq(user.id, waSession.userId))
    .orderBy(asc(user.name));
}
