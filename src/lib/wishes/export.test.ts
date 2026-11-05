import Papa from "papaparse";
import { describe, expect, it } from "vitest";
import { CSV_DELIMITER } from "@/lib/rsvp/export";
import { buildWishCsv } from "./export";

describe("buildWishCsv", () => {
  const csv = buildWishCsv([
    {
      id: "1",
      authorName: "Bapak Hendra",
      message: 'Selamat; "semoga" bahagia\nselalu',
      status: "tampil",
      createdAt: new Date("2026-11-10T03:00:00.000Z"),
    },
    {
      id: "2",
      authorName: "=HYPERLINK(1)",
      message: "+62 halo",
      status: "ditahan",
      createdAt: new Date("2026-11-11T03:00:00.000Z"),
    },
  ]);
  const rows = Papa.parse<string[]>(csv.replace(/^﻿/, ""), {
    delimiter: CSV_DELIMITER,
    skipEmptyLines: true,
  }).data;

  it("memuat header dan satu baris per ucapan dengan teks utuh", () => {
    expect(csv.startsWith("﻿")).toBe(true);
    expect(rows[0]).toEqual(["Pengirim", "Pesan tamu", "Status", "Dikirim"]);
    expect(rows).toHaveLength(3);
    expect(rows[1].slice(0, 3)).toEqual(["Bapak Hendra", 'Selamat; "semoga" bahagia\nselalu', "Tampil"]);
  });

  it("mencegah rumus Excel di pengirim dan isi ucapan", () => {
    expect(rows[2][0]).toBe("'=HYPERLINK(1)");
    expect(rows[2][1]).toBe("'+62 halo");
    expect(rows[2][2]).toBe("Ditahan");
  });
});
