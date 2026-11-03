export function appBaseUrl(): string {
  return (process.env.BETTER_AUTH_URL ?? "http://localhost:3000").replace(/\/+$/, "");
}

export function guestPath(slug: string, token: string): string {
  return `/${slug}/${token}`;
}

export function guestLink(slug: string, token: string): string {
  return `${appBaseUrl()}${guestPath(slug, token)}`;
}
