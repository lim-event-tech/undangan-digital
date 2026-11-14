import Papa from "papaparse";
import { describe, expect, it } from "vitest";
import type { DashboardGuest } from "./dashboard";
import {
  CSV_DELIMITER,
  buildAnswerRows,
  buildCheckinRows,
  buildRsvpCsv,
  buildTeamRows,
  exportPhone,
  safeCell,
} from "./export";

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
    addedByName: "",
    checkedInAt: null,
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
      addedByName: "Sari Sales",
      checkedInAt: new Date("2026-11-12T02:00:00.000Z"),
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
    expect(rows[0].slice(0, 5)).toEqual(["Nama", "Grup", "Anggota tim yang mengundang", "Nomor WhatsApp", "Status"]);
    expect(rows[0]).toContain("Utama: jawaban");
    expect(rows[0]).toContain("Sesi lanjutan: pesan");
  });

  it("menulis jawaban per acara, jumlah, dan pesan dengan tanda kutip yang benar", () => {
    const row = rows[1];
    expect(row[0]).toBe("Bapak Hendra");
    expect(row[2]).toBe("Sari Sales");
    expect(row[3]).toBe("0812-3456-7890");
    expect(row[4]).toBe("Hadir");
    expect(row[5]).toBe("3");
    const utama = rows[0].indexOf("Utama: jawaban");
    expect(row.slice(utama, utama + 4)).toEqual(["Hadir", "3", "", 'Sampai jumpa; "insya Allah"']);
    const lanjutan = rows[0].indexOf("Sesi lanjutan: jawaban");
    expect(row[lanjutan]).toBe("Tidak hadir");
  });

  it("menandai acara yang tidak diundang dan tamu yang belum menjawab", () => {
    const row = rows[2];
    expect(row[0]).toBe("'=cmd|calc!A0");
    expect(row[2]).toBe("");
    expect(row[4]).toBe("Belum menjawab");
    expect(row[rows[0].indexOf("Utama: jawaban")]).toBe("Tidak diundang");
    expect(row[rows[0].indexOf("Sesi lanjutan: jawaban")]).toBe("Belum menjawab");
  });
});

describe("ekspor semua data", () => {
  const respondedAt = new Date("2026-11-10T03:00:00.000Z");
  const guests: DashboardGuest[] = [
    guest({
      id: "g1",
      name: "Bapak Hendra",
      addedByName: "Sari Sales",
      status: "hadir",
      attendeeCount: 2,
      checkedInAt: new Date("2026-11-12T02:00:00.000Z"),
      invitedEventIds: ["utama"],
      answers: [{ eventId: "utama", eventName: "Utama", attending: true, attendeeCount: 2, note: "Hadir", respondedAt }],
    }),
    guest({ id: "g2", name: "Ibu Wati", addedByName: "Budi Pembuat", invitedEventIds: ["utama", "lanjutan"] }),
  ];

  it("lembar jawaban memuat satu baris per tamu per sesi yang diundang beserta penambahnya", () => {
    const rows = buildAnswerRows(guests, events);
    expect(rows[0]).toEqual(["Nama", "Anggota tim yang mengundang", "Sesi", "Jawaban", "Peserta", "Hari dan jam datang", "Pesan", "Dijawab"]);
    expect(rows).toHaveLength(1 + 1 + 2);
    expect(rows[1].slice(0, 5)).toEqual(["Bapak Hendra", "Sari Sales", "Utama", "Hadir", 2]);
    expect(rows[2].slice(2, 4)).toEqual(["Utama", "Belum menjawab"]);
  });

  it("lembar check-in menandai tamu yang sudah masuk", () => {
    const rows = buildCheckinRows(guests);
    expect(rows[1].slice(0, 6).slice(0, 5)).toEqual(["Bapak Hendra", "Sari Sales", "Hadir", 2, "Ya"]);
    expect(rows[2][4]).toBe("Belum");
    expect(rows[2][5]).toBe("");
  });

  it("lembar tim memuat peran dan hak check-in", () => {
    const rows = buildTeamRows([
      { name: "Sari Sales", email: "sari@example.com", role: "Anggota", checkinAccess: "milik", guests: 4, contact: "", joinedAt: null },
    ]);
    expect(rows[1].slice(0, 5)).toEqual(["Sari Sales", "sari@example.com", "Anggota", "Tamu miliknya", 4]);
  });
});
