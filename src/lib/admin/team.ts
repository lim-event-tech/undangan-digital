import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { and, asc, eq, isNotNull, max, sql } from "drizzle-orm";
import { account, adminRole, session, user } from "@/db/schema";
import type { AppDb } from "@/db/types";
import { MAX_PASSWORD_LENGTH } from "@/lib/auth-options-constants";
import { SUPER_ROLE } from "./roles";
import { ADMIN_MIN_PASSWORD } from "./team-constants";

export type AdminMember = {
  id: string;
  name: string;
  email: string;
  role: string;
  roleLabel: string;
  methods: string[];
  status: "aktif" | "diblokir";
  lastActive: Date | null;
  createdAt: Date;
};

export async function listAdmins(db: AppDb): Promise<AdminMember[]> {
  const rows = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.adminRole,
      roleLabel: adminRole.label,
      status: user.status,
      providers: sql<string[]>`coalesce((select array_agg(account.provider_id) from account where account.user_id = ${user.id}), '{}')`,
      lastActive: max(session.updatedAt),
      createdAt: user.createdAt,
    })
    .from(user)
    .innerJoin(adminRole, eq(adminRole.key, user.adminRole))
    .leftJoin(session, eq(session.userId, user.id))
    .where(isNotNull(user.adminRole))
    .groupBy(user.id, adminRole.label)
    .orderBy(asc(user.createdAt), asc(user.id));
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role as string,
    roleLabel: row.roleLabel,
    methods: [...new Set(row.providers.map((p) => (p === "credential" ? "Kata sandi" : "Google")))],
    status: row.status,
    lastActive: row.lastActive,
    createdAt: row.createdAt,
  }));
}

export function checkAdminPassword(password: string): string | null {
  if (password.length < ADMIN_MIN_PASSWORD) {
    return `Kata sandi admin minimal ${ADMIN_MIN_PASSWORD} karakter`;
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    return `Kata sandi maksimal ${MAX_PASSWORD_LENGTH} karakter`;
  }
  return null;
}

export type CreateAdminResult =
  | { ok: true; id: string }
  | {
      ok: false;
      error: "email-dipakai" | "email-pasangan" | "email-tidak-valid" | "nama-kosong" | "sandi" | "peran";
      message?: string;
    };

export async function createAdmin(
  db: AppDb,
  input: { name: string; email: string; password?: string; role: string },
): Promise<CreateAdminResult> {
  const name = input.name.replace(/\s+/g, " ").trim();
  const email = input.email.trim().toLowerCase();
  if (!name) return { ok: false, error: "nama-kosong" };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return { ok: false, error: "email-tidak-valid" };
  }
  const password = input.password ?? "";
  if (password) {
    const weak = checkAdminPassword(password);
    if (weak) return { ok: false, error: "sandi", message: weak };
  }

  const [roleRow] = await db.select({ key: adminRole.key }).from(adminRole).where(eq(adminRole.key, input.role));
  if (!roleRow) return { ok: false, error: "peran" };

  const [existing] = await db
    .select({ id: user.id, role: user.adminRole })
    .from(user)
    .where(eq(user.email, email));
  if (existing) return { ok: false, error: existing.role ? "email-dipakai" : "email-pasangan" };

  const id = randomUUID();
  const hash = password ? await hashPassword(password) : null;
  await db.transaction(async (tx) => {
    await tx.insert(user).values({
      id,
      name: name.slice(0, 80),
      email,
      emailVerified: true,
      status: "aktif",
      adminRole: input.role,
    });
    if (hash) {
      await tx.insert(account).values({
        id: randomUUID(),
        accountId: id,
        providerId: "credential",
        userId: id,
        password: hash,
      });
    }
  });
  return { ok: true, id };
}

async function superCount(db: AppDb): Promise<number> {
  const [row] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(user)
    .where(and(eq(user.adminRole, SUPER_ROLE), eq(user.status, "aktif")));
  return row?.total ?? 0;
}

export type ChangeRoleResult = { ok: true } | { ok: false; error: "tidak-ada" | "super-terakhir" | "peran" };

export async function changeAdminRole(
  db: AppDb,
  userId: string,
  role: string,
): Promise<ChangeRoleResult> {
  const [roleRow] = await db.select({ key: adminRole.key }).from(adminRole).where(eq(adminRole.key, role));
  if (!roleRow) return { ok: false, error: "peran" };
  const [target] = await db
    .select({ role: user.adminRole })
    .from(user)
    .where(and(eq(user.id, userId), isNotNull(user.adminRole)));
  if (!target) return { ok: false, error: "tidak-ada" };
  if (target.role === SUPER_ROLE && role !== SUPER_ROLE && (await superCount(db)) <= 1) {
    return { ok: false, error: "super-terakhir" };
  }
  await db.update(user).set({ adminRole: role }).where(eq(user.id, userId));
  return { ok: true };
}

export async function removeAdmin(db: AppDb, userId: string): Promise<ChangeRoleResult> {
  const [target] = await db
    .select({ role: user.adminRole })
    .from(user)
    .where(and(eq(user.id, userId), isNotNull(user.adminRole)));
  if (!target) return { ok: false, error: "tidak-ada" };
  if (target.role === SUPER_ROLE && (await superCount(db)) <= 1) {
    return { ok: false, error: "super-terakhir" };
  }
  await db.delete(user).where(eq(user.id, userId));
  return { ok: true };
}

export async function resetAdminPassword(
  db: AppDb,
  userId: string,
  password: string,
): Promise<{ ok: true; created: boolean } | { ok: false; error: "tidak-ada" | "sandi"; message?: string }> {
  const weak = checkAdminPassword(password);
  if (weak) return { ok: false, error: "sandi", message: weak };
  const [target] = await db.select({ id: user.id }).from(user).where(eq(user.id, userId));
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
