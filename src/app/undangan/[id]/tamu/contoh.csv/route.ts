import { requireInvitationById } from "@/lib/session";
import { SAMPLE_CSV } from "@/lib/guests/import";

export async function GET(_request: Request, context: RouteContext<"/undangan/[id]/tamu/contoh.csv">) {
  await requireInvitationById((await context.params).id);
  return new Response(`\uFEFF${SAMPLE_CSV}`, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="contoh-daftar-tamu.csv"',
      "cache-control": "public, max-age=3600",
    },
  });
}
