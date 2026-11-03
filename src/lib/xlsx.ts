import { deflateRawSync, inflateRawSync } from "node:zlib";

export type XlsxCell = string | number;
export type XlsxSheet = { name: string; rows: XlsxCell[][]; wrap?: number[] };

export const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

const MAX_ENTRIES = 300;
const MAX_UNPACKED_BYTES = 40_000_000;
const MAX_SHEET_ROWS = 20_000;
const MAX_SHEET_COLUMNS = 200;
const MAX_CELL_CHARS = 32_000;

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i += 1) crc = CRC_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function writeZip(entries: { name: string; data: Buffer }[]): Buffer {
  const parts: Buffer[] = [];
  const central: Buffer[] = [];
  let offset = 0;
  for (const entry of entries) {
    const name = Buffer.from(entry.name, "utf8");
    const packed = deflateRawSync(entry.data);
    const crc = crc32(entry.data);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6);
    local.writeUInt16LE(8, 8);
    local.writeUInt16LE(0, 10);
    local.writeUInt16LE(0x21, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(packed.length, 18);
    local.writeUInt32LE(entry.data.length, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28);
    parts.push(local, name, packed);

    const head = Buffer.alloc(46);
    head.writeUInt32LE(0x02014b50, 0);
    head.writeUInt16LE(20, 4);
    head.writeUInt16LE(20, 6);
    head.writeUInt16LE(0x0800, 8);
    head.writeUInt16LE(8, 10);
    head.writeUInt16LE(0, 12);
    head.writeUInt16LE(0x21, 14);
    head.writeUInt32LE(crc, 16);
    head.writeUInt32LE(packed.length, 20);
    head.writeUInt32LE(entry.data.length, 24);
    head.writeUInt16LE(name.length, 28);
    head.writeUInt32LE(offset, 42);
    central.push(head, name);

    offset += local.length + name.length + packed.length;
  }
  const centralBytes = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralBytes.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...parts, centralBytes, end]);
}

type ZipEntry = { method: number; packedSize: number; size: number; offset: number };

function readZip(bytes: Buffer): Map<string, Buffer> | null {
  const minimum = Math.max(0, bytes.length - 65_557);
  let end = -1;
  for (let i = bytes.length - 22; i >= minimum; i -= 1) {
    if (bytes.readUInt32LE(i) === 0x06054b50) {
      end = i;
      break;
    }
  }
  if (end < 0) return null;

  const count = bytes.readUInt16LE(end + 10);
  if (count > MAX_ENTRIES) return null;
  let cursor = bytes.readUInt32LE(end + 16);
  const index = new Map<string, ZipEntry>();
  for (let n = 0; n < count; n += 1) {
    if (cursor + 46 > bytes.length || bytes.readUInt32LE(cursor) !== 0x02014b50) return null;
    const nameLength = bytes.readUInt16LE(cursor + 28);
    const extraLength = bytes.readUInt16LE(cursor + 30);
    const commentLength = bytes.readUInt16LE(cursor + 32);
    const name = bytes.toString("utf8", cursor + 46, cursor + 46 + nameLength);
    index.set(name, {
      method: bytes.readUInt16LE(cursor + 10),
      packedSize: bytes.readUInt32LE(cursor + 20),
      size: bytes.readUInt32LE(cursor + 24),
      offset: bytes.readUInt32LE(cursor + 42),
    });
    cursor += 46 + nameLength + extraLength + commentLength;
  }

  let budget = MAX_UNPACKED_BYTES;
  const files = new Map<string, Buffer>();
  for (const [name, entry] of index) {
    if (!/^(xl\/(workbook|sharedStrings)\.xml|xl\/_rels\/workbook\.xml\.rels|xl\/worksheets\/[^/]+\.xml)$/.test(name)) {
      continue;
    }
    if (entry.size > budget) return null;
    if (entry.offset + 30 > bytes.length || bytes.readUInt32LE(entry.offset) !== 0x04034b50) return null;
    const start = entry.offset + 30 + bytes.readUInt16LE(entry.offset + 26) + bytes.readUInt16LE(entry.offset + 28);
    const packed = bytes.subarray(start, start + entry.packedSize);
    try {
      const data =
        entry.method === 0
          ? Buffer.from(packed)
          : entry.method === 8
            ? inflateRawSync(packed, { maxOutputLength: budget })
            : null;
      if (!data) return null;
      budget -= data.length;
      files.set(name, data);
    } catch {
      return null;
    }
  }
  return files;
}

