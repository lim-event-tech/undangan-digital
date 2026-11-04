import { db } from "@/db";
import { appBaseUrl } from "@/lib/app-url";
import { buildIcs, calendarSlots } from "@/lib/calendar";
import { findGuestPage } from "@/lib/rsvp/service";
import { looksLikeGuestToken, looksLikeSlug } from "@/lib/token";
import { currentClientKey, tokenGuard } from "@/lib/token-guard-instance";

const NOT_FOUND = () => new Response(null, { status: 404 });

export async function GET(_request: Request, ctx: RouteContext<"/[slug]/[token]/kalender">) {
  const { slug, token } = await ctx.params;
  const key = await currentClientKey();
  if (tokenGuard.isBlocked(key)) return new Response(null, { status: 429 });

  if (!looksLikeSlug(slug) || !looksLikeGuestToken(token)) {
    tokenGuard.recordFailure(key);
    return NOT_FOUND();
  }
  const page = await findGuestPage(db, slug, token);
  if (!page) {
    tokenGuard.recordFailure(key);
    return NOT_FOUND();
  }
  if (page.invitation.status !== "terbit") return NOT_FOUND();

  const eventTitle = `${page.invitation.title}`;
  const slots = calendarSlots(
    page.events.map((e) => ({
      id: e.id,
      name: e.name,
      date: e.date,
      time: e.time,
      timezone: e.timezone,
      venueName: e.venueName,
      address: e.address,
      mapsUrl: e.mapsUrl,
    })),
    eventTitle,
  );
  if (slots.length === 0) return NOT_FOUND();

  const ics = buildIcs(slots, { uidDomain: new URL(appBaseUrl()).host });
  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="undangan-${slug}.ics"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
