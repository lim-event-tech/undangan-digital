import { describe, expect, it } from "vitest";
import {
  MAX_IMPORT_ROWS,
  decodeCsvBytes,
  parseGuestCsv,
  phoneShownFrom,
  summarizeRows,
  validateImportRows,
  type ImportContext,
  type RawRow,
} from "./import";

const context: ImportContext = {
  events: [
    { id: "e-utama", key: "utama", name: "Acara utama" },
    { id: "e-lanjutan", key: "lanjutan", name: "Sesi lanjutan" },
  ],
  groups: ["Keluarga pria"],
  existing: [{ name: "Ibu Sari", phone: "+6281200000101" }],
  defaults: { maxAdults: 2, maxChildren: 0 },
};

function raw(row: number, nama: string, whatsapp: string, extra: Partial<RawRow> = {}): RawRow {
  return {
    row,
    nama,
    whatsapp,
    grup: "",
    acara: "",
    maks_dewasa: "",
    maks_anak: "",
    ...extra,
  };
}

describe("parseGuestCsv", () => {
  it("membaca judul kolom dengan alias dan nomor baris seperti di spreadsheet", () => {
    const result = parseGuestCsv(
      "Nama Tamu,No WA,Kelompok,Event,Dewasa,Anak\r\nIbu Sari,0812-0000-0101,Keluarga,utama,2,1\r\n\r\nPak Budi,0813-0000-0102,,,,\r\n",
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.rows).toEqual([
      {
        row: 2,
        nama: "Ibu Sari",
        whatsapp: "0812-0000-0101",
        grup: "Keluarga",
        acara: "utama",
        maks_dewasa: "2",
        maks_anak: "1",
      },
      {
        row: 4,
        nama: "Pak Budi",
        whatsapp: "0813-0000-0102",
        grup: "",
        acara: "",
        maks_dewasa: "",
        maks_anak: "",
      },
    ]);
  });

  it("membuang BOM dan mendeteksi pemisah titik koma", () => {
    const result = parseGuestCsv("\uFEFFnama;whatsapp\nIbu Sari;0812-0000-0101\n");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.rows[0].nama).toBe("Ibu Sari");
    expect(result.rows[0].whatsapp).toBe("0812-0000-0101");
  });

  it("menolak file tanpa kolom wajib", () => {
    const result = parseGuestCsv("foo,bar\n1,2\n");
    expect(result).toMatchObject({ ok: false });
    if (!result.ok) expect(result.error).toContain("nama, whatsapp");
  });

  it("menolak file kosong atau tanpa baris tamu", () => {
    expect(parseGuestCsv("   ")).toEqual({ ok: false, error: "File kosong." });
    expect(parseGuestCsv("nama,whatsapp\n")).toEqual({
      ok: false,
      error: "Tidak ada baris tamu di file.",
    });
  });

  it("menolak file dengan baris melebihi batas", () => {
    const body = Array.from(
      { length: MAX_IMPORT_ROWS + 1 },
      (_, i) => `Tamu ${i},08120000${String(i).padStart(4, "0")}`,
    ).join("\n");
    const result = parseGuestCsv(`nama,whatsapp\n${body}`);
    expect(result.ok).toBe(false);
  });
});

describe("decodeCsvBytes", () => {
  it("membaca UTF-8", () => {
    const bytes = new TextEncoder().encode("Jo\u00e3o");
    expect(decodeCsvBytes(bytes.buffer as ArrayBuffer)).toBe("Jo\u00e3o");
  });

  it("jatuh ke windows-1252 untuk file hasil Excel lama", () => {
    const bytes = new Uint8Array([0x4a, 0x6f, 0xe3, 0x6f]);
    expect(decodeCsvBytes(bytes.buffer)).toBe("Jo\u00e3o");
  });
});

