"use client";

import { useInvitationAction, useInvitationId } from "@/components/invitation-context";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { pesanGalat, tombolTerang } from "@/components/ui";
import { MAX_PHOTO_BYTES } from "@/lib/images";
import type { PhotoInfo } from "@/lib/photos/service";
import { hapusFotoAction } from "./actions";

const LABEL_UNGGAH = `${tombolTerang} cursor-pointer focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-emas-muda`;

async function kirimBerkas(
  url: string,
  body: FormData,
  gagal: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const response = await fetch(url, { method: "POST", body });
    if (response.ok) return { ok: true };
    const data = (await response.json().catch(() => null)) as { error?: string } | null;
    return { ok: false, error: data?.error ?? gagal };
  } catch {
    return { ok: false, error: `${gagal} Periksa koneksi, lalu coba lagi.` };
  }
}

export function UnggahLogo({ foto, jenis }: { foto: PhotoInfo | null; jenis: "logo_penyelenggara" | "logo_eo" }) {
  const invitationId = useInvitationId();
  const hapus = useInvitationAction(hapusFotoAction);
  const router = useRouter();
  const [mengunggah, setMengunggah] = useState(false);
  const [galat, setGalat] = useState<string>();
  const label = jenis === "logo_penyelenggara" ? "Logo penyelenggara" : "Logo EO";
  async function unggah(file: File) {
    setGalat(undefined);
    if (file.size > MAX_PHOTO_BYTES) { setGalat("Logo terlalu besar. Pilih file di bawah 3 MB."); return; }
    setMengunggah(true);
    const body = new FormData();
    body.set("file", file);
    body.set("jenis", jenis);
    const result = await kirimBerkas(`/api/foto?invitationId=${invitationId}`, body, "Logo gagal diunggah.");
    setMengunggah(false);
    if (!result.ok) setGalat(result.error);
    router.refresh();
  }
  return <div className="flex min-w-0 flex-col gap-3 rounded-lg border border-garis p-4">
    <h3 className="m-0 text-sm font-medium">{label}</h3>
    {foto ? <Image src={`/foto/${foto.id}`} alt={label} width={foto.width || 180} height={foto.height || 100} unoptimized className="mx-auto h-auto max-h-25 w-auto max-w-full object-contain" /> : <p className="m-0 text-sm text-redup">Belum ada logo</p>}
    <p className="m-0 text-xs text-redup">Opsional. JPG, PNG, atau WebP, maksimal 3 MB. Transparansi dipertahankan.</p>
    <label className={LABEL_UNGGAH}>
      {mengunggah ? "Mengunggah..." : foto ? `Ganti ${label.toLowerCase()}` : `Unggah ${label.toLowerCase()}`}
      <input type="file" accept="image/jpeg,image/png,image/webp" disabled={mengunggah} className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ""; if (file) void unggah(file); }} />
    </label>
    {foto ? <form action={hapus}><input type="hidden" name="id" value={foto.id} /><button className={tombolTerang} type="submit">Hapus {label.toLowerCase()}</button></form> : null}
    {galat ? <p role="alert" className={pesanGalat}>{galat}</p> : null}
  </div>;
}
