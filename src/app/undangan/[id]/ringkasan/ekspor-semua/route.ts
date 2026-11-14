import { eq } from "drizzle-orm";
import { db } from "@/db";
import { user as userTable } from "@/db/schema";
import { listEventDetails } from "@/lib/events/service";
import { getDashboard } from "@/lib/rsvp/dashboard";
import {
  buildAnswerRows,
  buildCheckinRows,
  buildEventRows,
  buildRsvpRows,
  buildTeamRows,
  type FullExportMember,
} from "@/lib/rsvp/export";
import { requireInvitationAccess } from "@/lib/session";
import { listMembers } from "@/lib/team/service";
import { buildXlsx, XLSX_MIME } from "@/lib/xlsx";

export async function GET(_request: Request, context: RouteContext<"/undangan/[id]/ringkasan/ekspor-semua">) {
  const { invitation, role } = await requireInvitationAccess((await context.params).id);
  if (role !== "pemilik") return new Response("Tidak diizinkan", { status: 403 });

  const [events, data, members, [pembuat]] = await Promise.all([
    listEventDetails(db, invitation.id),
    getDashboard(db, invitation.id, {}),
    listMembers(db, invitation.id),
    db.select({ name: userTable.name, email: userTable.email }).from(userTable).where(eq(userTable.id, invitation.ownerId)),
  ]);

  const dashboardEvents = events.map((e) => ({ id: e.id, name: e.name }));
  const guestsBy = new Map<string, number>();
  for (const g of data.guests) guestsBy.set(g.addedByName, (guestsBy.get(g.addedByName) ?? 0) + 1);

  const team: FullExportMember[] = [
    ...(pembuat
      ? [{ name: pembuat.name, email: pembuat.email, role: "Pembuat", checkinAccess: "semua", guests: guestsBy.get(pembuat.name) ?? 0, contact: "", joinedAt: invitation.createdAt }]
      : []),
    ...members.map((m) => ({
      name: m.name,
      email: m.email,
      role: m.role === "pemilik" ? "Pemilik" : "Anggota",
      checkinAccess: m.checkinAccess,
      guests: m.guests,
      contact: [m.contactName, m.contactPhone, m.contactEmail].filter(Boolean).join(" · "),
      joinedAt: m.joinedAt,
    })),
  ];

  const bytes = buildXlsx([
    { name: "Tamu dan RSVP", rows: buildRsvpRows(dashboardEvents, data.guests) },
    { name: "Jawaban per sesi", rows: buildAnswerRows(data.guests, dashboardEvents), wrap: [6] },
    { name: "Check-in", rows: buildCheckinRows(data.guests) },
    { name: "Acara", rows: buildEventRows(events) },
    { name: "Tim", rows: buildTeamRows(team) },
  ]);
  const stamp = new Date().toISOString().slice(0, 10);
  return new Response(new Uint8Array(bytes), {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Type": XLSX_MIME,
      "Content-Disposition": `attachment; filename="semua-data-${invitation.slug}-${stamp}.xlsx"`,
    },
  });
}
