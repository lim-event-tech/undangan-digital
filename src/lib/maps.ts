export function isMapsUrl(value: string): boolean {
  const text = value.trim();
  if (/\s/.test(text)) return false;
  let url: URL;
  try {
    url = new URL(text);
  } catch {
    return false;
  }
  if (url.protocol !== "https:") return false;
  if (url.username || url.password) return false;
  return /^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(url.hostname);
}

export function normalizeMapsUrl(value: string): string | null {
  const text = value.trim();
  if (!text) return null;
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(text) ? text : /^[a-z][a-z0-9+.-]*:/i.test(text) && !/^[^/]+:\d+(\/|$)/.test(text) ? text : `https://${text.replace(/^\/+/, "")}`;
  return isMapsUrl(withScheme) ? withScheme : null;
}
