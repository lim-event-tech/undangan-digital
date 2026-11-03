import Papa from "papaparse";
import { SAMPLE_CSV } from "@/lib/guests/import";
import { buildXlsx, XLSX_MIME } from "@/lib/xlsx";

export function GET() {
  const rows = Papa.parse<string[]>(SAMPLE_CSV, { skipEmptyLines: true }).data.map((line, index) =>
    line.map((cell, column) => (index > 0 && column >= 4 && /^\d+$/.test(cell) ? Number(cell) : cell)),
  );
  const bytes = buildXlsx([{ name: "Daftar tamu", rows }]);
  return new Response(new Uint8Array(bytes), {
    headers: {
      "content-type": XLSX_MIME,
      "content-disposition": 'attachment; filename="contoh-daftar-tamu.xlsx"',
      "cache-control": "public, max-age=3600",
    },
  });
}
