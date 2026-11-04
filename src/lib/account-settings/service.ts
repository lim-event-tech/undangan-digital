import { verifyPassword } from "better-auth/crypto";
import { and, eq, gt, isNull, ne, sql } from "drizzle-orm";
import { account, session, user } from "@/db/schema";
import type { AppDb } from "@/db/types";
import { parseAccountEmail } from "@/lib/account-settings/shared";
import { SAVED, type SaveResult } from "@/lib/save-result";

export async function getAccountMethods(db: AppDb, userId: string) {
  const rows = await db.select({
    provider: account.providerId,
    passwordSet: sql<boolean>`${account.password} is not null`,
  }).from(account).where(eq(account.userId, userId));
  return {
    hasPassword: rows.some((row) => row.provider === "credential" && row.passwordSet),
    googleConnected: rows.some((row) => row.provider === "google"),
  };
}

export async function changeOwnEmail(
  db: AppDb,
  identity: { userId: string; sessionId: string },
  formData: FormData,
): Promise<SaveResult> {
  const parsed = parseAccountEmail(formData);
  if (!parsed.ok) return parsed;
  try {
    return await db.transaction(async (tx): Promise<SaveResult> => {
      const [current] = await tx.select({ email: user.email }).from(user)
        .innerJoin(session, eq(session.userId, user.id))
        .where(and(
          eq(user.id, identity.userId),
          eq(session.id, identity.sessionId),
          gt(session.expiresAt, new Date()),
          eq(user.status, "aktif"),
          isNull(user.adminRole),
        )).for("update");
      if (!current) return { ok: false, formError: "Sesi tidak valid. Silakan masuk kembali." };
      const [credential] = await tx.select({ password: account.password }).from(account)
        .where(and(eq(account.userId, identity.userId), eq(account.providerId, "credential"))).for("update");
      if (!credential?.password) return { ok: false, formError: "Buat kata sandi terlebih dahulu sebelum mengubah email." };
      if (!(await verifyPassword({ hash: credential.password, password: parsed.password }))) {
        return { ok: false, errors: { password: "Kata sandi saat ini salah." } };
      }
      if (parsed.email === current.email) return { ok: false, errors: { email: "Email baru harus berbeda dari email saat ini." } };
      const [taken] = await tx.select({ id: user.id }).from(user).where(eq(user.email, parsed.email));
      if (taken) return { ok: false, errors: { email: "Email ini sudah digunakan oleh akun lain." } };
      await tx.update(user).set({ email: parsed.email, emailVerified: false }).where(eq(user.id, identity.userId));
      await tx.delete(session).where(and(eq(session.userId, identity.userId), ne(session.id, identity.sessionId)));
      return SAVED;
    });
  } catch (error) {
    const cause = (error as { cause?: { code?: string }; code?: string });
    if ((cause.cause?.code ?? cause.code) === "23505") {
      return { ok: false, errors: { email: "Email ini sudah digunakan oleh akun lain." } };
    }
    throw error;
  }
}
