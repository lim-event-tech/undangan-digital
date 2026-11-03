import { db } from "@/db";
import { renderOgImage } from "@/lib/og-image";
import { getCoverData } from "@/lib/photos/service";
import { isUuid } from "@/lib/uuid";

export async function GET(_request: Request, ctx: RouteContext<"/og/[id]">) {
  const { id } = await ctx.params;
  if (!isUuid(id)) return new Response(null, { status: 404 });

  const cover = await getCoverData(db, id);
  if (!cover) return new Response(null, { status: 404 });

  let image: Buffer;
  try {
    image = await renderOgImage(cover);
  } catch {
    return new Response(null, { status: 422 });
  }

  return new Response(new Uint8Array(image), {
    headers: {
      "Content-Type": "image/jpeg",
      "Content-Length": String(image.length),
      "Cache-Control": "public, max-age=86400",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
