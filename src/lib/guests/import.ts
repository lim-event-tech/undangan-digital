import { RSVP_MAX_ATTENDEES } from "@/lib/rsvp/shared";
import Papa from "papaparse";
import { formatPhone, normalizePhone } from "@/lib/phone";

export const MAX_IMPORT_ROWS = 1000;
export const MAX_IMPORT_BYTES = 1_000_000;

export const COLUMNS = [
  "nama",
  "whatsapp",
  "grup",
  "acara",
  "maks_peserta",
] as const;
type Column = (typeof COLUMNS)[number];

export type RawRow = {
  row: number;
  nama: string;
  whatsapp: string;
  grup: string;
  acara: string;
  maks_peserta: string;
};

export type EventRef = { id: string; key: string; name: string };

export type ImportContext = {
  events: EventRef[];
  groups: string[];
  existing: { name: string; phone: string }[];
  defaults: { maxAttendees: number };
};

export type RowStatus = "siap" | "perlu_diperbaiki" | "duplikat";

export type ValidatedRow = {
  row: number;
  name: string;
  phoneInput: string;
  phone: string | null;
  groupName: string | null;
  newGroup: boolean;
  eventIds: string[];
  eventNames: string[];
  maxAttendees: number;
  attendeesFromDefault: boolean;
  status: RowStatus;
  issues: string[];
  duplicateOf?: string;
};

const HEADER_ALIASES: Record<Column, string[]> = {
  nama: ["nama", "name", "nama_tamu", "tamu"],
  whatsapp: [
    "whatsapp",
    "wa",
    "no_wa",
    "no_whatsapp",
    "nomor_wa",
    "nomor_whatsapp",
    "nomor",
    "no_hp",
    "hp",
    "telepon",
    "telp",
    "phone",
  ],
  grup: ["grup", "group", "kelompok", "kategori"],
  acara: ["acara", "event", "diundang_ke"],
  maks_peserta: ["maks_peserta", "max_peserta", "maksimal_peserta", "peserta", "max_attendees", "jumlah_peserta"],
};

const LEGACY_HEADERS = new Set(["maks_dewasa", "max_dewasa", "maksimal_dewasa", "dewasa", "maks_anak", "max_anak", "maksimal_anak", "anak", "adults", "children", "max_adults", "max_children"]);
const LEGACY_ERROR = "Format dewasa/anak sudah tidak digunakan. Unduh contoh impor terbaru dan isi kolom maks_peserta dengan jumlah seluruh peserta, termasuk tamu utama dan pendamping.";

const ALIAS_TO_COLUMN = new Map<string, Column>(
  (Object.entries(HEADER_ALIASES) as [Column, string[]][]).flatMap(
    ([column, aliases]) => aliases.map((a) => [a, column] as const),
  ),
);

function canonicalHeader(header: string): string {
  const key = header
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return ALIAS_TO_COLUMN.get(key) ?? key;
}

export function decodeCsvBytes(bytes: ArrayBuffer): string {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return new TextDecoder("windows-1252").decode(bytes);
  }
}

function detectDelimiter(text: string): string {
  const header = text.split(/\r?\n/).find((line) => line.trim() !== "") ?? "";
  let best = ",";
  let bestCount = 0;
  for (const candidate of [",", ";", "\t", "|"]) {
    const count = header.split(candidate).length - 1;
    if (count > bestCount) {
      best = candidate;
      bestCount = count;
    }
  }
  return best;
}

export type ParseResult =
  | { ok: true; rows: RawRow[] }
  | { ok: false; error: string };

export function parseGuestCsv(text: string): ParseResult {
  const clean = text.replace(/^\uFEFF/, "");
  if (!clean.trim()) return { ok: false, error: "File kosong." };

  const parsed = Papa.parse<Record<string, string>>(clean, {
    header: true,
    delimiter: detectDelimiter(clean),
    skipEmptyLines: false,
    transformHeader: canonicalHeader,
  });

  return collectRows(parsed.meta.fields ?? [], parsed.data, 2);
}

export function parseGuestTable(table: string[][]): ParseResult {
  const start = table.findIndex((line) => line.some((cell) => cell.trim() !== ""));
  if (start < 0) return { ok: false, error: "File kosong." };
  const fields = table[start].map((cell) => canonicalHeader(cell));
  const records = table.slice(start + 1).map((line) => {
    const record: Record<string, string> = {};
    fields.forEach((field, index) => {
      if (field) record[field] = line[index] ?? "";
    });
    return record;
  });
  return collectRows(fields, records, start + 2);
}

function collectRows(
  fields: string[],
  records: Record<string, string>[],
  firstRow: number,
): ParseResult {
  if (fields.some((field) => LEGACY_HEADERS.has(field))) return { ok: false, error: LEGACY_ERROR };
  const missing = (["nama", "whatsapp"] as const).filter(
    (c) => !fields.includes(c),
  );
  if (missing.length > 0) {
    return {
      ok: false,
      error: `Kolom wajib tidak ditemukan: ${missing.join(", ")}. Baris pertama harus berisi judul kolom: ${COLUMNS.join(", ")}.`,
    };
  }

  const rows: RawRow[] = [];
  records.forEach((record, index) => {
    const get = (c: Column) => (record[c] ?? "").toString().trim();
    const raw: RawRow = {
      row: index + firstRow,
      nama: get("nama"),
      whatsapp: get("whatsapp"),
      grup: get("grup"),
      acara: get("acara"),
      maks_peserta: get("maks_peserta"),
    };
    const isEmpty = COLUMNS.every((c) => raw[c] === "");
    if (!isEmpty) rows.push(raw);
  });

  if (rows.length === 0) return { ok: false, error: "Tidak ada baris tamu di file." };
  if (rows.length > MAX_IMPORT_ROWS) {
    return {
      ok: false,
      error: `Terlalu banyak baris (${rows.length}). Maksimal ${MAX_IMPORT_ROWS} baris per impor; bagi file menjadi beberapa bagian.`,
    };
  }
  return { ok: true, rows };
}

