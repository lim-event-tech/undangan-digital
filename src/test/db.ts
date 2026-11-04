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
  options?: { title: string; extraEvent?: boolean },
) {
  const { user, event } = schema;
  const { createInvitation } = await import("@/lib/invitations/service");
  counter += 1;
  const ownerId = `user-${counter}`;
  await db.insert(user).values({
    id: ownerId,
    name: `Pemilik ${counter}`,
    email: `pemilik${counter}@example.com`,
  });
  const invitation = await createInvitation(db, ownerId, {
    title: options?.title ?? `Event ${counter}`,
  });
  if (options?.extraEvent !== false) {
    await db.insert(event).values({ invitationId: invitation.id, key: "lanjutan", name: "Sesi lanjutan", sortOrder: 1 });
  }
  return { ownerId, invitation };
}
