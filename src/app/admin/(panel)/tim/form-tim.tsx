"use client";

import { useActionState } from "react";
import { kolom, labelKolom, pesanGalat, tombolBahaya, tombolGelap, tombolTerang } from "@/components/ui";
import { ADMIN_MIN_PASSWORD } from "@/lib/admin/team-constants";
import type { SaveResult } from "@/lib/save-result";
import { cabutAdminAction, gantiSandiAction, tambahAdminAction } from "./actions";

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

export function FormTambahAdmin({ peran }: { peran: { key: string; label: string }[] }) {
  const { aksi, memproses, errors, formError, sukses } = useForm(tambahAdminAction);
  return (
    <form action={aksi} key={sukses ? "selesai" : "baru"} className="grid gap-3.5 sm:grid-cols-2">
      <label className={labelKolom}>
        Nama
        <input name="nama" required maxLength={80} autoComplete="off" aria-invalid={errors.nama ? true : undefined} className={kolom} />
        <Galat pesan={errors.nama} />
      </label>
      <label className={labelKolom}>
        Email
        <input name="email" type="email" required autoComplete="off" aria-invalid={errors.email ? true : undefined} className={kolom} />
        <Galat pesan={errors.email} />
      </label>
      <label className={labelKolom}>
        Peran
        <select name="peran" defaultValue={peran.find((p) => p.key !== "super")?.key ?? peran[0]?.key} className={kolom}>
          {peran.map((role) => (
            <option key={role.key} value={role.key}>
              {role.label}
            </option>
          ))}
        </select>
        <Galat pesan={errors.peran} />
      </label>
      <label className={labelKolom}>
        Kata sandi awal (opsional)
        <input
          name="kataSandi"
          type="password"
          minLength={ADMIN_MIN_PASSWORD}
          autoComplete="new-password"
          aria-invalid={errors.kataSandi ? true : undefined}
          className={kolom}
        />
        <span className="text-xs font-normal text-redup">
          Kosongkan bila admin masuk dengan akun Google: cukup isi email Google-nya. Bila diisi, minimal {ADMIN_MIN_PASSWORD} karakter dan
          disampaikan lewat jalur aman.
        </span>
        <Galat pesan={errors.kataSandi} />
      </label>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <button type="submit" disabled={memproses} className={tombolGelap}>
          {memproses ? "Menambah…" : "Tambah admin"}
        </button>
        {sukses ? (
          <span role="status" className="text-sm font-medium text-hijau">
            Admin ditambahkan.
          </span>
        ) : null}
        <Galat pesan={formError} />
      </div>
    </form>
  );
}

export function FormGantiSandi({ id, nama }: { id: string; nama: string }) {
  const { aksi, memproses, errors, formError, sukses } = useForm(gantiSandiAction);
  return (
    <details className="text-sm">
      <summary className="inline-flex min-h-10 cursor-pointer items-center font-medium text-emas">
        Atur kata sandi
      </summary>
      <form action={aksi} className="mt-2 flex flex-col gap-2.5">
        <input type="hidden" name="id" value={id} />
        <label className={labelKolom}>
          Kata sandi baru untuk {nama}
          <input
            name="kataSandi"
            type="password"
            required
            minLength={ADMIN_MIN_PASSWORD}
            autoComplete="new-password"
            aria-invalid={errors.kataSandi ? true : undefined}
            className={kolom}
          />
          <Galat pesan={errors.kataSandi} />
        </label>
        <Galat pesan={formError} />
        {sukses ? (
          <span role="status" className="text-[13px] font-medium text-hijau">
            Kata sandi disimpan dan semua sesinya dikeluarkan.
          </span>
        ) : null}
        <div>
          <button type="submit" disabled={memproses} className={tombolTerang}>
            {memproses ? "Menyimpan…" : "Simpan kata sandi"}
          </button>
        </div>
      </form>
    </details>
  );
}

export function TombolCabut({ id, nama }: { id: string; nama: string }) {
  return (
    <form
      action={cabutAdminAction}
      onSubmit={(event) => {
        if (!window.confirm(`Cabut akses admin ${nama}? Akun admin ini akan dihapus.`)) event.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button type="submit" className={`${tombolBahaya} min-h-10 px-3.5`}>
        Cabut akses
      </button>
    </form>
  );
}
