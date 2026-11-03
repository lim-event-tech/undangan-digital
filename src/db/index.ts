import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as { pgPool?: Pool };

function createPool() {
  const connectionString = process.env.DATABASE_URL;
  const isBuild = process.env.NEXT_PHASE === "phase-production-build";
  if (!connectionString && !isBuild) {
    throw new Error(
      "DATABASE_URL belum diatur. Salin .env.example menjadi .env, lalu jalankan `npm run db:up`.",
    );
  }
  return new Pool({ connectionString, max: 10 });
}

const pool = globalForDb.pgPool ?? createPool();
if (process.env.NODE_ENV !== "production") globalForDb.pgPool = pool;

export const db = drizzle(pool, { schema, casing: "snake_case" });
export { schema };
