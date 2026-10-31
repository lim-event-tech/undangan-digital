const GOOGLE_HOST = /^(www\.|maps\.)?google\.[a-z]{2,3}(\.[a-z]{2})?$/;

export function isGoogleMapsUrl(value: string): boolean {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    return false;
  }
  if (url.protocol !== "https:") return false;
  if (url.username || url.password || url.port) return false;

  const host = url.hostname.toLowerCase();
  if (host === "maps.app.goo.gl") return url.pathname.length > 1;
  if (host === "goo.gl") return url.pathname.startsWith("/maps/");
  if (!GOOGLE_HOST.test(host)) return false;
  if (host.startsWith("maps.")) return true;
  return url.pathname === "/maps" || url.pathname.startsWith("/maps/");
}
