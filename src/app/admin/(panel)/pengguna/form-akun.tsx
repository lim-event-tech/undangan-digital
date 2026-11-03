"use client";

import { useActionState } from "react";
import { kolom, labelKolom, pesanGalat, tombolGelap, tombolTerang } from "@/components/ui";
import { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from "@/lib/auth-options-constants";
import type { SaveResult } from "@/lib/save-result";
import { aturSandiAkunAction, ubahAkunAction } from "./actions";

type Aksi = (state: SaveResult | null, formData: FormData) => Promise<SaveResult>;

function useForm(action: Aksi) {
  const [hasil, aksi, memproses] = useActionState<SaveResult | null, FormData>(action, null);
  return {
    aksi,
    memproses,
    errors: hasil && !hasil.ok ? (hasil.errors ?? {}) : {},
    formError: hasil && !hasil.ok ? hasil.formError : undefined,
    sukses: hasil?.ok === true,
  };
}

function Galat({ pesan }: { pesan?: string }) {
  if (!pesan) return null;
  return (
    <span role="alert" className={pesanGalat}>
      {pesan}
    </span>
  );
}

export function FormAkun({ id, nama, email }: { id: string; nama: string; email: string }) {
  const profil = useForm(ubahAkunAction);
  const sandi = useForm(aturSandiAkunAction);
  return (
    <details className="text-sm">
      <summary className="inline-flex min-h-10 cursor-pointer items-center font-medium text-emas">Ubah akun</summary>
      <div className="mt-2 grid gap-4 border-t border-garis-halus pt-3 md:grid-cols-2">
        <form action={profil.aksi} className="flex flex-col gap-2.5">
          <input type="hidden" name="id" value={id} />
          <label className={labelKolom}>
            Nama
            <input name="nama" required maxLength={80} defaultValue={nama} autoComplete="off" className={kolom} />
            <Galat pesan={profil.errors.nama} />
          </label>
          <label className={labelKolom}>
            Email
            <input name="email" type="email" required defaultValue={email} autoComplete="off" className={kolom} />
            <Galat pesan={profil.errors.email} />
          </label>
          <Galat pesan={profil.formError} />
          {profil.sukses ? (
            <span role="status" className="text-[13px] font-medium text-hijau">
              Data akun disimpan.
            </span>
          ) : null}
          <div>
            <button type="submit" disabled={profil.memproses} className={tombolGelap}>
              {profil.memproses ? "Menyimpan…" : "Simpan data"}
            </button>
          </div>
        </form>
        <form action={sandi.aksi} className="flex flex-col gap-2.5">
          <input type="hidden" name="id" value={id} />
          <label className={labelKolom}>
            Kata sandi baru
            <input
              name="kataSandi"
              type="password"
              required
              minLength={MIN_PASSWORD_LENGTH}
              maxLength={MAX_PASSWORD_LENGTH}
              autoComplete="new-password"
              className={kolom}
            />
            <span className="text-xs font-normal text-redup">
              Minimal {MIN_PASSWORD_LENGTH} karakter. Semua sesi akun ini dikeluarkan. Sampaikan lewat jalur aman.
            </span>
            <Galat pesan={sandi.errors.kataSandi} />
          </label>
          <Galat pesan={sandi.formError} />
          {sandi.sukses ? (
            <span role="status" className="text-[13px] font-medium text-hijau">
              Kata sandi disimpan.
            </span>
          ) : null}
          <div>
            <button type="submit" disabled={sandi.memproses} className={tombolTerang}>
              {sandi.memproses ? "Menyimpan…" : "Simpan kata sandi"}
            </button>
          </div>
        </form>
      </div>
    </details>
  );
}
