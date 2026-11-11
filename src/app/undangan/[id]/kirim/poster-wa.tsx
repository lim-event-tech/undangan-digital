"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { KartuBagian } from "@/app/undangan/[id]/isi/kartu-bagian";
import { Saklar } from "@/app/undangan/[id]/isi/bidang";
import { unggahFoto } from "@/app/undangan/[id]/isi/kompres";
import { StatusSimpan, useAutoSave } from "@/app/undangan/[id]/isi/use-auto-save";
import { useInvitationAction, useInvitationId } from "@/components/invitation-context";
import { pesanGalat, tombolTerang } from "@/components/ui";
import type { WaPosterSettings } from "@/lib/invitations/content";
import type { PhotoInfo } from "@/lib/photos/service";
import { hapusPosterWaAction, simpanPosterWaAction } from "./actions";

const ACCEPT = "image/jpeg,image/png,image/webp";

function Pratinjau({ foto, alt }: { foto: PhotoInfo | null; alt: string }) {
  return foto ? (
    <Image src={`/foto/${foto.id}`} alt={alt} width={120} height={240} unoptimized className="h-auto max-h-48 w-20 rounded-lg border border-garis object-contain" />
  ) : null;
}

export function PosterWa({ pengaturan, posterIsi, posterWa }: { pengaturan: WaPosterSettings; posterIsi: PhotoInfo | null; posterWa: PhotoInfo | null }) {
  const invitationId = useInvitationId();
  const router = useRouter();
  const hapus = useInvitationAction(hapusPosterWaAction);
  const { formRef, status, formError, formProps } = useAutoSave(simpanPosterWaAction);
  const [kirim, setKirim] = useState(pengaturan.kirim);
  const [sumber, setSumber] = useState(pengaturan.sumber);
  const [mengunggah, setMengunggah] = useState(false);
  const [galat, setGalat] = useState<string | undefined>();

  async function unggah(file: File) {
    setGalat(undefined);
    setMengunggah(true);
    const hasil = await unggahFoto(invitationId, file, "poster_wa");
    if (!hasil.ok) setGalat(`${file.name}: ${hasil.error}`);
    setMengunggah(false);
    router.refresh();
  }

  const kurang = kirim && (sumber === "sama" ? !posterIsi : !posterWa);

  return (
    <KartuBagian
      id="poster-wa"
      judul="Poster pada pesan WhatsApp"
      deskripsi="Bila aktif, kirim otomatis mengirim poster sebagai gambar dengan pesan undangan sebagai keterangannya. Tombol WhatsApp manual tidak bisa melampirkan gambar, jadi lampirkan sendiri."
      aksi={<StatusSimpan status={status} />}
    >
      <form ref={formRef} {...formProps} className="flex flex-col gap-3">
        <Saklar label="Sertakan poster saat kirim otomatis" hint="Berlaku untuk pesan undangan, bukan pengingat." name="kirim" checked={kirim} onChange={(event) => setKirim(event.target.checked)} />
        {kirim ? (
          <fieldset className="flex flex-col gap-3 border-0 p-0">
            <legend className="mb-1 text-sm font-medium">Poster yang dikirim</legend>
            <label className="flex items-start gap-3 text-sm">
              <input type="radio" name="sumber" value="sama" checked={sumber === "sama"} onChange={() => setSumber("sama")} className="mt-1 size-4" />
              <span className="flex flex-col gap-2">
                <span>Sama dengan poster di Isi undangan</span>
                {posterIsi ? <Pratinjau foto={posterIsi} alt="Poster di Isi undangan" /> : <span className="text-[13px] text-redup">Belum ada poster di Isi undangan.</span>}
              </span>
            </label>
            <label className="flex items-start gap-3 text-sm">
              <input type="radio" name="sumber" value="khusus" checked={sumber === "khusus"} onChange={() => setSumber("khusus")} className="mt-1 size-4" />
              <span>Poster berbeda khusus WhatsApp</span>
            </label>
          </fieldset>
        ) : null}
        {formError ? <p role="alert" className={`m-0 ${pesanGalat}`}>{formError}</p> : null}
      </form>
      {kirim && sumber === "khusus" ? (
        <div className="flex flex-wrap items-start gap-4">
          <Pratinjau foto={posterWa} alt="Poster khusus WhatsApp" />
          <div className="flex flex-col items-start gap-2">
            <p className="m-0 text-[13px] text-redup">JPG, PNG, atau WebP, dikompres otomatis dan maksimal 3 MB.</p>
            <div className="flex flex-wrap gap-2">
              <label className={`${tombolTerang} cursor-pointer`} aria-disabled={mengunggah}>
                {mengunggah ? "Mengunggah…" : posterWa ? "Ganti poster WhatsApp" : "Unggah poster WhatsApp"}
                <input type="file" accept={ACCEPT} disabled={mengunggah} className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ""; if (file) void unggah(file); }} />
              </label>
              {posterWa ? (
                <form action={hapus}>
                  <input type="hidden" name="id" value={posterWa.id} />
                  <button type="submit" className={tombolTerang}>Hapus poster WhatsApp</button>
                </form>
              ) : null}
            </div>
            {galat ? <p role="alert" className={`m-0 ${pesanGalat}`}>{galat}</p> : null}
          </div>
        </div>
      ) : null}
      {kurang ? (
        <p role="status" className="m-0 rounded-[10px] bg-krem p-3 text-sm leading-relaxed text-emas-tua">
          Poster belum tersedia, jadi kirim otomatis akan ditolak sampai poster diunggah atau pilihan ini dimatikan.
        </p>
      ) : null}
    </KartuBagian>
  );
}