function escapeXml(text: string): string {
  return text
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f￾￿]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function columnName(index: number): string {
  let name = "";
  for (let n = index + 1; n > 0; n = Math.floor((n - 1) / 26)) {
    name = String.fromCharCode(65 + ((n - 1) % 26)) + name;
  }
  return name;
}

function columnIndex(letters: string): number {
  let index = 0;
  for (const char of letters) index = index * 26 + (char.charCodeAt(0) - 64);
  return index - 1;
}

function sheetName(name: string, taken: Set<string>): string {
  const base = name.replace(/[\[\]:*?/\\]/g, " ").replace(/\s+/g, " ").trim().slice(0, 31) || "Data";
  let candidate = base;
  for (let n = 2; taken.has(candidate.toLowerCase()); n += 1) {
    candidate = `${base.slice(0, 31 - String(n).length - 1)} ${n}`;
  }
  taken.add(candidate.toLowerCase());
  return candidate;
}

function widthOf(rows: XlsxCell[][], column: number): number {
  let longest = 8;
  for (const row of rows.slice(0, 500)) {
    const value = row[column];
    if (value === undefined) continue;
    const longestLine = String(value)
      .split("\n")
      .reduce((max, line) => Math.max(max, line.length), 0);
    longest = Math.max(longest, longestLine);
  }
  return Math.min(60, longest + 2);
}

function worksheetXml(sheet: XlsxSheet): string {
  const columns = Math.min(MAX_SHEET_COLUMNS, sheet.rows.reduce((max, row) => Math.max(max, row.length), 0));
  const wrap = new Set(sheet.wrap ?? []);
  const cols = Array.from({ length: columns }, (_, c) => {
    const width = wrap.has(c) ? Math.min(60, Math.max(widthOf(sheet.rows, c), 40)) : widthOf(sheet.rows, c);
    return `<col min="${c + 1}" max="${c + 1}" width="${width}" customWidth="1"/>`;
  }).join("");

  const body = sheet.rows
    .map((row, r) => {
      const cells = row
        .slice(0, columns)
        .map((value, c) => {
          const ref = `${columnName(c)}${r + 1}`;
          if (value === "" || value === undefined || value === null) return "";
          if (typeof value === "number" && Number.isFinite(value)) {
            return `<c r="${ref}"><v>${value}</v></c>`;
          }
          const style = r === 0 ? ' s="1"' : wrap.has(c) ? ' s="2"' : "";
          const text = escapeXml(String(value).slice(0, MAX_CELL_CHARS));
          return `<c r="${ref}"${style} t="inlineStr"><is><t xml:space="preserve">${text}</t></is></c>`;
        })
        .join("");
      return `<row r="${r + 1}">${cells}</row>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>${cols}</cols><sheetData>${body}</sheetData></worksheet>`;
}

const STYLES_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFF3E9D2"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;

export function buildXlsx(sheets: XlsxSheet[]): Buffer {
  const list = sheets.length > 0 ? sheets : [{ name: "Data", rows: [[]] }];
  const taken = new Set<string>();
  const named = list.map((sheet) => ({ ...sheet, name: sheetName(sheet.name, taken) }));

  const entries = [
    {
      name: "[Content_Types].xml",
      text: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${named
        .map(
          (_, i) =>
            `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`,
        )
        .join("")}</Types>`,
    },
    {
      name: "_rels/.rels",
      text: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
    },
    {
      name: "xl/workbook.xml",
      text: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${named
        .map((s, i) => `<sheet name="${escapeXml(s.name).replace(/"/g, "&quot;")}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`)
        .join("")}</sheets></workbook>`,
    },
    {
      name: "xl/_rels/workbook.xml.rels",
      text: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${named
        .map(
          (_, i) =>
            `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`,
        )
        .join("")}<Relationship Id="rId${named.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
    },
    { name: "xl/styles.xml", text: STYLES_XML },
    ...named.map((sheet, i) => ({ name: `xl/worksheets/sheet${i + 1}.xml`, text: worksheetXml(sheet) })),
  ];
  return writeZip(entries.map((entry) => ({ name: entry.name, data: Buffer.from(entry.text, "utf8") })));
}

function decodeXml(text: string): string {
  return text.replace(/&(#x[0-9a-fA-F]+|#\d+|amp|lt|gt|quot|apos);/g, (_, code: string) => {
    if (code === "amp") return "&";
    if (code === "lt") return "<";
    if (code === "gt") return ">";
    if (code === "quot") return '"';
    if (code === "apos") return "'";
    const value = code[1] === "x" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
    return value > 0 && value <= 0x10ffff ? String.fromCodePoint(value) : "";
  });
}