export const SAMPLE_CSV = [
  "nama,whatsapp,grup,acara,maks_peserta",
  "Bapak Hendra Permana,0812-0000-0101,Manajemen,utama;lanjutan,2",
  "Ibu Dian Pratiwi,0857 0000 0102,Mitra,lanjutan,1",
  "Tim Kolaborasi,+62 811-0000-0103,Mitra,lanjutan,4",
  "Panitia Registrasi,81200000104,Panitia,,",
  "",
].join("\r\n");

function norm(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function parseCount(
  value: string,
  label: string,
  min: number,
  max: number,
): { value: number | null; error?: string } {
  if (value === "") return { value: null };
  if (!/^\d{1,3}$/.test(value)) {
    return { value: null, error: `${label} harus berupa angka ${min} sampai ${max}` };
  }
  const n = Number(value);
  if (n < min || n > max) {
    return { value: null, error: `${label} harus ${min} sampai ${max}` };
  }
  return { value: n };
}

function splitEvents(value: string): string[] {
  return value
    .split(/[;,/|]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function matchEvent(token: string, events: EventRef[]): EventRef | undefined {
  const wanted = norm(token);
  if (!wanted) return undefined;
  return events.find((event) => {
    const full = norm(event.name);
    return (
      wanted === norm(event.key) || wanted === full || wanted === full.split(" ")[0]
    );
  });
}

export function validateImportRows(
  rows: RawRow[],
  ctx: ImportContext,
): ValidatedRow[] {
  const knownGroups = new Map(ctx.groups.map((g) => [g.toLowerCase(), g]));
  const newGroupsSeen = new Set<string>();
  const existingByPhone = new Map<string, string>();
  for (const g of ctx.existing) {
    if (!existingByPhone.has(g.phone)) existingByPhone.set(g.phone, g.name);
  }
  const firstRowByPhone = new Map<string, number>();

  return rows.map((raw) => {
    const issues: string[] = [];

    const name = raw.nama.replace(/\s+/g, " ").trim();
    if (!name) issues.push("Nama kosong");
    else if (name.length > 120) issues.push("Nama terlalu panjang (maks. 120 karakter)");

    const phoneResult = normalizePhone(raw.whatsapp);
    const phone = phoneResult.ok ? phoneResult.value : null;
    if (!phoneResult.ok) issues.push(phoneResult.error);

    let groupName: string | null = null;
    let newGroup = false;
    const groupInput = raw.grup.replace(/\s+/g, " ").trim();
    if (groupInput.length > 60) {
      issues.push("Nama grup terlalu panjang (maks. 60 karakter)");
    } else if (groupInput) {
      const existing = knownGroups.get(groupInput.toLowerCase());
      groupName = existing ?? groupInput;
      newGroup = !existing && !newGroupsSeen.has(groupInput.toLowerCase());
      if (!existing) newGroupsSeen.add(groupInput.toLowerCase());
    }

    const eventTokens = splitEvents(raw.acara);
    let invited: EventRef[];
    if (eventTokens.length === 0) {
      invited = ctx.events;
    } else {
      invited = [];
      for (const token of eventTokens) {
        const event = matchEvent(token, ctx.events);
        if (!event) issues.push(`Acara "${token}" tidak dikenal`);
        else if (!invited.includes(event)) invited.push(event);
      }
    }

    if (Object.keys(raw).some((key) => LEGACY_HEADERS.has(key))) issues.push(LEGACY_ERROR);
    const attendees = parseCount(raw.maks_peserta ?? "", "Maks. peserta", 1, RSVP_MAX_ATTENDEES);
    if (attendees.error) issues.push(attendees.error);

    let status: RowStatus = "siap";
    let duplicateOf: string | undefined;
    if (issues.length > 0) {
      status = "perlu_diperbaiki";
    } else if (phone) {
      const existingName = existingByPhone.get(phone);
      const earlierRow = firstRowByPhone.get(phone);
      if (existingName !== undefined) {
        status = "duplikat";
        duplicateOf = existingName;
      } else if (earlierRow !== undefined) {
        status = "duplikat";
        duplicateOf = `baris ${earlierRow}`;
      }
    }
    if (phone && status === "siap" && !firstRowByPhone.has(phone)) {
      firstRowByPhone.set(phone, raw.row);
    }

    return {
      row: raw.row,
      name,
      phoneInput: raw.whatsapp,
      phone,
      groupName,
      newGroup,
      eventIds: invited.map((e) => e.id),
      eventNames: invited.map((e) => e.name),
      maxAttendees: attendees.value ?? ctx.defaults.maxAttendees,
      attendeesFromDefault: attendees.value === null,
      status,
      issues,
      duplicateOf,
    };
  });
}

export function summarizeRows(rows: ValidatedRow[]) {
  return {
    total: rows.length,
    ready: rows.filter((r) => r.status === "siap").length,
    invalid: rows.filter((r) => r.status === "perlu_diperbaiki").length,
    duplicate: rows.filter((r) => r.status === "duplikat").length,
  };
}

export function phoneShownFrom(row: ValidatedRow): string | null {
  if (!row.phone) return null;
  const original = row.phoneInput.trim();
  return original === formatPhone(row.phone) || original === row.phone
    ? null
    : original;
}
