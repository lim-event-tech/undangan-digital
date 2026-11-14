import Papa from "papaparse";
import { isEmailAddress } from "@/lib/mail/config";
import {
  type CheckinAccess,
  type Role,
} from "./access";

export const MAX_TEAM_IMPORT_ROWS = 100;
export const MAX_TEAM_IMPORT_BYTES = 1_000_000;

export const TEAM_COLUMNS = ["email", "peran", "hak_checkin"] as const;
type TeamColumn = (typeof TEAM_COLUMNS)[number];

export type RawTeamRow = {
  row: number;
  email: string;
  peran: string;
  hak_checkin: string;
};

export type TeamImportContext = {
  ownerEmail: string;
  memberEmails: string[];
  pendingEmails: string[];
  maxMembers: number;
};

export type TeamRowStatus = "siap" | "perlu_diperbaiki" | "duplikat";

export type ValidatedTeamRow = {
  row: number;
  emailInput: string;
  email: string | null;
  role: Role;
  checkinAccess: CheckinAccess;
  resend: boolean;
  status: TeamRowStatus;
  issues: string[];
  duplicateOf?: string;
};

const HEADER_ALIASES: Record<TeamColumn, string[]> = {
  email: ["email", "surel", "alamat_email", "email_anggota"],
  peran: ["peran", "role"],
  hak_checkin: ["hak_checkin", "checkin", "akses_checkin", "checkin_access"],
};

