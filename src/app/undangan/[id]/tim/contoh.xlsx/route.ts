import Papa from "papaparse";
import { requireInvitationById } from "@/lib/session";
import { TEAM_SAMPLE_CSV } from "@/lib/team/import";
import { buildXlsx, XLSX_MIME } from "@/lib/xlsx";

export async function GET(_request: Request, context: RouteContext<"/undangan/[id]/tim/contoh.xlsx">) {
  await requireInvitationById((await context.params).id);
  const rows = Papa.parse<string[]>(TEAM_SAMPLE_CSV, { skipEmptyLines: true }).data;
  const bytes = buildXlsx([{ name: "Daftar tim", rows }]);
  return new Response(new Uint8Array(bytes), {
    headers: {
      "content-type": XLSX_MIME,
      "content-disposition": 'attachment; filename="contoh-daftar-tim.xlsx"',
      "cache-control": "public, max-age=3600",
    },
  });
}
