"use client";

import { useInvitationAction, useInvitationId } from "@/components/invitation-context";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useActionState, useState } from "react";
import { Ikon } from "@/components/ikon";
import { kolom, pesanGalat, tombolGelap, tombolTerang } from "@/components/ui";
import { MAX_PHOTO_BYTES } from "@/lib/images";
import { MAX_MUSIC_BYTES } from "@/lib/music/audio";
import type { MusicInfo } from "@/lib/music/service";
import type { PhotoInfo } from "@/lib/photos/service";
import type { SaveResult } from "@/lib/save-result";
import { CUSTOM_SLUG_MAX } from "@/lib/slug";
import { hapusFotoAction, hapusMusikAction, simpanMusikAction, simpanSlugAction } from "./actions";
import { Saklar } from "./bidang";
import { KartuBagian } from "./kartu-bagian";
import { StatusSimpan, useAutoSave } from "./use-auto-save";

const LABEL_UNGGAH = `${tombolTerang} cursor-pointer focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-emas-muda`;

function ukuran(bytes: number): string {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1).replace(".", ",")} MB`;
  return `${Math.max(1, Math.round(bytes / 1000))} KB`;
}

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
    {foto ? <Image src={`/foto/${foto.id}`} alt={label} width={foto.width || 180} height={foto.height || 100} unoptimized className="mx-auto h-auto max-h-25 w-auto max-w-full bg-white object-contain" /> : <p className="m-0 text-sm text-redup">Belum ada logo</p>}
    <p className="m-0 text-xs text-redup">Opsional. JPG, PNG, atau WebP, maksimal 3 MB. Transparansi dipertahankan.</p>
    <label className={LABEL_UNGGAH}>
      {mengunggah ? "Mengunggah..." : foto ? `Ganti ${label.toLowerCase()}` : `Unggah ${label.toLowerCase()}`}
      <input type="file" accept="image/jpeg,image/png,image/webp" disabled={mengunggah} className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ""; if (file) void unggah(file); }} />
    </label>
    {foto ? <form action={hapus}><input type="hidden" name="id" value={foto.id} /><button className={tombolTerang} type="submit">Hapus {label.toLowerCase()}</button></form> : null}
    {galat ? <p role="alert" className={pesanGalat}>{galat}</p> : null}
  </div>;
}

export function BagianMusik({ aktif, musik }: { aktif: boolean; musik: MusicInfo | null }) {
  const invitationId = useInvitationId();
  const hapusMusikActionForInvitation = useInvitationAction(hapusMusikAction);

  const router = useRouter();
  const { formRef, status, formError, formProps } = useAutoSave(simpanMusikAction);
  const [mengunggah, setMengunggah] = useState(false);
  const [galat, setGalat] = useState<string | undefined>();

  async function unggah(file: File) {
    setGalat(undefined);
    if (file.size > MAX_MUSIC_BYTES) {
      setGalat("Musik terlalu besar. Pilih file di bawah 6 MB.");
      return;
    }
    setMengunggah(true);
    const body = new FormData();
    body.set("file", file);
    const result = await kirimBerkas(`/api/musik?invitationId=${invitationId}`, body, "Musik gagal diunggah.");
    setMengunggah(false);
    if (!result.ok) setGalat(result.error);
    router.refresh();
  }

  return (
    <KartuBagian
      id="musik"
      judul="Musik latar"
      deskripsi="Tamu menekan tombol putar sendiri, musik tidak berputar otomatis. Gunakan musik yang Anda berhak memakainya."
      aksi={<StatusSimpan status={status} />}
    >
      <form ref={formRef} {...formProps} className="flex flex-col">
        <Saklar
          label="Tampilkan tombol putar musik"
          hint={musik ? undefined : "Unggah file musik dulu agar tombol bisa tampil"}
          name="aktif"
          defaultChecked={aktif}
        />
        {formError ? (
          <p role="alert" className={`m-0 ${pesanGalat}`}>
            {formError}
          </p>
        ) : null}
      </form>
      <div className="flex flex-col gap-3 rounded-lg border border-garis-halus bg-kertas/60 p-4">
        {musik ? (
          <>
            <p className="m-0 text-sm text-redup-2">
              {musik.fileName} · {ukuran(musik.sizeBytes)}
            </p>
            <audio controls preload="none" src={`/musik/${musik.id}`} className="w-full max-w-md">
              Peramban ini tidak mendukung pemutar musik.
            </audio>
          </>
        ) : (
          <p className="m-0 text-sm text-redup">Belum ada file musik.</p>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <label className={LABEL_UNGGAH} aria-disabled={mengunggah}>
            <Ikon nama="unduh" ukuran={16} className="rotate-180" />
            {mengunggah ? "Mengunggah…" : musik ? "Ganti musik" : "Unggah musik"}
            <input
              type="file"
              accept="audio/mpeg,audio/mp4,audio/ogg,.mp3,.m4a,.ogg"
              disabled={mengunggah}
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (file) void unggah(file);
              }}
            />
          </label>
          {musik ? (
            <form action={hapusMusikActionForInvitation}>
              <button type="submit" className={tombolTerang}>
                Hapus musik
              </button>
            </form>
          ) : null}
        </div>
        <p className="m-0 text-xs text-redup">MP3, M4A, atau OGG, maksimal 6 MB.</p>
        {galat ? (
          <p role="alert" className={`m-0 ${pesanGalat}`}>
            {galat}
          </p>
        ) : null}
      </div>
    </KartuBagian>
  );
}

export function FormLink({ slug, terkunci }: { slug: string; terkunci: boolean }) {
  const simpanSlugActionForInvitation = useInvitationAction(simpanSlugAction);

  const [hasil, aksi, menyimpan] = useActionState<SaveResult | null, FormData>(
    simpanSlugActionForInvitation,
    null,
  );
  const galat = hasil && !hasil.ok ? hasil : null;

  return (
    <KartuBagian
      id="link"
      judul="Link undangan"
      deskripsi="Tiap tamu mendapat link pribadi dengan kode unik di belakang nama link ini."
    >
      <form action={aksi} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1.5 text-[13px] font-medium">
          Nama link
          <span className="flex items-center overflow-hidden rounded-md border border-garis-input bg-white focus-within:border-emas-muda focus-within:ring-3 focus-within:ring-emas-muda/20">
            <span className="flex min-h-11 items-center border-r border-garis-halus bg-kertas px-3 text-sm font-medium text-redup-2">
              /
            </span>
            <input
              name="slug"
              defaultValue={slug}
              disabled={terkunci}
              required
              maxLength={CUSTOM_SLUG_MAX}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              aria-invalid={galat?.errors?.slug ? true : undefined}
              className={`${kolom} min-w-0 flex-1 rounded-none border-0 focus:ring-0`}
            />
            <span className="hidden min-h-11 items-center border-l border-garis-halus bg-kertas px-3 text-sm text-redup sm:flex">
              /kode-tamu
            </span>
          </span>
        </label>
        {galat?.errors?.slug ? (
          <p role="alert" className={`m-0 ${pesanGalat}`}>
            {galat.errors.slug}
          </p>
        ) : null}
        {galat?.formError ? (
          <p role="alert" className={`m-0 ${pesanGalat}`}>
            {galat.formError}
          </p>
        ) : null}
        {hasil?.ok ? (
          <p role="status" className="m-0 text-[13px] font-medium text-hijau">
            Link undangan diperbarui.
          </p>
        ) : null}
        <p className="m-0 text-xs leading-relaxed text-redup">
          {terkunci
            ? "Link terkunci karena sudah ada tamu yang ditandai terkirim. Mengubahnya akan membuat link yang sudah dikirim tidak berlaku."
            : "Ubah sebelum mengirim undangan. Setelah ada tamu yang ditandai terkirim, nama link terkunci."}
        </p>
        {terkunci ? null : (
          <div>
            <button type="submit" disabled={menyimpan} className={tombolGelap}>
              {menyimpan ? "Menyimpan…" : "Simpan link"}
            </button>
          </div>
        )}
      </form>
    </KartuBagian>
  );
}
