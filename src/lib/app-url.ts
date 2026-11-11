export function appBaseUrl(): string {
  return (process.env.BETTER_AUTH_URL ?? "http://localhost:3000").replace(/\/+$/, "");
}

export function guestPath(token: string): string {
  return `/${token}`;
}

export function guestLink(token: string): string {
  return `${appBaseUrl()}${guestPath(token)}`;
}
