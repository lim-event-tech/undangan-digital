import { db } from "@/db";
import { getImportContext } from "@/lib/guests/service";
import { buildGuestTemplateXlsx } from "@/lib/guests/template";
import { requireInvitationAccess } from "@/lib/session";
import { XLSX_MIME } from "@/lib/xlsx";

export async function GET(_request: Request, context: RouteContext<"/undangan/[id]/tamu/template.xlsx">) {
  const { invitation, scope } = await requireInvitationAccess((await context.params).id);
  const importContext = await getImportContext(db, invitation.id, scope ?? undefined);
  const bytes = buildGuestTemplateXlsx(importContext);

  return new Response(new Uint8Array(bytes), {
    headers: {
      "content-type": XLSX_MIME,
      "content-disposition": `attachment; filename="template-daftar-tamu-${invitation.slug}.xlsx"`,
      "cache-control": "no-store",
    },
  });
}

