export const RESERVED_SLUGS = new Set([
  "admin",
  "api",
  "app",
  "daftar",
  "login",
  "masuk",
  "static",
  "u",
  "undangan",
  "www",
]);

export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " dan ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function makeSlugBase(groomName: string, brideName: string): string {
  const groom = slugify(groomName);
  const bride = slugify(brideName);
  let base = [groom, bride].filter(Boolean).join("-dan-");
  base = base.slice(0, 60).replace(/-+$/, "");
  if (!base || RESERVED_SLUGS.has(base)) base = base ? `${base}-undangan` : "undangan";
  return base;
}

export function slugCandidate(base: string, attempt: number): string {
  return attempt <= 0 ? base : `${base}-${attempt + 1}`;
}
