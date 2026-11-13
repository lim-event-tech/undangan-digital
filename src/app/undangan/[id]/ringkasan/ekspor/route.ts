import { db } from "@/db";
import { listEventDetails } from "@/lib/events/service";
import { parseFormat, tableResponse } from "@/lib/export/table";
import { getDashboard, isGuestStatus } from "@/lib/rsvp/dashboard";
import { buildRsvpRows } from "@/lib/rsvp/export";
import { requireInvitationAccess } from "@/lib/session";
import { isUuid } from "@/lib/uuid";

function param(url: URL, name: string): string | undefined {
  const value = url.searchParams.get(name);
  return value ? value : undefined;
}

export async function GET(request: Request, context: RouteContext<"/undangan/[id]/ringkasan/ekspor">) {
  const { invitation, scope } = await requireInvitationAccess((await context.params).id);
  const url = new URL(request.url);

  const statusParam = param(url, "status");
  const grupParam = param(url, "grup");
  const acaraParam = param(url, "acara");

  const [events, data] = await Promise.all([
    listEventDetails(db, invitation.id),
    getDashboard(
      db,
      invitation.id,
      {
        status: isGuestStatus(statusParam) ? statusParam : undefined,
        groupId: isUuid(grupParam) ? grupParam : undefined,
        eventId: isUuid(acaraParam) ? acaraParam : undefined,
        q: param(url, "q")?.slice(0, 100),
      },
      scope ?? undefined,
    ),
  ]);

  const rows = buildRsvpRows(
    events.map((e) => ({ id: e.id, name: e.name })),
    data.guests,
  );
  const stamp = new Date().toISOString().slice(0, 10);
  return tableResponse(parseFormat(url.searchParams.get("format")), `rsvp-${invitation.slug}-${stamp}`, "RSVP", rows);
}
