import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { and, eq, isNull, ne } from "drizzle-orm";
import { account, session, user } from "@/db/schema";
import type { AppDb } from "@/db/types";
import { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from "@/lib/auth-options-constants";

export type UpdateAccountResult =
  | { ok: true; changed: string[] }
  | { ok: false; error: "tidak-ada" | "nama" | "email" | "email-dipakai" };

export async function updateAccountProfile(
  db: AppDb,
  userId: string,
  input: { name: string; email: string },
): Promise<UpdateAccountResult> {
  const name = input.name.replace(/\s+/g, " ").trim();
  const email = input.email.trim().toLowerCase();
  if (!name || name.length > 80) return { ok: false, error: "nama" };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return { ok: false, error: "email" };

  const [current] = await db
    .select({ name: user.name, email: user.email })
    .from(user)
    .where(and(eq(user.id, userId), isNull(user.adminRole)));
  if (!current) return { ok: false, error: "tidak-ada" };

  const [taken] = await db
    .select({ id: user.id })
    .from(user)
    .where(and(eq(user.email, email), ne(user.id, userId)));
  if (taken) return { ok: false, error: "email-dipakai" };

  const changed: string[] = [];
  if (current.name !== name) changed.push("nama");
  if (current.email !== email) changed.push("email");
  if (changed.length > 0) await db.update(user).set({ name, email }).where(eq(user.id, userId));
  return { ok: true, changed };
}

export type SetPasswordResult =
  | { ok: true; created: boolean }
  | { ok: false; error: "tidak-ada" | "sandi"; message?: string };

export async function setAccountPassword(
  db: AppDb,
  userId: string,
  password: string,
): Promise<SetPasswordResult> {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { ok: false, error: "sandi", message: `Kata sandi minimal ${MIN_PASSWORD_LENGTH} karakter` };
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    return { ok: false, error: "sandi", message: `Kata sandi maksimal ${MAX_PASSWORD_LENGTH} karakter` };
  }
  const [target] = await db
    .select({ id: user.id })
    .from(user)
    .where(and(eq(user.id, userId), isNull(user.adminRole)));
  if (!target) return { ok: false, error: "tidak-ada" };

  const hash = await hashPassword(password);
  const updated = await db
    .update(account)
    .set({ password: hash })
    .where(and(eq(account.userId, userId), eq(account.providerId, "credential")))
    .returning({ id: account.id });
  let created = false;
  if (updated.length === 0) {
    await db.insert(account).values({
      id: randomUUID(),
      accountId: userId,
      providerId: "credential",
      userId,
      password: hash,
    });
    created = true;
  }
  await db.delete(session).where(eq(session.userId, userId));
  return { ok: true, created };
}
