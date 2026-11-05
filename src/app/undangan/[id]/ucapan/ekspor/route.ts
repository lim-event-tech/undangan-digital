import { db } from "@/db";
import { parseFormat, tableResponse } from "@/lib/export/table";
import { requireInvitationById } from "@/lib/session";
import { buildWishRows } from "@/lib/wishes/export";
import { listWishes } from "@/lib/wishes/service";

export async function GET(request: Request, context: RouteContext<"/undangan/[id]/ucapan/ekspor">) {
  const { invitation } = await requireInvitationById((await context.params).id);
  const wishes = await listWishes(db, invitation.id);
  const stamp = new Date().toISOString().slice(0, 10);
  return tableResponse(
    parseFormat(new URL(request.url).searchParams.get("format")),
    `ucapan-${invitation.slug}-${stamp}`,
    "Ucapan",
    buildWishRows(wishes),
    { wrap: [1] },
  );
}