const ALIAS_TO_COLUMN = new Map<string, TeamColumn>(
  (Object.entries(HEADER_ALIASES) as [TeamColumn, string[]][]).flatMap(
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

export function decodeTeamCsvBytes(bytes: ArrayBuffer): string {
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

export type ParseTeamResult =
  | { ok: true; rows: RawTeamRow[] }
  | { ok: false; error: string };

export function parseTeamCsv(text: string): ParseTeamResult {
  const clean = text.replace(/^\uFEFF/, "");
  if (!clean.trim()) return { ok: false, error: "File kosong." };

  const parsed = Papa.parse<Record<string, string>>(clean, {
    header: true,
    delimiter: detectDelimiter(clean),
    skipEmptyLines: false,
    transformHeader: canonicalHeader,
  });

  return collectTeamRows(parsed.meta.fields ?? [], parsed.data, 2);
}

export function parseTeamTable(table: string[][]): ParseTeamResult {
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
  return collectTeamRows(fields, records, start + 2);
}

function collectTeamRows(
  fields: string[],
  records: Record<string, string>[],
  firstRow: number,
): ParseTeamResult {
  if (!fields.includes("email")) {
    return {
      ok: false,
      error: `Kolom wajib tidak ditemukan: email. Baris pertama harus berisi judul kolom: ${TEAM_COLUMNS.join(", ")}.`,
    };
  }

  const rows: RawTeamRow[] = [];
  records.forEach((record, index) => {
    const get = (c: TeamColumn) => (record[c] ?? "").toString().trim();
    const raw: RawTeamRow = {
      row: index + firstRow,
      email: get("email"),
      peran: get("peran"),
      hak_checkin: get("hak_checkin"),
    };
    const isEmpty = TEAM_COLUMNS.every((c) => raw[c] === "");
    if (!isEmpty) rows.push(raw);
  });

  if (rows.length === 0) return { ok: false, error: "Tidak ada baris anggota di file." };
  if (rows.length > MAX_TEAM_IMPORT_ROWS) {
    return {
      ok: false,
      error: `Terlalu banyak baris (${rows.length}). Maksimal ${MAX_TEAM_IMPORT_ROWS} baris per impor.`,
    };
  }
  return { ok: true, rows };
}

export const TEAM_SAMPLE_CSV = [
  "email,peran,hak_checkin",
  "sales1@gmail.com,anggota,milik",
  "sales2@gmail.com,anggota,semua",
  "panitia@gmail.com,anggota,tidak",
  "coowner@gmail.com,pemilik,semua",
  "",
].join("\r\n");

function parseRoleInput(raw: string): { value: Role; error?: string } {
  const norm = raw.trim().toLowerCase();
  if (!norm || norm === "anggota" || norm === "member") return { value: "anggota" };
  if (norm === "pemilik" || norm === "owner") return { value: "pemilik" };
  return { value: "anggota", error: 'Peran harus "anggota" atau "pemilik"' };
}

function parseCheckinInput(raw: string, role: Role): { value: CheckinAccess; error?: string } {
  const norm = raw.trim().toLowerCase();
  if (!norm) return { value: role === "pemilik" ? "semua" : "milik" };
  if (norm === "tidak" || norm === "milik" || norm === "semua") {
    return { value: role === "pemilik" ? "semua" : norm };
  }
  return { value: "milik", error: 'Hak check-in harus "tidak", "milik", atau "semua"' };
}

export function validateTeamImportRows(
  rows: RawTeamRow[],
  context: TeamImportContext,
): ValidatedTeamRow[] {
  const ownerEmail = context.ownerEmail.trim().toLowerCase();
  const memberSet = new Set(context.memberEmails.map((e) => e.trim().toLowerCase()));
  const pendingSet = new Set(context.pendingEmails.map((e) => e.trim().toLowerCase()));
  const seenEmails = new Map<string, number>();

  let remainingNewSlots = Math.max(
    0,
    context.maxMembers - memberSet.size - pendingSet.size,
  );

  return rows.map((raw) => {
    const issues: string[] = [];
    const emailInput = raw.email.trim();
    const normalizedEmail = emailInput.toLowerCase();
    let validEmail: string | null = null;
    let duplicateOf: string | undefined;

    if (!emailInput) {
      issues.push("Email wajib diisi");
    } else if (!isEmailAddress(normalizedEmail)) {
      issues.push("Format email tidak valid");
    } else {
      validEmail = normalizedEmail;
      if (normalizedEmail === ownerEmail) {
        issues.push("Itu alamat email pemilik undangan");
      } else if (memberSet.has(normalizedEmail)) {
        issues.push("Sudah menjadi anggota tim");
      } else {
        const previousRow = seenEmails.get(normalizedEmail);
        if (previousRow !== undefined) {
          duplicateOf = `baris ${previousRow}`;
        } else {
          seenEmails.set(normalizedEmail, raw.row);
        }
      }
    }

    const roleParsed = parseRoleInput(raw.peran);
    if (roleParsed.error) issues.push(roleParsed.error);

    const checkinParsed = parseCheckinInput(raw.hak_checkin, roleParsed.value);
    if (checkinParsed.error) issues.push(checkinParsed.error);

    const resend = Boolean(validEmail && pendingSet.has(validEmail));

    if (issues.length === 0 && !duplicateOf && validEmail && !resend) {
      if (remainingNewSlots <= 0) {
        issues.push(`Melebihi batas maksimal ${context.maxMembers} anggota tim`);
      } else {
        remainingNewSlots -= 1;
      }
    }

    const status: TeamRowStatus =
      issues.length > 0
        ? "perlu_diperbaiki"
        : duplicateOf
          ? "duplikat"
          : "siap";

    return {
      row: raw.row,
      emailInput,
      email: validEmail,
      role: roleParsed.value,
      checkinAccess: checkinParsed.value,
      resend,
      status,
      issues,
      duplicateOf,
    };
  });
}

export function summarizeTeamRows(rows: ValidatedTeamRow[]) {
  let ready = 0;
  let invalid = 0;
  let duplicate = 0;
  for (const r of rows) {
    if (r.status === "siap") ready += 1;
    else if (r.status === "duplikat") duplicate += 1;
    else invalid += 1;
  }
  return { ready, invalid, duplicate, total: rows.length };
}
