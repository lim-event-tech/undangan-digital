import { db } from "@/db";
import { checkinCode } from "@/lib/checkin/code";
import { qrSvg } from "@/lib/checkin/qr";
import { isGuestAttending } from "@/lib/checkin/service";
import { readContent } from "@/lib/invitations/content";
import { findGuestRow } from "@/lib/rsvp/service";
import { looksLikeGuestToken, looksLikeSlug } from "@/lib/token";
import { currentClientKey, tokenGuard } from "@/lib/token-guard-instance";

const NOT_FOUND = () => new Response(null, { status: 404 });

export async function GET(_request: Request, ctx: RouteContext<"/[slug]/[token]/qr">) {
  const { slug, token } = await ctx.params;
  const key = await currentClientKey();
  if (tokenGuard.isBlocked(key)) return new Response(null, { status: 429 });

  if (!looksLikeSlug(slug) || !looksLikeGuestToken(token)) {
    tokenGuard.recordFailure(key);
    return NOT_FOUND();
  }
  const row = await findGuestRow(db, slug, token);
  if (!row) {
    tokenGuard.recordFailure(key);
    return NOT_FOUND();
  }
  if (row.status !== "terbit" || !readContent(row.content).checkin.aktif) return NOT_FOUND();
  if (!(await isGuestAttending(db, row.guestId))) return NOT_FOUND();

  const svg = await qrSvg(checkinCode(slug, token));
  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "private, no-store",
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
