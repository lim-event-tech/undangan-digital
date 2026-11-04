import { appBaseUrl } from "@/lib/app-url";

export const GOOGLE_CALLBACK_PATH = "/api/auth/google/callback";

export function googleCallbackUrl(): string {
  return new URL(GOOGLE_CALLBACK_PATH, appBaseUrl()).toString();
}

export function forwardGoogleCallback(request: Request): Request {
  const url = new URL(request.url);
  url.pathname = "/api/auth/callback/google";
  return new Request(url, request);
}
