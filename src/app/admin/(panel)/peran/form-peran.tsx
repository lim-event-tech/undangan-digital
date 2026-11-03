"use client";

import { useActionState } from "react";
import { kolom, labelKolom, pesanGalat, tombolBahaya, tombolGelap, tombolTerang } from "@/components/ui";
import { ASSIGNABLE_PERMISSIONS, PERMISSION_INFO, ROLE_LABEL_MAX, type Permission } from "@/lib/admin/roles";
import type { SaveResult } from "@/lib/save-result";
import { hapusPeranAction, simpanPeranAction, tambahPeranAction } from "./actions";

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

function DaftarIzin({ aktif }: { aktif: readonly Permission[] }) {
  return (
    <fieldset className="m-0 grid gap-2 border-0 p-0 sm:grid-cols-2">
      <legend className="mb-2 p-0 text-[13px] font-medium">Izin</legend>
      {ASSIGNABLE_PERMISSIONS.map((izin) => {
        const info = PERMISSION_INFO[izin];
        const tetap = izin === "lihat";
        return (
          <label
            key={izin}
            className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-garis-halus p-3 has-[:checked]:border-emas-muda has-[:checked]:bg-krem/50"
          >
            <input
              type="checkbox"
              name="izin"
              value={izin}
              defaultChecked={tetap || aktif.includes(izin)}
              disabled={tetap}
              className="mt-0.5 size-4.5 accent-tinta"
            />
            {tetap ? <input type="hidden" name="izin" value="lihat" /> : null}
            <span className="flex flex-col gap-0.5">
              <span className="text-sm font-medium">{info.label}</span>
              <span className="text-xs leading-snug text-redup">{info.ket}</span>
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}

function KolomNama({ nilai, galat }: { nilai?: string; galat?: string }) {
  return (
    <label className={labelKolom}>
      Nama peran
      <input
        name="label"
        required
        maxLength={ROLE_LABEL_MAX}
        defaultValue={nilai}
        autoComplete="off"
        aria-invalid={galat ? true : undefined}
        className={`${kolom} max-w-sm`}
      />
      <Galat pesan={galat} />
    </label>
  );
}

export function FormPeranBaru() {
  const { aksi, memproses, errors, formError, sukses } = useForm(tambahPeranAction);
  return (
    <form action={aksi} key={sukses ? "selesai" : "baru"} className="flex flex-col gap-4">
      <KolomNama galat={errors.label} />
      <DaftarIzin aktif={[]} />
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={memproses} className={tombolGelap}>
          {memproses ? "Menambah…" : "Tambah peran"}
        </button>
        {sukses ? (
          <span role="status" className="text-sm font-medium text-hijau">
            Peran ditambahkan.
          </span>
        ) : null}
        <Galat pesan={formError} />
      </div>
    </form>
  );
}

export function FormPeran({
  peran,
  label,
  izin,
  anggota,
}: {
  peran: string;
  label: string;
  izin: readonly Permission[];
  anggota: number;
}) {
  const { aksi, memproses, errors, formError, sukses } = useForm(simpanPeranAction);
  return (
    <form action={aksi} className="flex flex-col gap-4">
      <input type="hidden" name="key" value={peran} />
      <KolomNama nilai={label} galat={errors.label} />
      <DaftarIzin aktif={izin} />
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={memproses} className={tombolTerang}>
          {memproses ? "Menyimpan…" : "Simpan peran"}
        </button>
        {sukses ? (
          <span role="status" className="text-sm font-medium text-hijau">
            Tersimpan. Berlaku untuk {anggota} anggota tim di tampilan berikutnya.
          </span>
        ) : null}
        <Galat pesan={formError} />
      </div>
    </form>
  );
}

export function TombolHapusPeran({ peran, nama }: { peran: string; nama: string }) {
  const { aksi, formError } = useForm(hapusPeranAction);
  return (
    <form
      action={aksi}
      onSubmit={(event) => {
        if (!window.confirm(`Hapus peran ${nama}?`)) event.preventDefault();
      }}
      className="flex flex-col items-start gap-1.5"
    >
      <input type="hidden" name="key" value={peran} />
      <button type="submit" className={`${tombolBahaya} min-h-10 px-3.5`}>
        Hapus peran
      </button>
      <Galat pesan={formError} />
    </form>
  );
}
