import { asc, eq, sql } from "drizzle-orm";
import { adminRole, user } from "@/db/schema";
import type { AppDb } from "@/db/types";
import {
  PERMISSIONS,
  ROLE_LABEL_MAX,
  SUPER_ROLE,
  normalizePermissions,
  roleKeyFromLabel,
  type Permission,
  type RoleInfo,
} from "./roles";

function permissionsOf(key: string, stored: string[]): Permission[] {
  return key === SUPER_ROLE ? [...PERMISSIONS] : normalizePermissions(stored);
}

export async function listRoles(db: AppDb): Promise<RoleInfo[]> {
  const rows = await db
    .select({
      key: adminRole.key,
      label: adminRole.label,
      permissions: adminRole.permissions,
      members: sql<number>`(select count(*)::int from ${user} where ${user.adminRole} = ${adminRole.key})`,
    })
    .from(adminRole)
    .orderBy(asc(adminRole.sortOrder), asc(adminRole.createdAt), asc(adminRole.key));
  return rows.map((row) => ({
    key: row.key,
    label: row.label,
    permissions: permissionsOf(row.key, row.permissions),
    members: row.members,
  }));
}

export async function getRolePermissions(db: AppDb, key: string): Promise<Permission[] | null> {
  const [row] = await db
    .select({ permissions: adminRole.permissions })
    .from(adminRole)
    .where(eq(adminRole.key, key));
  return row ? permissionsOf(key, row.permissions) : null;
}

export async function getRoleLabel(db: AppDb, key: string): Promise<string | null> {
  const [row] = await db.select({ label: adminRole.label }).from(adminRole).where(eq(adminRole.key, key));
  return row?.label ?? null;
}

export function cleanRoleLabel(label: string): string {
  return label.replace(/\s+/g, " ").trim();
}

export type SaveRoleResult =
  | { ok: true; key: string }
  | { ok: false; error: "label" | "label-dipakai" | "tidak-ada" | "super" };

export async function createRole(
  db: AppDb,
  input: { label: string; permissions: Iterable<unknown> },
): Promise<SaveRoleResult> {
  const label = cleanRoleLabel(input.label);
  if (!label || label.length > ROLE_LABEL_MAX) return { ok: false, error: "label" };

  const existing = await db.select({ key: adminRole.key, label: adminRole.label }).from(adminRole);
  if (existing.some((row) => row.label.toLowerCase() === label.toLowerCase())) {
    return { ok: false, error: "label-dipakai" };
  }

  const taken = new Set(existing.map((row) => row.key));
  const base = roleKeyFromLabel(label);
  let key = base === SUPER_ROLE ? `${base}-2` : base;
  for (let n = 2; taken.has(key); n += 1) key = `${base}-${n}`;

  const [last] = await db.select({ top: sql<number>`coalesce(max(${adminRole.sortOrder}), 0)::int` }).from(adminRole);
  await db.insert(adminRole).values({
    key,
    label,
    permissions: normalizePermissions(input.permissions),
    sortOrder: (last?.top ?? 0) + 1,
  });
  return { ok: true, key };
}

export async function updateRole(
  db: AppDb,
  key: string,
  input: { label: string; permissions: Iterable<unknown> },
): Promise<SaveRoleResult> {
  if (key === SUPER_ROLE) return { ok: false, error: "super" };
  const label = cleanRoleLabel(input.label);
  if (!label || label.length > ROLE_LABEL_MAX) return { ok: false, error: "label" };

  const rows = await db.select({ key: adminRole.key, label: adminRole.label }).from(adminRole);
  if (!rows.some((row) => row.key === key)) return { ok: false, error: "tidak-ada" };
  if (rows.some((row) => row.key !== key && row.label.toLowerCase() === label.toLowerCase())) {
    return { ok: false, error: "label-dipakai" };
  }

  await db
    .update(adminRole)
    .set({ label, permissions: normalizePermissions(input.permissions) })
    .where(eq(adminRole.key, key));
  return { ok: true, key };
}

export type DeleteRoleResult = { ok: true } | { ok: false; error: "tidak-ada" | "super" | "dipakai" };

export async function deleteRole(db: AppDb, key: string): Promise<DeleteRoleResult> {
  if (key === SUPER_ROLE) return { ok: false, error: "super" };
  const [row] = await db.select({ key: adminRole.key }).from(adminRole).where(eq(adminRole.key, key));
  if (!row) return { ok: false, error: "tidak-ada" };
  const [used] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(user)
    .where(eq(user.adminRole, key));
  if ((used?.total ?? 0) > 0) return { ok: false, error: "dipakai" };
  await db.delete(adminRole).where(eq(adminRole.key, key));
  return { ok: true };
}
