import Papa from "papaparse";
import { buildXlsx, XLSX_MIME, type XlsxCell } from "@/lib/xlsx";

export const CSV_DELIMITER = ";";

export type Cell = XlsxCell;
export type Rows = Cell[][];

export type ExportFormat = "csv" | "xlsx";

export function parseFormat(value: string | null | undefined): ExportFormat {
  return value === "csv" ? "csv" : "xlsx";
}

export function safeCell(value: string): string {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

export function toCsv(rows: Rows): string {
  const safe = rows.map((row) => row.map((cell) => (typeof cell === "number" ? String(cell) : safeCell(cell))));
  return `\uFEFF${Papa.unparse(safe, { delimiter: CSV_DELIMITER, newline: "\r\n" })}\r\n`;
}

const HEADERS = { "Cache-Control": "private, no-store" } as const;

export function tableResponse(
  format: ExportFormat,
  baseName: string,
  sheetName: string,
  rows: Rows,
  options: { wrap?: number[] } = {},
): Response {
  if (format === "csv") {
    return new Response(toCsv(rows), {
      headers: {
        ...HEADERS,
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${baseName}.csv"`,
      },
    });
  }
  const bytes = buildXlsx([{ name: sheetName, rows, wrap: options.wrap }]);
  return new Response(new Uint8Array(bytes), {
    headers: {
      ...HEADERS,
      "Content-Type": XLSX_MIME,
      "Content-Disposition": `attachment; filename="${baseName}.xlsx"`,
    },
  });
}
