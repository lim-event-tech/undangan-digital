import { auth } from "@/lib/auth";
import { forwardSsoRequest, ssoResponse } from "@/lib/sso-route";

export async function GET(request: Request) {
  return ssoResponse(await auth.handler(forwardSsoRequest(request)));
}
