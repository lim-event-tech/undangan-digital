import { db } from "@/db";
import { requireInvitationById } from "@/lib/session";
import { getTeamImportContext } from "@/lib/team/service";
import { buildTeamTemplateXlsx } from "@/lib/team/template";
import { XLSX_MIME } from "@/lib/xlsx";

export async function GET(_request: Request, context: RouteContext<"/undangan/[id]/tim/template.xlsx">) {
  const { invitation } = await requireInvitationById((await context.params).id);
  const importContext = await getTeamImportContext(db, invitation.id);
  const bytes = buildTeamTemplateXlsx(importContext);

  return new Response(new Uint8Array(bytes), {
    headers: {
      "content-type": XLSX_MIME,
      "content-disposition": `attachment; filename="template-tim-${invitation.slug}.xlsx"`,
      "cache-control": "no-store",
    },
  });
}
