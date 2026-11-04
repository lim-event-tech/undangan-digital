"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Ikon } from "@/components/ikon";
import { pesanGalat, tombolTerang } from "@/components/ui";
import { MAX_GALLERY_PHOTOS } from "@/lib/images";
import type { PhotoInfo } from "@/lib/photos/service";
import { hapusFotoAction } from "./actions";
import { KartuBagian } from "./kartu-bagian";
import { unggahFoto } from "./kompres";

const ACCEPT = "image/jpeg,image/png,image/webp";
const LABEL_UNGGAH = `${tombolTerang} cursor-pointer focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-emas-muda`;

function ukuran(bytes: number): string {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1).replace(".", ",")} MB`;
  return `${Math.max(1, Math.round(bytes / 1000))} KB`;
}

function useUnggah(kind: "cover" | "galeri") {
  const router = useRouter();
  const [mengunggah, setMengunggah] = useState(false);
  const [galat, setGalat] = useState<string | undefined>();

  async function unggah(files: File[]) {
    setGalat(undefined);
    setMengunggah(true);
    for (const file of files) {
      const result = await unggahFoto(file, kind);
      if (!result.ok) {
        setGalat(`${file.name}: ${result.error}`);
        break;
      }
    }
    setMengunggah(false);
    router.refresh();
  }

  return { mengunggah, galat, unggah };
}

export function BagianCover({ cover }: { cover: PhotoInfo | null }) {
  const { mengunggah, galat, unggah } = useUnggah("cover");

  return (
    <KartuBagian
      id="sampul"
      judul="Sampul"
      deskripsi="Foto utama yang pertama dilihat tamu. JPG atau PNG, dikompres otomatis."
      aksi={
        <span className="rounded-full bg-krem px-2.5 py-0.5 text-xs font-medium text-emas-tua">
          Wajib
        </span>
      }
    >
      <div className="flex flex-wrap items-start gap-5">
        {cover ? (
          <Image
            src={`/foto/${cover.id}`}
            alt="Foto cover undangan"
            width={240}
            height={320}
            unoptimized
            className="h-auto max-h-80 w-48 rounded-lg border border-garis object-cover"
          />
        ) : (
          <div className="flex h-40 w-48 items-center justify-center rounded-lg border border-dashed border-garis-input bg-kertas px-3 text-center text-sm text-redup">
            Foto cover belum ada
          </div>
        )}
        <div className="flex flex-col items-start gap-2">
          {cover ? (
            <p className="m-0 text-sm text-redup-2">
              {cover.fileName} · {ukuran(cover.sizeBytes)} · siap
            </p>
          ) : null}
          <label className={LABEL_UNGGAH} aria-disabled={mengunggah}>
            <Ikon nama="unduh" ukuran={16} className="rotate-180" />
            {mengunggah ? "Mengunggah…" : cover ? "Ganti foto cover" : "Unggah foto cover"}
            <input
              type="file"
              accept={ACCEPT}
              disabled={mengunggah}
              className="sr-only"
              onChange={(event) => {
                const files = Array.from(event.target.files ?? []);
                event.target.value = "";
                if (files.length > 0) void unggah(files.slice(0, 1));
              }}
            />
          </label>
          {galat ? (
            <p role="alert" className={`m-0 ${pesanGalat}`}>
              {galat}
            </p>
          ) : null}
        </div>
      </div>
    </KartuBagian>
  );
}

export function BagianGaleri({ foto }: { foto: PhotoInfo[] }) {
  const { mengunggah, galat, unggah } = useUnggah("galeri");
  const penuh = foto.length >= MAX_GALLERY_PHOTOS;

  return (
    <KartuBagian
      id="galeri"
      judul="Galeri"
      deskripsi={`${foto.length} dari ${MAX_GALLERY_PHOTOS} foto · dikompres otomatis`}
      aksi={
        <label
          className={`${LABEL_UNGGAH} ${penuh || mengunggah ? "pointer-events-none opacity-45" : ""}`}
          aria-disabled={penuh || mengunggah}
        >
          {mengunggah ? "Mengunggah…" : "+ Tambah foto"}
          <input
            type="file"
            accept={ACCEPT}
            multiple
            disabled={penuh || mengunggah}
            className="sr-only"
            onChange={(event) => {
              const files = Array.from(event.target.files ?? []);
              event.target.value = "";
              const sisa = MAX_GALLERY_PHOTOS - foto.length;
              if (files.length > 0) void unggah(files.slice(0, sisa));
            }}
          />
        </label>
      }
    >
      {galat ? (
        <p role="alert" className={`m-0 ${pesanGalat}`}>
          {galat}
        </p>
      ) : null}
      {foto.length === 0 ? (
        <p className="m-0 rounded-lg border border-dashed border-garis-input bg-kertas px-4 py-8 text-center text-sm text-redup">
          Belum ada foto galeri. Bagian ini disembunyikan dari undangan sampai ada foto.
        </p>
      ) : (
        <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0 sm:grid-cols-3 md:grid-cols-4">
          {foto.map((item, index) => (
            <li key={item.id} className="relative">
              <Image
                src={`/foto/${item.id}`}
                alt={`Foto galeri ${index + 1}`}
                width={240}
                height={240}
                unoptimized
                className="aspect-square w-full rounded-lg border border-garis object-cover"
              />
              <form action={hapusFotoAction} className="absolute top-1.5 right-1.5">
                <input type="hidden" name="id" value={item.id} />
                <button
                  type="submit"
                  aria-label={`Hapus foto galeri ${index + 1}`}
                  className="inline-flex size-9 items-center justify-center rounded-full bg-white/95 text-galat shadow-sm transition-colors hover:bg-galat-bg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emas-muda"
                >
                  <Ikon nama="sampah" ukuran={16} />
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </KartuBagian>
  );
}
