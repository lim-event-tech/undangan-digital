import { db } from "@/db";
import { parseFormat, tableResponse } from "@/lib/export/table";
import { requireInvitation } from "@/lib/session";
import { buildWishRows } from "@/lib/wishes/export";
import { listWishes } from "@/lib/wishes/service";

export async function GET(request: Request) {
  const { invitation } = await requireInvitation();
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
