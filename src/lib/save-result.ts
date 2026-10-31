export type FieldErrors = Record<string, string>;

export type SaveResult =
  | { ok: true }
  | { ok: false; errors?: FieldErrors; formError?: string };

export const SAVED: SaveResult = { ok: true };
