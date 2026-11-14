import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { appBaseUrl } from "@/lib/app-url";
import { getSession } from "@/lib/session";
import { acceptInvite, getInvitationAccess, looksLikeInviteToken, previewInvite } from "@/lib/team/service";
import { INVITE_COOKIE } from "@/lib/token";

function ke(path: string): NextResponse {
  const response = NextResponse.redirect(new URL(path, appBaseUrl()));
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}

export async function GET(_request: Request, ctx: RouteContext<"/terima/[token]/gabung">) {
  const { token } = await ctx.params;
  if (!looksLikeInviteToken(token)) return ke("/undangan");

  const session = await getSession();
  if (!session || session.user.status === "diblokir") return ke(`/terima/${token}`);

  const jar = await cookies();
  const { invite } = await previewInvite(db, token);
  if (invite) {
    const akses = await getInvitationAccess(db, session.user.id, invite.invitationId);
    if (akses) {
      jar.delete(INVITE_COOKIE);
      return ke(`/undangan/${invite.invitationId}/${akses.role === "anggota" ? "tamu" : "isi"}`);
    }
  }

  const hasil = await acceptInvite(db, token, { id: session.user.id, adminRole: session.user.adminRole });
  if (!hasil.ok) return ke(`/terima/${token}?galat=${hasil.error === "akun-admin" ? "akun-admin" : "gagal"}`);
  jar.delete(INVITE_COOKIE);
  return ke(`/undangan/${hasil.invitationId}/tamu`);
}
