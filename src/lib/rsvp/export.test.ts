import Papa from "papaparse";
import { describe, expect, it } from "vitest";
import type { DashboardGuest } from "./dashboard";
import { CSV_DELIMITER, buildRsvpCsv, exportPhone, safeCell } from "./export";

const events = [
  { id: "utama", name: "Utama" },
  { id: "lanjutan", name: "Sesi lanjutan" },
];

function guest(overrides: Partial<DashboardGuest> & { id: string; name: string }): DashboardGuest {
  return {
    groupId: null,
    groupName: null,
    phone: "+6281234567890",
    sentAt: null,
    openedAt: null,
    remindedAt: null,
    invitedEventIds: ["utama", "lanjutan"],
    status: "belum",
    answers: [],
    attendeeCount: 0,
    respondedAt: null,
    ...overrides,
  };
}

function parse(csv: string) {
  return Papa.parse<string[]>(csv.replace(/^﻿/, ""), {
    delimiter: CSV_DELIMITER,
    skipEmptyLines: true,
  }).data;
}

describe("safeCell", () => {
  it("mencegah rumus di Excel", () => {
    expect(safeCell('=HYPERLINK("x")')).toBe('\'=HYPERLINK("x")');
    expect(safeCell("+62")).toBe("'+62");
    expect(safeCell("-1")).toBe("'-1");
    expect(safeCell("@SUM(A1)")).toBe("'@SUM(A1)");
    expect(safeCell("Hendra")).toBe("Hendra");
    expect(safeCell("")).toBe("");
  });
});

describe("exportPhone", () => {
  it("mengubah +62 menjadi format lokal yang tetap teks", () => {
    expect(exportPhone("+6281234567890")).toBe("0812-3456-7890");
  });
});

describe("buildRsvpCsv", () => {
  const respondedAt = new Date("2026-11-10T03:00:00.000Z");
  const guests: DashboardGuest[] = [
    guest({
      id: "g1",
      name: "Bapak Hendra",
      groupName: "Keluarga",
      status: "hadir",
      attendeeCount: 3,
      respondedAt,
      sentAt: new Date("2026-11-02T03:00:00.000Z"),
      openedAt: new Date("2026-11-03T03:00:00.000Z"),
      answers: [
        {
          eventId: "utama",
          eventName: "Utama",
          attending: true,
          attendeeCount: 3,
          note: 'Sampai jumpa; "insya Allah"',
          respondedAt,
        },
        {
          eventId: "lanjutan",
          eventName: "Sesi lanjutan",
          attending: false,
          attendeeCount: 0,
          note: "",
          respondedAt,
        },
      ],
    }),
    guest({ id: "g2", name: "=cmd|calc!A0", invitedEventIds: ["lanjutan"] }),
  ];

  const csv = buildRsvpCsv(events, guests);
  const rows = parse(csv);

  it("diawali BOM UTF-8 dan memakai pemisah titik koma", () => {
    expect(csv.startsWith("﻿")).toBe(true);
    expect(csv.split("\r\n")[0]).toContain(";");
  });

  it("memuat satu baris header dan satu baris per tamu dengan jumlah kolom sama", () => {
    expect(rows).toHaveLength(3);
    expect(new Set(rows.map((r) => r.length)).size).toBe(1);
    expect(rows[0].slice(0, 4)).toEqual(["Nama", "Grup", "Nomor WhatsApp", "Status"]);
    expect(rows[0]).toContain("Utama: jawaban");
    expect(rows[0]).toContain("Sesi lanjutan: pesan");
  });

  it("menulis jawaban per acara, jumlah, dan pesan dengan tanda kutip yang benar", () => {
    const row = rows[1];
    expect(row[0]).toBe("Bapak Hendra");
    expect(row[2]).toBe("0812-3456-7890");
    expect(row[3]).toBe("Hadir");
    expect(row[4]).toBe("3");
    const utama = rows[0].indexOf("Utama: jawaban");
    expect(row.slice(utama, utama + 3)).toEqual(["Hadir", "3", 'Sampai jumpa; "insya Allah"']);
    const lanjutan = rows[0].indexOf("Sesi lanjutan: jawaban");
    expect(row[lanjutan]).toBe("Tidak hadir");
  });

  it("menandai acara yang tidak diundang dan tamu yang belum menjawab", () => {
    const row = rows[2];
    expect(row[0]).toBe("'=cmd|calc!A0");
    expect(row[3]).toBe("Belum menjawab");
    expect(row[rows[0].indexOf("Utama: jawaban")]).toBe("Tidak diundang");
    expect(row[rows[0].indexOf("Sesi lanjutan: jawaban")]).toBe("Belum menjawab");
  });
});
