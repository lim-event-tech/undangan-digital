export const RESERVED_SLUGS = new Set([
  "admin",
  "api",
  "app",
  "bantuan",
  "brand",
  "contoh",
  "daftar",
  "foto",
  "login",
  "masuk",
  "musik",
  "og",
  "petugas",
  "pratinjau",
  "static",
  "template",
  "terima",
  "u",
  "undangan",
  "www",
]);

const SLUG_CADANGAN = "event";

export const CUSTOM_SLUG_MIN = 3;
export const CUSTOM_SLUG_MAX = 60;

export type CustomSlugCheck = { ok: true; slug: string } | { ok: false; error: string };

export function checkCustomSlug(input: string): CustomSlugCheck {
  const slug = input.trim().toLowerCase();
  if (slug.length < CUSTOM_SLUG_MIN) {
    return { ok: false, error: `Link minimal ${CUSTOM_SLUG_MIN} karakter` };
  }
  if (slug.length > CUSTOM_SLUG_MAX) {
    return { ok: false, error: `Link maksimal ${CUSTOM_SLUG_MAX} karakter` };
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return {
      ok: false,
      error: "Gunakan huruf kecil, angka, dan tanda hubung, tanpa spasi dan tanpa tanda hubung di ujung",
    };
  }
  if (RESERVED_SLUGS.has(slug)) return { ok: false, error: "Link ini tidak bisa dipakai" };
  return { ok: true, slug };
}

export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " dan ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function makeSlugBase(title: string): string {
  let base = slugify(title);
  base = base.slice(0, 60).replace(/-+$/, "");
  if (!base) base = SLUG_CADANGAN;
  else if (RESERVED_SLUGS.has(base)) base = `${base}-undangan`;
  return base;
}

export function slugCandidate(base: string, attempt: number): string {
  return attempt <= 0 ? base : `${base}-${attempt + 1}`;
}
