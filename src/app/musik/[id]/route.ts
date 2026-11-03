import { db } from "@/db";
import { parseRange } from "@/lib/music/audio";
import { getMusicData } from "@/lib/music/service";
import { isUuid } from "@/lib/uuid";

export async function GET(request: Request, ctx: RouteContext<"/musik/[id]">) {
  const { id } = await ctx.params;
  if (!isUuid(id)) return new Response(null, { status: 404 });

  const track = await getMusicData(db, id);
  if (!track) return new Response(null, { status: 404 });

  const size = track.data.length;
  const headers: Record<string, string> = {
    "Content-Type": track.contentType,
    "Accept-Ranges": "bytes",
    "Cache-Control": "public, max-age=31536000, immutable",
    "X-Content-Type-Options": "nosniff",
    "Content-Disposition": "inline",
  };

  const range = parseRange(request.headers.get("range"), size);
  if (range === "tidak-valid") {
    return new Response(null, {
      status: 416,
      headers: { ...headers, "Content-Range": `bytes */${size}` },
    });
  }
  if (range) {
    const part = track.data.subarray(range.start, range.end + 1);
    return new Response(new Uint8Array(part), {
      status: 206,
      headers: {
        ...headers,
        "Content-Length": String(part.length),
        "Content-Range": `bytes ${range.start}-${range.end}/${size}`,
      },
    });
  }
  return new Response(new Uint8Array(track.data), {
    headers: { ...headers, "Content-Length": String(size) },
  });
}
