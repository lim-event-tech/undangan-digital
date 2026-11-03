import { and, desc, eq, gte } from "drizzle-orm";
import { auditLog } from "@/db/schema";
import type { AppDb } from "@/db/types";
import { formatStamp } from "@/lib/datetime";
import { toCsv, type Rows } from "@/lib/export/table";

export const AUDIT_CATEGORIES = [
  "akun",
  "undangan",
  "template",
  "pengaturan",
  "tim",
  "sistem",
] as const;

export type AuditCategory = (typeof AUDIT_CATEGORIES)[number];

export const AUDIT_CATEGORY_LABEL: Record<string, string> = {
  moderasi: "Moderasi",
  akun: "Akun",
  undangan: "Undangan",
  template: "Template",
  pengaturan: "Pengaturan",
  tim: "Tim",
  sistem: "Sistem",
};

export function isAuditCategory(value: unknown): value is AuditCategory {
  return typeof value === "string" && (AUDIT_CATEGORIES as readonly string[]).includes(value);
}

export type Actor = { id: string | null; name: string };

export const SYSTEM_ACTOR: Actor = { id: null, name: "Sistem" };

export type AuditEntry = {
  id: string;
  actorId: string | null;
  actorName: string;
  category: AuditCategory;
  action: string;
  target: string;
  detail: string;
  createdAt: Date;
};

export async function recordAudit(
  db: AppDb,
  entry: {
    actor: Actor;
    category: AuditCategory;
    action: string;
    target?: string;
    detail?: string;
    now?: Date;
  },
): Promise<void> {
  await db.insert(auditLog).values({
    actorId: entry.actor.id,
    actorName: entry.actor.name,
    category: entry.category,
    action: entry.action.slice(0, 200),
    target: (entry.target ?? "").slice(0, 200),
    detail: (entry.detail ?? "").slice(0, 500),
    ...(entry.now ? { createdAt: entry.now } : {}),
  });
}

export async function listAudit(
  db: AppDb,
  filters: {
    actorName?: string;
    category?: AuditCategory;
    target?: string;
    sinceDays?: number;
    limit?: number;
    now?: Date;
  } = {},
): Promise<AuditEntry[]> {
  const conditions = [];
  if (filters.actorName) conditions.push(eq(auditLog.actorName, filters.actorName));
  if (filters.category) conditions.push(eq(auditLog.category, filters.category));
  if (filters.target) conditions.push(eq(auditLog.target, filters.target));
  if (filters.sinceDays) {
    const since = new Date((filters.now ?? new Date()).getTime() - filters.sinceDays * 86_400_000);
    conditions.push(gte(auditLog.createdAt, since));
  }
  return db
    .select()
    .from(auditLog)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(auditLog.createdAt), desc(auditLog.id))
    .limit(Math.min(filters.limit ?? 200, 5000));
}

export async function listAuditActors(db: AppDb): Promise<string[]> {
  const rows = await db.selectDistinct({ name: auditLog.actorName }).from(auditLog);
  return rows.map((row) => row.name).sort((a, b) => a.localeCompare(b, "id"));
}

export function labelKategori(category: string): string {
  return AUDIT_CATEGORY_LABEL[category] ?? category;
}

export function buildAuditRows(entries: AuditEntry[]): Rows {
  return [
    ["Waktu", "Pelaku", "Jenis", "Tindakan", "Target", "Rincian"],
    ...entries.map((e) => [
      formatStamp(e.createdAt),
      e.actorName,
      labelKategori(e.category),
      e.action,
      e.target,
      e.detail,
    ]),
  ];
}

export function buildAuditCsv(entries: AuditEntry[]): string {
  return toCsv(buildAuditRows(entries));
}
