import { db } from "@/db";
import { requireAdmin } from "@/lib/admin/guard";
import { isInvitationSort, listInvitationsAdmin, type InvitationStatus } from "@/lib/admin/queries";
import { formatDate } from "@/lib/datetime";
import { parseFormat, tableResponse } from "@/lib/export/table";

const STATUSES: InvitationStatus[] = ["draf", "terbit", "ditangguhkan"];

export async function GET(request: Request) {
  await requireAdmin();
  const url = new URL(request.url);
  const statusParam = url.searchParams.get("status");
  const sortParam = url.searchParams.get("urut");

  const data = await listInvitationsAdmin(db, {
    q: url.searchParams.get("q")?.slice(0, 100) || undefined,
    status: STATUSES.find((s) => s === statusParam),
    template: url.searchParams.get("template") || undefined,
    sort: isInvitationSort(sortParam) ? sortParam : "terbaru",
    pageSize: 5000,
  });

  const rows = [
    ["Pasangan", "Slug", "Pemilik", "Email pemilik", "Template", "Tanggal acara", "Status", "Tamu", "Terkirim", "Dibuka", "Menjawab"],
    ...data.rows.map((r) => [
      `${r.groomName} & ${r.brideName}`,
      r.slug,
      r.ownerName,
      r.ownerEmail,
      r.templateKey,
      r.eventDate ? formatDate(r.eventDate) : "",
      r.status,
      r.guests,
      r.sent,
      r.opened,
      r.responded,
    ]),
  ];
  const stamp = new Date().toISOString().slice(0, 10);
  return tableResponse(parseFormat(url.searchParams.get("format")), `undangan-${stamp}`, "Undangan", rows);
}