describe("validateImportRows", () => {
  it("menandai baris valid sebagai siap dan memakai nilai bawaan", () => {
    const [row] = validateImportRows([raw(2, "Pak Budi", "0813-0000-0102")], context);
    expect(row).toMatchObject({
      status: "siap",
      phone: "+6281300000102",
      eventIds: ["e-utama", "e-lanjutan"],
      maxAdults: 2,
      maxChildren: 0,
      adultsFromDefault: true,
      childrenFromDefault: true,
      groupName: null,
    });
  });

  it("memetakan acara dengan pemisah ; , / | dan menolak acara tak dikenal", () => {
    const rows = validateImportRows(
      [
        raw(2, "A", "0813-0000-0102", { acara: "UTAMA; lanjutan" }),
        raw(3, "B", "0813-0000-0103", { acara: "acara utama/lanjutan" }),
        raw(4, "C", "0813-0000-0104", { acara: "pengajian" }),
      ],
      context,
    );
    expect(rows[0].eventIds).toEqual(["e-utama", "e-lanjutan"]);
    expect(rows[1].eventIds).toEqual(["e-utama", "e-lanjutan"]);
    expect(rows[2].status).toBe("perlu_diperbaiki");
    expect(rows[2].issues).toEqual(['Acara "pengajian" tidak dikenal']);
  });

  it("mencocokkan grup tanpa membedakan huruf besar dan menandai grup baru sekali", () => {
    const rows = validateImportRows(
      [
        raw(2, "A", "0813-0000-0102", { grup: "keluarga PRIA" }),
        raw(3, "B", "0813-0000-0103", { grup: "Teman SMA" }),
        raw(4, "C", "0813-0000-0104", { grup: "teman sma" }),
      ],
      context,
    );
    expect(rows[0]).toMatchObject({ groupName: "Keluarga pria", newGroup: false });
    expect(rows[1]).toMatchObject({ groupName: "Teman SMA", newGroup: true });
    expect(rows[2]).toMatchObject({ groupName: "teman sma", newGroup: false });
  });

  it("melaporkan semua masalah pada satu baris", () => {
    const [row] = validateImportRows(
      [raw(2, "", "0812", { maks_dewasa: "0", maks_anak: "abc" })],
      context,
    );
    expect(row.status).toBe("perlu_diperbaiki");
    expect(row.issues).toEqual([
      "Nama kosong",
      "Nomor terlalu pendek",
      "Maks. dewasa harus 1 sampai 20",
      "Maks. anak harus berupa angka 0 sampai 20",
    ]);
  });

  it("mendeteksi nomor yang sudah ada di daftar tamu", () => {
    const [row] = validateImportRows([raw(2, "Ibu Sari R.", "+62 812-0000-0101")], context);
    expect(row).toMatchObject({ status: "duplikat", duplicateOf: "Ibu Sari" });
  });

  it("mendeteksi nomor kembar di dalam file", () => {
    const rows = validateImportRows(
      [raw(2, "A", "0813-0000-0102"), raw(3, "B", "+6281300000102")],
      context,
    );
    expect(rows[0].status).toBe("siap");
    expect(rows[1]).toMatchObject({ status: "duplikat", duplicateOf: "baris 2" });
  });

  it("tidak menganggap nomor dari baris bermasalah sebagai acuan duplikat", () => {
    const rows = validateImportRows(
      [
        raw(2, "A", "0813-0000-0102", { acara: "tidak ada" }),
        raw(3, "B", "0813-0000-0102"),
      ],
      context,
    );
    expect(rows[0].status).toBe("perlu_diperbaiki");
    expect(rows[1].status).toBe("siap");
  });
});

describe("summarizeRows", () => {
  it("menghitung jumlah per status", () => {
    const rows = validateImportRows(
      [
        raw(2, "A", "0813-0000-0102"),
        raw(3, "B", "0812"),
        raw(4, "C", "0812-0000-0101"),
      ],
      context,
    );
    expect(summarizeRows(rows)).toEqual({ total: 3, ready: 1, invalid: 1, duplicate: 1 });
  });
});

describe("phoneShownFrom", () => {
  it("menampilkan nomor asli hanya bila berbeda dari hasil format", () => {
    const [a, b] = validateImportRows(
      [raw(2, "A", "0813-0000-0102"), raw(3, "B", "+62 813-0000-0103")],
      context,
    );
    expect(phoneShownFrom(a)).toBe("0813-0000-0102");
    expect(phoneShownFrom(b)).toBeNull();
  });
});
