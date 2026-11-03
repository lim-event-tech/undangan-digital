import { describe, expect, it } from "vitest";
import { readXlsx } from "@/lib/xlsx";
import { parseFormat, safeCell, tableResponse, toCsv } from "./table";

describe("tabel ekspor", () => {
  it("memilih Excel kecuali CSV diminta", () => {
    expect(parseFormat(null)).toBe("xlsx");
    expect(parseFormat("xlsx")).toBe("xlsx");
    expect(parseFormat("csv")).toBe("csv");
    expect(parseFormat("lain")).toBe("xlsx");
  });

  it("mencegah rumus di CSV tetapi tidak mengubah angka", () => {
    expect(safeCell("=cmd")).toBe("'=cmd");
    expect(safeCell("-1")).toBe("'-1");
    expect(toCsv([["a", "=b"], [3, "ok"]])).toBe("\uFEFFa;'=b\r\n3;ok\r\n");
  });

  it("menjawab dengan berkas xlsx yang bisa dibaca kembali", async () => {
    const response = tableResponse("xlsx", "tamu-uji", "Tamu", [["Nama", "Jumlah"], ["Ayu", 3]]);
    expect(response.headers.get("Content-Type")).toContain("spreadsheetml.sheet");
    expect(response.headers.get("Content-Disposition")).toBe('attachment; filename="tamu-uji.xlsx"');
    const bytes = new Uint8Array(await response.arrayBuffer());
    expect(readXlsx(bytes)).toEqual({ ok: true, rows: [["Nama", "Jumlah"], ["Ayu", "3"]] });
  });

  it("menjawab dengan CSV bila diminta", async () => {
    const response = tableResponse("csv", "tamu-uji", "Tamu", [["Nama"], ["Ayu"]]);
    expect(response.headers.get("Content-Type")).toContain("text/csv");
    const bytes = Buffer.from(await response.arrayBuffer());
    expect([...bytes.subarray(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
    expect(bytes.toString("utf8").slice(1)).toBe("Nama\r\nAyu\r\n");
  });
});
