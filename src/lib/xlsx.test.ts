import { deflateRawSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { buildXlsx, readXlsx } from "./xlsx";

describe("xlsx", () => {
  it("menulis lalu membaca kembali teks, angka, baris kosong, dan karakter khusus", () => {
    const rows = [
      ["Nama", "WhatsApp", "Dewasa"],
      ["Bapak Hendra & Istri", "0812-0000-0101", 2],
      ["=HYPERLINK(1)", "+62 811 0000", ""],
      ["Baris\nbaru <b> \"kutip\"", "0857", 1],
    ];
    const bytes = buildXlsx([{ name: "Tamu", rows }]);
    const hasil = readXlsx(bytes);
    expect(hasil).toEqual({
      ok: true,
      rows: [
        ["Nama", "WhatsApp", "Dewasa"],
        ["Bapak Hendra & Istri", "0812-0000-0101", "2"],
        ["=HYPERLINK(1)", "+62 811 0000", ""],
        ["Baris\nbaru <b> \"kutip\"", "0857", "1"],
      ],
    });
  });

  it("menyimpan rumus sebagai teks biasa, bukan rumus", () => {
    const bytes = buildXlsx([{ name: "Uji", rows: [["Isi"], ["=1+1"]] }]);
    const mentah = bytes.toString("latin1");
    expect(mentah.startsWith("PK")).toBe(true);
    const hasil = readXlsx(bytes);
    expect(hasil.ok && hasil.rows[1][0]).toBe("=1+1");
  });

  it("memberi nama lembar yang aman dan unik", () => {
    const bytes = buildXlsx([
      { name: "Tamu/Undangan: [1]", rows: [["a"]] },
      { name: "Tamu/Undangan: [1]", rows: [["b"]] },
    ]);
    expect(readXlsx(bytes)).toEqual({ ok: true, rows: [["a"]] });
  });

  it("menolak file yang bukan xlsx", () => {
    const hasil = readXlsx(new TextEncoder().encode("nama,whatsapp\nA,0812"));
    expect(hasil).toMatchObject({ ok: false });
  });

  it("menolak arsip yang isinya melebihi batas setelah diurai", () => {
    const besar = Buffer.alloc(60_000_000, 0x61);
    const sheet = `<worksheet><sheetData><row r="1"><c r="A1" t="inlineStr"><is><t>${besar.toString("latin1")}</t></is></c></row></sheetData></worksheet>`;
    const hasil = readXlsx(zipSatuBerkas("xl/worksheets/sheet1.xml", Buffer.from(sheet)));
    expect(hasil).toMatchObject({ ok: false });
  });

  it("membaca berkas buatan Excel: string bersama, angka, boolean, dan sel kosong di tengah", () => {
    const sheet =
      '<worksheet><sheetData><row r="1"><c r="A1" t="s"><v>0</v></c><c r="C1" t="s"><v>1</v></c></row>' +
      '<row r="3"><c r="A3"><v>81234567890</v></c><c r="B3" t="b"><v>1</v></c><c r="C3" t="inlineStr"><is><r><t>Ke</t></r><r><t>luarga</t></r></is></c></row>' +
      "</sheetData></worksheet>";
    const shared =
      '<sst><si><t>nama</t></si><si><r><t xml:space="preserve">grup </t></r><r><t>tamu</t></r><rPh><t>x</t></rPh></si></sst>';
    const zip = zipBanyak([
      ["xl/worksheets/sheet1.xml", Buffer.from(sheet)],
      ["xl/sharedStrings.xml", Buffer.from(shared)],
    ]);
    expect(readXlsx(zip)).toEqual({
      ok: true,
      rows: [
        ["nama", "", "grup tamu"],
        ["", "", ""],
        ["81234567890", "TRUE", "Keluarga"],
      ],
    });
  });
});

function zipSatuBerkas(nama: string, isi: Buffer): Uint8Array {
  return zipBanyak([[nama, isi]]);
}

function zipBanyak(berkas: [string, Buffer][]): Uint8Array {
  const bagian: Buffer[] = [];
  const pusat: Buffer[] = [];
  let offset = 0;
  for (const [nama, isi] of berkas) {
    const namaBytes = Buffer.from(nama);
    const padat = deflateRawSync(isi);
    const lokal = Buffer.alloc(30);
    lokal.writeUInt32LE(0x04034b50, 0);
    lokal.writeUInt16LE(8, 8);
    lokal.writeUInt32LE(padat.length, 18);
    lokal.writeUInt32LE(isi.length, 22);
    lokal.writeUInt16LE(namaBytes.length, 26);
    bagian.push(lokal, namaBytes, padat);
    const kepala = Buffer.alloc(46);
    kepala.writeUInt32LE(0x02014b50, 0);
    kepala.writeUInt16LE(8, 10);
    kepala.writeUInt32LE(padat.length, 20);
    kepala.writeUInt32LE(isi.length, 24);
    kepala.writeUInt16LE(namaBytes.length, 28);
    kepala.writeUInt32LE(offset, 42);
    pusat.push(kepala, namaBytes);
    offset += 30 + namaBytes.length + padat.length;
  }
  const pusatBytes = Buffer.concat(pusat);
  const akhir = Buffer.alloc(22);
  akhir.writeUInt32LE(0x06054b50, 0);
  akhir.writeUInt16LE(berkas.length, 8);
  akhir.writeUInt16LE(berkas.length, 10);
  akhir.writeUInt32LE(pusatBytes.length, 12);
  akhir.writeUInt32LE(offset, 16);
  return new Uint8Array(Buffer.concat([...bagian, pusatBytes, akhir]));
}
