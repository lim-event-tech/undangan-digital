"use client";

import { useActionState } from "react";
import { kolom, labelKolom, pesanGalat, tombolGelap, tombolTerang } from "@/components/ui";
import { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from "@/lib/auth-options-constants";
import type { SaveResult } from "@/lib/save-result";
import { aturSandiAkunAction, aturWabaAkunAction, ubahAkunAction } from "./actions";

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

export function FormAkun({
  id,
  nama,
  email,
  wabaAllowed = false,
  wabaQuota = 0,
  wabaSentCount = 0,
}: {
  id: string;
  nama: string;
  email: string;
  wabaAllowed?: boolean;
  wabaQuota?: number;
  wabaSentCount?: number;
}) {
  const profil = useForm(ubahAkunAction);
  const sandi = useForm(aturSandiAkunAction);
  return (
    <details className="text-sm">
      <summary className="inline-flex min-h-10 cursor-pointer items-center font-medium text-emas">Ubah akun &amp; WABA</summary>
      <div className="mt-2 grid gap-4 border-t border-garis-halus pt-3 md:grid-cols-3">
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
              Minimal {MIN_PASSWORD_LENGTH} karakter. Semua sesi akun ini dikeluarkan.
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

        <form action={aturWabaAkunAction} className="flex flex-col gap-2.5 rounded-lg border border-garis bg-kertas p-3">
          <input type="hidden" name="id" value={id} />
          <span className="font-semibold text-tinta text-xs">WhatsApp Resmi (WABA)</span>
          <label className="flex items-center gap-2 text-xs font-medium text-tinta">
            <input
              type="checkbox"
              name="wabaAllowed"
              defaultChecked={wabaAllowed}
              value="1"
              className="size-4 accent-emas"
            />
            Izinkan WABA Resmi
          </label>

          <div className="flex flex-col gap-1 text-xs">
            <span className="text-redup">Kredit saat ini: <strong className="text-tinta font-semibold">{wabaQuota} pesan</strong></span>
            <span className="text-redup">Total terkirim: <strong className="text-tinta font-semibold">{wabaSentCount} pesan</strong></span>
          </div>

          <div className="flex flex-col gap-1 text-xs">
            <label className="font-medium text-redup-2">Tambah / Atur Kredit</label>
            <div className="flex gap-1.5">
              <select name="mode" defaultValue="delta" className="h-9 rounded border border-garis-input bg-white px-1 text-xs">
                <option value="delta">+ / - Kredit</option>
                <option value="set">Set Pasti</option>
              </select>
              <input
                type="number"
                name="jumlah"
                placeholder="100"
                className="h-9 w-20 rounded border border-garis-input bg-white px-2 text-xs text-tinta"
              />
            </div>
            <span className="text-[11px] text-redup">Gunakan angka minus (misal -50) untuk mengurangi kuota.</span>
          </div>

          <div className="pt-1">
            <button type="submit" className={`${tombolTerang} text-xs py-1.5 h-auto`}>
              Simpan WABA
            </button>
          </div>
        </form>
      </div>
    </details>
  );
}
