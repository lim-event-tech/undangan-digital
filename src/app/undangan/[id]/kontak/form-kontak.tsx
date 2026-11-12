"use client";

import { useActionState } from "react";
import { kolom, labelKolom, pesanGalat, tombolGelap } from "@/components/ui";
import { simpanKontakSayaAction, type SimpanKontakState } from "./actions";

export function FormKontak({
  invitationId,
  awal,
}: {
  invitationId: string;
  awal: { name: string; phone: string; email: string };
}) {
  const simpanAction = simpanKontakSayaAction.bind(null, invitationId);
  const [state, formAction, memproses] = useActionState<SimpanKontakState, FormData>(
    simpanAction,
    null,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state?.ok ? (
        <p role="status" className="m-0 rounded-[10px] bg-hijau-bg p-3 text-sm font-medium text-hijau">
          {state.message}
        </p>
      ) : null}

      {state && !state.ok && state.error ? (
        <p role="alert" className={`m-0 ${pesanGalat}`}>
          {state.error}
        </p>
      ) : null}

      <label className={labelKolom}>
        Nama narahubung
        <input
          name="nama"
          type="text"
          maxLength={120}
          defaultValue={awal.name}
          placeholder="Nama Anda atau narahubung tamu Anda"
          className={kolom}
        />
        {state && !state.ok && state.errors?.nama ? (
          <span className={pesanGalat}>{state.errors.nama}</span>
        ) : null}
      </label>

      <label className={labelKolom}>
        Nomor WhatsApp
        <input
          name="telepon"
          type="tel"
          maxLength={20}
          defaultValue={awal.phone}
          placeholder="mis. 081234567890"
          className={kolom}
        />
        <span className="text-xs text-redup">
          Tombol WhatsApp narahubung pada undangan tamu Anda akan langsung mengarah ke nomor ini.
        </span>
        {state && !state.ok && state.errors?.telepon ? (
          <span className={pesanGalat}>{state.errors.telepon}</span>
        ) : null}
      </label>

      <label className={labelKolom}>
        Alamat email (opsional)
        <input
          name="email"
          type="email"
          maxLength={254}
          defaultValue={awal.email}
          placeholder="email@contoh.com"
          className={kolom}
        />
        {state && !state.ok && state.errors?.email ? (
          <span className={pesanGalat}>{state.errors.email}</span>
        ) : null}
      </label>

      <div className="mt-2 flex items-center justify-end">
        <button type="submit" disabled={memproses} className={tombolGelap}>
          {memproses ? "Menyimpan…" : "Simpan narahubung"}
        </button>
      </div>
    </form>
  );
}

