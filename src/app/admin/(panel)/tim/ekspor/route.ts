import { db } from "@/db";
import { buildAuditRows, isAuditCategory, listAudit } from "@/lib/admin/audit";
import { requireAdmin } from "@/lib/admin/guard";
import { parseFormat, tableResponse } from "@/lib/export/table";

export async function GET(request: Request) {
  await requireAdmin();
  const url = new URL(request.url);
  const kategori = url.searchParams.get("jenis");
  const hari = Number(url.searchParams.get("hari"));

  const entries = await listAudit(db, {
    actorName: url.searchParams.get("pelaku") || undefined,
    category: isAuditCategory(kategori) ? kategori : undefined,
    sinceDays: hari === 7 || hari === 30 ? hari : undefined,
    limit: 5000,
  });
  const stamp = new Date().toISOString().slice(0, 10);
  return tableResponse(parseFormat(url.searchParams.get("format")), `log-audit-${stamp}`, "Log audit", buildAuditRows(entries));
}
