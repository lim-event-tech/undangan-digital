import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { appBaseUrl } from "@/lib/app-url";
import { INVITE_COOKIE } from "@/lib/token";
import { looksLikeInviteToken } from "@/lib/team/service";

export async function GET(request: Request, ctx: RouteContext<"/terima/[token]/mulai">) {
  const { token } = await ctx.params;
  const tujuan = new URL(request.url).searchParams.get("ke") === "daftar" ? "/daftar" : "/masuk";
  const base = appBaseUrl();
  if (!looksLikeInviteToken(token)) return NextResponse.redirect(new URL("/masuk", base));
  const jar = await cookies();
  jar.set(INVITE_COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24, path: "/" });
  return NextResponse.redirect(new URL(tujuan, base));
}
