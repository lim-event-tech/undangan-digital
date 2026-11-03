import { db } from "@/db";
import { getPhotoData } from "@/lib/photos/service";
import { isUuid } from "@/lib/uuid";

export async function GET(_request: Request, ctx: RouteContext<"/foto/[id]">) {
  const { id } = await ctx.params;
  if (!isUuid(id)) return new Response(null, { status: 404 });

  const photo = await getPhotoData(db, id);
  if (!photo) return new Response(null, { status: 404 });

  return new Response(new Uint8Array(photo.data), {
    headers: {
      "Content-Type": photo.contentType,
      "Content-Length": String(photo.data.length),
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      "Content-Disposition": "inline",
    },
  });
}
