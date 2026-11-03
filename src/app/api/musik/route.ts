import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { MAX_MUSIC_BYTES } from "@/lib/music/audio";
import { setMusic } from "@/lib/music/service";
import { getWorkContext } from "@/lib/session";

const MESSAGES = {
  format: "File bukan musik MP3, M4A, atau OGG.",
  "terlalu-besar": "Musik terlalu besar. Pilih file di bawah 6 MB.",
  kosong: "File musik kosong.",
} as const;

function fail(error: string, status: number) {
  return Response.json({ error }, { status });
}

function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === request.headers.get("host");
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return fail("Permintaan ditolak.", 403);

  const context = await getWorkContext();
  if (!context) return fail("Sesi berakhir. Masuk lagi untuk melanjutkan.", 401);
  const invitation = context.invitation;
  if (!invitation) return fail("Undangan tidak ditemukan.", 404);

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return fail("Data unggahan tidak terbaca.", 400);
  }

  const file = formData.get("file");
  if (!(file instanceof File)) return fail("Data unggahan tidak lengkap.", 400);
  if (file.size > MAX_MUSIC_BYTES) return fail(MESSAGES["terlalu-besar"], 413);

  const result = await setMusic(db, invitation.id, {
    fileName: file.name,
    bytes: Buffer.from(await file.arrayBuffer()),
  });
  if (!result.ok) return fail(MESSAGES[result.error], 422);

  revalidatePath("/undangan/isi");
  return Response.json({ ok: true, id: result.music.id });
}
