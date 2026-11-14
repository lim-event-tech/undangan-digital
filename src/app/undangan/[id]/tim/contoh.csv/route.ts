import { requireInvitationById } from "@/lib/session";
import { TEAM_SAMPLE_CSV } from "@/lib/team/import";

export async function GET(_request: Request, context: RouteContext<"/undangan/[id]/tim/contoh.csv">) {
  await requireInvitationById((await context.params).id);
  return new Response(`\uFEFF${TEAM_SAMPLE_CSV}`, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="contoh-daftar-tim.csv"',
      "cache-control": "public, max-age=3600",
    },
  });
}
