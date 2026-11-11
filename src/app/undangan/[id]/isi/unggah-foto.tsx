"use client";

import { useInvitationAction, useInvitationId } from "@/components/invitation-context";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Ikon } from "@/components/ikon";
import { pesanGalat, tombolTerang } from "@/components/ui";
import type { SampulSettings } from "@/lib/invitations/tampilan";
import type { PhotoInfo } from "@/lib/photos/service";
import { hapusFotoAction, simpanSampulAction } from "./actions";
import { Saklar } from "./bidang";
import { KartuBagian } from "./kartu-bagian";
import { unggahFoto } from "./kompres";
import { StatusSimpan, useAutoSave } from "./use-auto-save";

const ACCEPT = "image/jpeg,image/png,image/webp";
const LABEL_UNGGAH = `${tombolTerang} cursor-pointer focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-emas-muda`;

function ukuran(bytes: number): string {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1).replace(".", ",")} MB`;
  return `${Math.max(1, Math.round(bytes / 1000))} KB`;
}

function useUnggah() {
  const invitationId = useInvitationId();
  const router = useRouter();
  const [mengunggah, setMengunggah] = useState(false);
  const [galat, setGalat] = useState<string | undefined>();

  async function unggah(file: File) {
    setGalat(undefined);
    setMengunggah(true);
    const result = await unggahFoto(invitationId, file);
    if (!result.ok) setGalat(`${file.name}: ${result.error}`);
    setMengunggah(false);
    router.refresh();
  }

  return { mengunggah, galat, unggah };
}

function ContohUkuranPoster() {
  return (
    <figure className="m-0 flex w-44 shrink-0 flex-col items-center gap-2">
      <div
        className="relative aspect-[9/19] w-full rounded-[22px] border-2 border-tinta/70 bg-kertas"
        role="img"
        aria-label="Contoh ukuran poster pada halaman awal"
      >
        <div className="absolute inset-[5px] rounded-[16px] border border-garis" />
        <div className="absolute top-[3.5%] right-[7%] bottom-[19%] left-[7%] flex flex-col items-center justify-center rounded-sm border-2 border-dashed border-emas bg-emas/10 px-1 text-center">
          <span className="text-[11px] font-semibold text-emas-tua">Area poster</span>
        </div>
        <div className="absolute right-[7%] bottom-[8%] left-[7%] flex h-[7%] items-center justify-center rounded-sm bg-tinta text-[10px] font-medium text-white">
          Buka undangan
        </div>
      </div>
      <figcaption className="text-center text-xs leading-snug text-redup">
        Dari tepi atas bingkai sampai tepat di atas tombol Buka undangan.
      </figcaption>
    </figure>
  );
}

export function BagianPoster({ poster, sampul }: { poster: PhotoInfo | null; sampul: SampulSettings }) {
  const { mengunggah, galat, unggah } = useUnggah();
  const hapus = useInvitationAction(hapusFotoAction);
  const { formRef, status, formError, formProps } = useAutoSave(simpanSampulAction);

  return (
    <KartuBagian
      id="sampul"
      judul="Poster halaman awal"
      deskripsi="Poster tampil di halaman awal undangan dan dipakai sebagai gambar pratinjau tautan. Opsional. Poster ditampilkan utuh tanpa dipotong; bila rasionya berbeda, akan ada ruang kosong di sisinya."
      aksi={
        <span className="rounded-full bg-krem px-2.5 py-0.5 text-xs font-medium text-emas-tua">
          Opsional
        </span>
      }
    >
      <div className="flex flex-wrap items-start gap-6">
        <ContohUkuranPoster />
        <div className="flex min-w-0 flex-1 basis-60 flex-col items-start gap-4">
          <p className="m-0 text-sm leading-relaxed text-redup-2">JPG, PNG, atau WebP, dikompres otomatis dan maksimal 3 MB.</p>
          {poster ? (
            <div className="flex items-start gap-4">
              <Image
                src={`/foto/${poster.id}`}
                alt="Poster halaman awal"
                width={120}
                height={240}
                unoptimized
                className="h-auto max-h-60 w-24 rounded-lg border border-garis object-contain"
              />
              <p className="m-0 text-sm text-redup-2">
                {poster.fileName} · {ukuran(poster.sizeBytes)} · siap
              </p>
            </div>
          ) : (
            <p className="m-0 rounded-lg border border-dashed border-garis-input bg-kertas px-4 py-6 text-sm text-redup">
              Belum ada poster. Halaman awal memakai judul dan hiasan template.
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <label className={LABEL_UNGGAH} aria-disabled={mengunggah}>
              <Ikon nama="unduh" ukuran={16} className="rotate-180" />
              {mengunggah ? "Mengunggah…" : poster ? "Ganti poster" : "Unggah poster"}
              <input
                type="file"
                accept={ACCEPT}
                disabled={mengunggah}
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = "";
                  if (file) void unggah(file);
                }}
              />
            </label>
            {poster ? (
              <form action={hapus}>
                <input type="hidden" name="id" value={poster.id} />
                <button type="submit" className={tombolTerang}>
                  <Ikon nama="sampah" ukuran={16} />
                  Hapus poster
                </button>
              </form>
            ) : null}
          </div>
          {galat ? (
            <p role="alert" className={`m-0 ${pesanGalat}`}>
              {galat}
            </p>
          ) : null}
        </div>
      </div>
      <form ref={formRef} {...formProps} className="flex flex-col divide-y divide-garis-halus border-t border-garis-halus pt-2">
        <div className="flex items-center justify-between gap-3 pt-1">
          <StatusSimpan status={status} />
        </div>
        <Saklar
          label="Sembunyikan tulisan halaman awal"
          hint={poster ? "Judul, tanggal, lokasi, dan nama tamu tidak ditampilkan di atas poster. Tombol Buka undangan tetap ada." : "Tersedia setelah poster diunggah."}
          name="sembunyikanTeks"
          defaultChecked={sampul.sembunyikanTeks}
          disabled={!poster}
        />
        {formError ? <p role="alert" className={`m-0 ${pesanGalat}`}>{formError}</p> : null}
      </form>
    </KartuBagian>
  );
}
