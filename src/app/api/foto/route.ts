import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { MAX_PHOTO_BYTES } from "@/lib/images";
import { addPhoto } from "@/lib/photos/service";
import { setPengisiPhoto } from "@/lib/photos/pengisi";
import { getWorkContextForInvitation } from "@/lib/session";

const MESSAGES = {
  penuh: "Galeri sudah berisi 12 foto. Hapus satu foto dulu.",
  format: "File bukan foto JPG, PNG, atau WebP.",
  "terlalu-besar": "Foto terlalu besar. Pilih foto lain atau kecilkan ukurannya.",
  kosong: "File foto kosong.",
  pengisi: "Pengisi acara belum tersimpan atau tidak ditemukan. Isi nama dan coba lagi.",
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

  const context = await getWorkContextForInvitation(new URL(request.url).searchParams.get("invitationId"));
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
    (kind !== "cover" && kind !== "galeri" && kind !== "logo_penyelenggara" && kind !== "logo_eo" && kind !== "pengisi_acara")
  ) {
    return fail("Data unggahan tidak lengkap.", 400);
  }
  if (file.size > MAX_PHOTO_BYTES) return fail(MESSAGES["terlalu-besar"], 413);

  if (kind === "pengisi_acara") {
    const pengisiId = formData.get("pengisiId");
    if (typeof pengisiId !== "string") return fail(MESSAGES.pengisi, 422);
    const result = await setPengisiPhoto(db, invitation.id, pengisiId, { fileName: file.name, bytes: Buffer.from(await file.arrayBuffer()) });
    if (!result.ok) return fail(MESSAGES[result.error], 422);
    revalidatePath(`/undangan/${invitation.id}/isi`);
    return Response.json({ ok: true, photo: result.photo });
  }

  const result = await addPhoto(db, invitation.id, {
    kind,
    fileName: file.name,
    bytes: Buffer.from(await file.arrayBuffer()),
  });
  if (!result.ok) {
    return fail(MESSAGES[result.error], result.error === "penuh" ? 409 : 422);
  }

  revalidatePath(`/undangan/${invitation.id}/isi`);
  return Response.json({ ok: true, id: result.photo.id });
}

export async function DELETE(request: Request) {
  if (!sameOrigin(request)) return fail("Permintaan ditolak.", 403);
  const url = new URL(request.url);
  const context = await getWorkContextForInvitation(url.searchParams.get("invitationId"));
  if (!context) return fail("Sesi berakhir. Masuk lagi untuk melanjutkan.", 401);
  if (!context.invitation) return fail("Undangan tidak ditemukan.", 404);
  const pengisiId = url.searchParams.get("pengisiId");
  if (!pengisiId) return fail(MESSAGES.pengisi, 422);
  const result = await setPengisiPhoto(db, context.invitation.id, pengisiId, null);
  if (!result.ok) return fail(MESSAGES[result.error], 422);
  revalidatePath(`/undangan/${context.invitation.id}/isi`);
  return Response.json({ ok: true });
}
