import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { MAX_PHOTO_BYTES } from "@/lib/images";
import { addPhoto } from "@/lib/photos/service";
import { getWorkContext } from "@/lib/session";

const MESSAGES = {
  penuh: "Galeri sudah berisi 12 foto. Hapus satu foto dulu.",
  format: "File bukan foto JPG, PNG, atau WebP.",
  "terlalu-besar": "Foto terlalu besar. Pilih foto lain atau kecilkan ukurannya.",
  kosong: "File foto kosong.",
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
  const kind = formData.get("jenis");
  if (
    !(file instanceof File) ||
    (kind !== "cover" && kind !== "galeri" && kind !== "qris")
  ) {
    return fail("Data unggahan tidak lengkap.", 400);
  }
  if (file.size > MAX_PHOTO_BYTES) return fail(MESSAGES["terlalu-besar"], 413);

  const result = await addPhoto(db, invitation.id, {
    kind,
    fileName: file.name,
    bytes: Buffer.from(await file.arrayBuffer()),
  });
  if (!result.ok) {
    return fail(MESSAGES[result.error], result.error === "penuh" ? 409 : 422);
  }

  revalidatePath("/undangan/isi");
  return Response.json({ ok: true, id: result.photo.id });
}