function textOf(xml: string): string {
  const clean = xml.replace(/<rPh\b[\s\S]*?<\/rPh>/g, "");
  let out = "";
  for (const match of clean.matchAll(/<t\b[^>]*?(?:\/>|>([\s\S]*?)<\/t>)/g)) out += match[1] ?? "";
  return decodeXml(out);
}

function attr(attributes: string, name: string): string | undefined {
  const match = new RegExp(`(?:^|\\s)${name}="([^"]*)"`).exec(attributes);
  return match ? decodeXml(match[1]) : undefined;
}

function numberText(raw: string): string {
  const trimmed = raw.trim();
  if (!/^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(trimmed)) return trimmed;
  const value = Number(trimmed);
  if (!Number.isFinite(value) || !Number.isInteger(value) || Math.abs(value) >= 1e21) return trimmed;
  return BigInt(value).toString();
}

function resolveSheetPath(files: Map<string, Buffer>): string | null {
  const workbook = files.get("xl/workbook.xml")?.toString("utf8");
  const rels = files.get("xl/_rels/workbook.xml.rels")?.toString("utf8");
  if (workbook && rels) {
    const first = /<sheet\b([^>]*?)\/?>/.exec(workbook);
    const relId = first ? (attr(first[1], "r:id") ?? attr(first[1], "id")) : undefined;
    if (relId) {
      for (const match of rels.matchAll(/<Relationship\b([^>]*?)\/?>/g)) {
        if (attr(match[1], "Id") !== relId) continue;
        const target = attr(match[1], "Target");
        if (!target) break;
        const path = target.startsWith("/") ? target.slice(1) : `xl/${target}`;
        if (files.has(path)) return path;
      }
    }
  }
  if (files.has("xl/worksheets/sheet1.xml")) return "xl/worksheets/sheet1.xml";
  return [...files.keys()].find((name) => name.startsWith("xl/worksheets/")) ?? null;
}

export type ReadXlsxResult = { ok: true; rows: string[][] } | { ok: false; error: string };

export function readXlsx(bytes: Uint8Array): ReadXlsxResult {
  const files = readZip(Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength));
  if (!files) return { ok: false, error: "File Excel tidak bisa dibaca. Pastikan formatnya .xlsx." };
  const path = resolveSheetPath(files);
  if (!path) return { ok: false, error: "File Excel tidak memuat lembar kerja." };

  const shared: string[] = [];
  const sharedXml = files.get("xl/sharedStrings.xml")?.toString("utf8");
  if (sharedXml) {
    for (const match of sharedXml.matchAll(/<si\b[^>]*?(?:\/>|>([\s\S]*?)<\/si>)/g)) shared.push(textOf(match[1] ?? ""));
  }

  const sheetXml = files.get(path)!.toString("utf8");
  const cells = new Map<number, Map<number, string>>();
  let maxRow = -1;
  let maxColumn = -1;
  for (const match of sheetXml.matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
    const ref = /^([A-Z]{1,3})(\d{1,7})$/.exec(attr(match[1], "r") ?? "");
    if (!ref) continue;
    const column = columnIndex(ref[1]);
    const row = Number(ref[2]) - 1;
    if (row >= MAX_SHEET_ROWS || column >= MAX_SHEET_COLUMNS) {
      if (match[2] && /<(v|is)\b/.test(match[2])) {
        return { ok: false, error: "Lembar kerja terlalu besar. Bagi file menjadi beberapa bagian." };
      }
      continue;
    }

    const inner = match[2] ?? "";
    const type = attr(match[1], "t") ?? "n";
    let value = "";
    if (type === "inlineStr") {
      value = textOf(/<is\b[^>]*>([\s\S]*?)<\/is>/.exec(inner)?.[1] ?? "");
    } else {
      const raw = /<v\b[^>]*>([\s\S]*?)<\/v>/.exec(inner)?.[1];
      if (raw !== undefined) {
        if (type === "s") value = shared[Number(raw)] ?? "";
        else if (type === "str") value = decodeXml(raw);
        else if (type === "b") value = raw.trim() === "1" ? "TRUE" : "FALSE";
        else if (type === "e") value = "";
        else value = numberText(decodeXml(raw));
      }
    }
    if (value === "") continue;

    let line = cells.get(row);
    if (!line) cells.set(row, (line = new Map()));
    line.set(column, value);
    maxRow = Math.max(maxRow, row);
    maxColumn = Math.max(maxColumn, column);
  }

  const rows: string[][] = [];
  for (let r = 0; r <= maxRow; r += 1) {
    const line = cells.get(r);
    rows.push(Array.from({ length: maxColumn + 1 }, (_, c) => line?.get(c) ?? ""));
  }
  return { ok: true, rows };
}
