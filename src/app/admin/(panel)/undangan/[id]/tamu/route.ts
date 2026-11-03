import { db } from "@/db";
import { recordAudit } from "@/lib/admin/audit";
import { requireAdmin } from "@/lib/admin/guard";
import { getInvitationAdmin } from "@/lib/admin/queries";
import { listEventDetails } from "@/lib/events/service";
import { parseFormat, tableResponse } from "@/lib/export/table";
import { getDashboard } from "@/lib/rsvp/dashboard";
import { buildRsvpRows } from "@/lib/rsvp/export";
import { isUuid } from "@/lib/uuid";

export async function GET(request: Request, { params }: RouteContext<"/admin/undangan/[id]/tamu">) {
  const admin = await requireAdmin("lihat-tamu");
  const { id } = await params;
  if (!isUuid(id)) return new Response("Tidak ditemukan", { status: 404 });
  const detail = await getInvitationAdmin(db, id);
  if (!detail) return new Response("Tidak ditemukan", { status: 404 });

  const [events, data] = await Promise.all([listEventDetails(db, id), getDashboard(db, id, {})]);
  const rows = buildRsvpRows(
    events.map((e) => ({ id: e.id, name: e.name })),
    data.guests,
  );
  const format = parseFormat(new URL(request.url).searchParams.get("format"));
  await recordAudit(db, {
    actor: admin,
    category: "undangan",
    action: "Mengunduh daftar tamu",
    target: `/u/${detail.slug}`,
    detail: `${data.guests.length} tamu, format ${format}`,
  });
  const stamp = new Date().toISOString().slice(0, 10);
  return tableResponse(format, `tamu-${detail.slug}-${stamp}`, "Tamu", rows);
}
