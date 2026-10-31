import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import * as schema from "@/db/schema";

export async function createTestDb() {
  const client = new PGlite();
  const db = drizzle(client, { schema, casing: "snake_case" });
  await migrate(db, {
    migrationsFolder: path.resolve(process.cwd(), "drizzle"),
  });
  return db;
}

export type TestDb = Awaited<ReturnType<typeof createTestDb>>;

let counter = 0;

export async function seedInvitation(
  db: TestDb,
  names?: { groom: string; bride: string },
) {
  const { user } = schema;
  const { createInvitation } = await import("@/lib/invitations/service");
  counter += 1;
  const ownerId = `user-${counter}`;
  const chosen = names ?? { groom: `Mempelai${counter}a`, bride: `Mempelai${counter}b` };
  await db.insert(user).values({
    id: ownerId,
    name: `Pemilik ${counter}`,
    email: `pemilik${counter}@example.com`,
  });
  const invitation = await createInvitation(db, ownerId, {
    groomName: chosen.groom,
    brideName: chosen.bride,
  });
  return { ownerId, invitation };
}
