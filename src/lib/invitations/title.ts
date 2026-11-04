export const MAX_INVITATION_TITLE = 120;

export function parseInvitationTitle(value: unknown):
  | { ok: true; title: string }
  | { ok: false; error: string } {
  const title = typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
  if (!title) return { ok: false, error: "Judul event wajib diisi." };
  if (title.length > MAX_INVITATION_TITLE) {
    return { ok: false, error: `Judul event maksimal ${MAX_INVITATION_TITLE} karakter.` };
  }
  return { ok: true, title };
}
