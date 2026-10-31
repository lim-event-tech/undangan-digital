import { SAMPLE_CSV } from "@/lib/guests/import";

export function GET() {
  return new Response(`\uFEFF${SAMPLE_CSV}`, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="contoh-daftar-tamu.csv"',
      "cache-control": "public, max-age=3600",
    },
  });
}
