export const CONTENT_LIMITS = {
  panggilan: 40,
  namaLengkap: 80,
  orangTua: 160,
  kutipan: 300,
  sambutan: 1200,
  penutup: 600,
} as const;

export type PersonContent = { namaLengkap: string; orangTua: string };

export type InvitationContent = {
  kutipan: string;
  sambutan: string;
  penutup: string;
  pria: PersonContent;
  wanita: PersonContent;
};

function text(value: unknown, max: number): string {
  return typeof value === "string" ? value.slice(0, max) : "";
}

function record(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function person(value: unknown): PersonContent {
  const source = record(value);
  return {
    namaLengkap: text(source.namaLengkap, CONTENT_LIMITS.namaLengkap),
    orangTua: text(source.orangTua, CONTENT_LIMITS.orangTua),
  };
}

export function readContent(raw: unknown): InvitationContent {
  const source = record(raw);
  return {
    kutipan: text(source.kutipan, CONTENT_LIMITS.kutipan),
    sambutan: text(source.sambutan, CONTENT_LIMITS.sambutan),
    penutup: text(source.penutup, CONTENT_LIMITS.penutup),
    pria: person(source.pria),
    wanita: person(source.wanita),
  };
}
