import { randomBytes } from "node:crypto";
import { desc, eq } from "drizzle-orm";
import { event, invitation } from "@/db/schema";
import type { AppDb } from "@/db/types";
import { isUniqueViolation } from "@/lib/db-errors";
import { makeSlugBase, slugCandidate } from "@/lib/slug";
import { parseInvitationTitle } from "./title";

export const DEFAULT_EVENTS = [{ key: "utama", name: "Acara utama" }] as const;

const SEQUENTIAL_ATTEMPTS = 10;
const RANDOM_ATTEMPTS = 5;

export type Invitation = typeof invitation.$inferSelect;

export async function getInvitationForOwner(
  db: AppDb,
  ownerId: string,
): Promise<Invitation | null> {
  const [row] = await db
    .select()
    .from(invitation)
    .where(eq(invitation.ownerId, ownerId))
    .orderBy(desc(invitation.createdAt))
    .limit(1);
  return row ?? null;
}

export type CreateInvitationInput = { title: string; templateKey?: string };

export async function createInvitation(
  db: AppDb,
  ownerId: string,
  input: CreateInvitationInput,
): Promise<Invitation> {
  const parsed = parseInvitationTitle(input.title);
  if (!parsed.ok) throw new Error(parsed.error);
  const base = makeSlugBase(parsed.title);

  for (let attempt = 0; attempt < SEQUENTIAL_ATTEMPTS + RANDOM_ATTEMPTS; attempt++) {
    const slug =
      attempt < SEQUENTIAL_ATTEMPTS
        ? slugCandidate(base, attempt)
        : `${base}-${randomBytes(3).toString("hex")}`;
    try {
      return await db.transaction(async (tx) => {
        const [created] = await tx
          .insert(invitation)
          .values({
            ownerId,
            slug,
            title: parsed.title,
            ...(input.templateKey ? { templateKey: input.templateKey } : {}),
          })
          .returning();
        await tx.insert(event).values(
          DEFAULT_EVENTS.map((e, index) => ({
            invitationId: created.id,
            key: e.key,
            name: e.name,
            sortOrder: index,
          })),
        );
        return created;
      });
    } catch (error) {
      if (isUniqueViolation(error, "invitation_slug_unique")) continue;
      throw error;
    }
  }
  throw new Error("Tidak bisa membuat slug unik untuk undangan ini.");
}

export async function setInvitationTemplate(
  db: AppDb,
  invitationId: string,
  templateKey: string,
): Promise<boolean> {
  const rows = await db
    .update(invitation)
    .set({ templateKey, updatedAt: new Date() })
    .where(eq(invitation.id, invitationId))
    .returning({ id: invitation.id });
  return rows.length > 0;
}
