import { auth } from "@/lib/auth";
import { forwardGoogleCallback } from "@/lib/google-callback";

export async function GET(request: Request) {
  return auth.handler(forwardGoogleCallback(request));
}

export async function POST(request: Request) {
  return auth.handler(forwardGoogleCallback(request));
}
