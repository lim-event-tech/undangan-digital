"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useInvitationId } from "@/components/invitation-context";
import { pesanGalat, tombolTerang } from "@/components/ui";
import { MAX_PHOTO_BYTES } from "@/lib/images";
import type { PhotoInfo } from "@/lib/photos/service";

export function FotoPengisi({ id, foto, beforeUpload }: { id: string; foto: PhotoInfo | null; beforeUpload: () => Promise<boolean> }) {
  const invitationId = useInvitationId();
  const router = useRouter();
  const [current, setCurrent] = useState(foto);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  async function change(file: File | null) {
    setError(undefined);
    if (file && file.size > MAX_PHOTO_BYTES) { setError("Foto maksimal 3 MB."); return; }
    setBusy(true);
    try {
      if (file && !(await beforeUpload())) { setError("Isi nama pengisi acara dan periksa isian sebelum mengunggah foto."); return; }
      const body = new FormData();
      if (file) { body.set("file", file); body.set("jenis", "pengisi_acara"); body.set("pengisiId", id); }
      const response = await fetch(`/api/foto?invitationId=${invitationId}&pengisiId=${id}`, { method: file ? "POST" : "DELETE", ...(file ? { body } : {}) });
      const result = await response.json();
      if (!response.ok) { setError(result.error || "Foto belum tersimpan. Coba lagi."); return; }
      setCurrent(file ? result.photo : null);
      router.refresh();
    } catch { setError("Foto belum tersimpan. Periksa koneksi lalu coba lagi."); }
    finally { setBusy(false); }
  }
  return <div className="flex flex-col items-start gap-3" onChange={event => event.stopPropagation()}>
    <p className="m-0 text-sm font-medium">Foto pengisi acara (opsional)</p>
    {current ? <Image src={`/foto/${current.id}`} alt="Foto pengisi acara" width={current.width || 400} height={current.height || 500} unoptimized className="h-auto max-h-64 w-auto max-w-full object-contain" /> : null}
    <p className="m-0 text-xs text-redup">JPG, PNG, atau WebP, maksimal 3 MB. Foto tampil utuh dan transparansi dipertahankan.</p>
    <div className="flex flex-wrap gap-2">
      <label className={`${tombolTerang} cursor-pointer focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-emas-muda`}>
        {busy ? "Menyimpan foto..." : current ? "Ganti foto" : "Tambah foto"}
        <input aria-label="Unggah foto pengisi acara" className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={event => { const file = event.target.files?.[0]; event.target.value = ""; if (file) void change(file); }} />
      </label>
      {current ? <button type="button" className={tombolTerang} disabled={busy} onClick={() => void change(null)}>Hapus foto</button> : null}
    </div>
    {error ? <p role="alert" className={pesanGalat}>{error}</p> : null}
  </div>;
}
