"use client";

import { useActionState } from "react";
import { kolom, labelKolom, pesanGalat, tombolBahaya, tombolTerang } from "@/components/ui";
import type { SaveResult } from "@/lib/save-result";
import { hapusPermanenAction, ubahBatasAction } from "./actions";

type Aksi = (state: SaveResult | null, formData: FormData) => Promise<SaveResult>;

function useForm(action: Aksi) {
  const [hasil, aksi, memproses] = useActionState<SaveResult | null, FormData>(action, null);
  const galat = hasil && !hasil.ok ? hasil : null;
  return { aksi, memproses, galat, sukses: hasil?.ok === true };
}

function Pesan({ galat, sukses, teks }: { galat: { errors?: Record<string, string>; formError?: string } | null; sukses: boolean; teks: string }) {
  return (
    <>
      {galat?.formError ? (
        <p role="alert" className={`m-0 ${pesanGalat}`}>
          {galat.formError}
        </p>
      ) : null}
      {sukses ? (
        <p role="status" className="m-0 text-[13px] font-medium text-hijau">
          {teks}
        </p>
      ) : null}
    </>
  );
}

export function FormBatasAdmin({ id, batas, jam, hariIni, boleh }: { id: string; batas: string; jam: string; hariIni: string; boleh: boolean }) {
  const { aksi, memproses, galat, sukses } = useForm(ubahBatasAction);
  return (
    <form action={aksi} className="flex flex-col gap-2.5">
      <input type="hidden" name="id" value={id} />
      <label className={labelKolom}>
        Batas waktu RSVP
        <input
          name="batas"
          type="date"
          min={hariIni}
          defaultValue={batas}
          disabled={!boleh}
          aria-invalid={galat?.errors?.batas ? true : undefined}
          className={kolom}
        />
      </label>
      <label className={labelKolom}>
        Jam batas (WIB)
        <input
          name="batasJam"
          type="time"
          defaultValue={jam || "23:59"}
          disabled={!boleh}
          aria-invalid={galat?.errors?.batasJam ? true : undefined}
          className={kolom}
        />
      </label>
      {galat?.errors?.batas || galat?.errors?.batasJam ? (
        <p role="alert" className={`m-0 ${pesanGalat}`}>
          {galat.errors.batas ?? galat.errors.batasJam}
        </p>
      ) : null}
      <p className="m-0 text-xs text-redup">Kosongkan tanggal bila tanpa batas. Konfirmasi ditutup pada jam yang dipilih.</p>
      <Pesan galat={galat} sukses={sukses} teks="Batas RSVP diperbarui." />
      {boleh ? (
        <div>
          <button type="submit" disabled={memproses} className={tombolTerang}>
            {memproses ? "Menyimpan…" : "Simpan batas"}
          </button>
        </div>
      ) : null}
    </form>
  );
}

export function FormHapus({ id, slug }: { id: string; slug: string }) {
  const { aksi, memproses, galat } = useForm(hapusPermanenAction);
  return (
    <form action={aksi} className="flex flex-col gap-2.5">
      <input type="hidden" name="id" value={id} />
      <label className={labelKolom}>
        Ketik {slug} untuk konfirmasi
        <input
          name="konfirmasi"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          aria-invalid={galat?.errors?.konfirmasi ? true : undefined}
          className={kolom}
        />
      </label>
      {galat?.errors?.konfirmasi ? (
        <p role="alert" className={`m-0 ${pesanGalat}`}>
          {galat.errors.konfirmasi}
        </p>
      ) : null}
      <Pesan galat={galat} sukses={false} teks="" />
      <div>
        <button type="submit" disabled={memproses} className={tombolBahaya}>
          {memproses ? "Menghapus…" : "Hapus permanen"}
        </button>
      </div>
    </form>
  );
}
