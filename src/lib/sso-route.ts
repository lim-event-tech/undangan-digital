import { appBaseUrl } from "@/lib/app-url";

export function forwardSsoRequest(request: Request): Request {
  const url = new URL("/api/auth/lingkaride/sso", appBaseUrl());
  url.search = new URL(request.url).search;
  return new Request(url, { headers: request.headers });
}

export function ssoResponse(response: Response): Response {
  if (response.status === 429) {
    const headers = new Headers({
      location: new URL("/admin/masuk?galat=sso_rate_limited", appBaseUrl()).href,
    });
    const retryAfter = response.headers.get("retry-after");
    if (retryAfter) headers.set("Retry-After", retryAfter);
    response = new Response(null, { status: 302, headers });
  }
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}
