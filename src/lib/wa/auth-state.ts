import { and, eq, inArray, sql } from "drizzle-orm";
import { BufferJSON, initAuthCreds, proto } from "baileys";
import type { AuthenticationState, SignalDataTypeMap } from "baileys";
import { waAuth } from "@/db/schema";
import type { AppDb } from "@/db/types";

const CREDS_KEY = "creds";
export const DEFAULT_SESSION = "platform";

export type PostgresAuthState = {
  state: AuthenticationState;
  saveCreds: () => Promise<void>;
};

export function serialize(value: unknown): string {
  return JSON.stringify(value, BufferJSON.replacer);
}

export function deserialize<T>(raw: string): T {
  return JSON.parse(raw, BufferJSON.reviver) as T;
}

export async function loadPostgresAuthState(db: AppDb, sessionId: string = DEFAULT_SESSION): Promise<PostgresAuthState> {
  const [stored] = await db
    .select({ value: waAuth.value })
    .from(waAuth)
    .where(and(eq(waAuth.sessionId, sessionId), eq(waAuth.key, CREDS_KEY)));
  const creds = stored ? deserialize<AuthenticationState["creds"]>(stored.value) : initAuthCreds();

  return {
    state: {
      creds,
      keys: {
        get: async <T extends keyof SignalDataTypeMap>(type: T, ids: string[]) => {
          const data: { [id: string]: SignalDataTypeMap[T] } = {};
          if (ids.length === 0) return data;
          const keys = ids.map((id) => `${type}-${id}`);
          const rows = await db
            .select({ key: waAuth.key, value: waAuth.value })
            .from(waAuth)
            .where(and(eq(waAuth.sessionId, sessionId), inArray(waAuth.key, keys)));
          const found = new Map(rows.map((row) => [row.key, row.value]));
          for (const id of ids) {
            const raw = found.get(`${type}-${id}`);
            if (raw === undefined) continue;
            let value = deserialize<SignalDataTypeMap[T]>(raw);
            if (type === "app-state-sync-key") {
              value = proto.Message.AppStateSyncKeyData.fromObject(
                value as object,
              ) as unknown as SignalDataTypeMap[T];
            }
            data[id] = value;
          }
          return data;
        },
        set: async (data) => {
          const upserts: { key: string; value: string }[] = [];
          const removals: string[] = [];
          for (const category of Object.keys(data) as (keyof SignalDataTypeMap)[]) {
            const entries = data[category] ?? {};
            for (const id of Object.keys(entries)) {
              const value = entries[id];
              const key = `${category}-${id}`;
              if (value) upserts.push({ key, value: serialize(value) });
              else removals.push(key);
            }
          }
          if (upserts.length === 0 && removals.length === 0) return;
          await db.transaction(async (tx) => {
            for (let i = 0; i < upserts.length; i += 200) {
              await tx
                .insert(waAuth)
                .values(upserts.slice(i, i + 200).map((row) => ({ ...row, sessionId })))
                .onConflictDoUpdate({
                  target: [waAuth.sessionId, waAuth.key],
                  set: { value: sql`excluded.value` },
                });
            }
            for (let i = 0; i < removals.length; i += 200) {
              await tx.delete(waAuth).where(and(eq(waAuth.sessionId, sessionId), inArray(waAuth.key, removals.slice(i, i + 200))));
            }
          });
        },
      },
    },
    saveCreds: async () => {
      const value = serialize(creds);
      await db
        .insert(waAuth)
        .values({ sessionId, key: CREDS_KEY, value })
        .onConflictDoUpdate({ target: [waAuth.sessionId, waAuth.key], set: { value } });
    },
  };
}

export async function hasStoredSession(db: AppDb, sessionId: string = DEFAULT_SESSION): Promise<boolean> {
  const [stored] = await db
    .select({ value: waAuth.value })
    .from(waAuth)
    .where(and(eq(waAuth.sessionId, sessionId), eq(waAuth.key, CREDS_KEY)));
  if (!stored) return false;
  const creds = deserialize<{ registered?: boolean; me?: unknown }>(stored.value);
  return Boolean(creds.registered || creds.me);
}

export async function clearStoredSession(db: AppDb, sessionId: string = DEFAULT_SESSION): Promise<void> {
  await db.delete(waAuth).where(eq(waAuth.sessionId, sessionId));
}
