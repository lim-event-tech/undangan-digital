"use client";

import { useActionState } from "react";
import { Saklar } from "@/app/undangan/isi/bidang";
import { kolom, labelKolom, pesanGalat, tombolGelap, tombolTerang } from "@/components/ui";
import type { SaveResult } from "@/lib/save-result";
import { WA_LIMITS, type WaConfig } from "@/lib/wa/config";
import { simpanWaAction, ujiKirimAction, type UjiResult } from "./actions";

function Galat({ pesan }: { pesan?: string }) {
  if (!pesan) return null;
  return (
    <span role="alert" className={pesanGalat}>
      {pesan}
    </span>
  );
}

export function FormPengaturanWa({ config }: { config: WaConfig }) {
  const [hasil, aksi, memproses] = useActionState<SaveResult | null, FormData>(simpanWaAction, null);
  const galat = hasil && !hasil.ok ? (hasil.errors ?? {}) : {};

  return (
    <form action={aksi} className="flex flex-col gap-4">
      <Saklar
        label="Izinkan pasangan memakai kirim otomatis"
        hint="Bila mati, antrean berhenti dan tombol kirim otomatis disembunyikan. Tombol kirim manual lewat wa.me tetap ada."
        name="aktif"
        defaultChecked={config.aktif}
      />
      <div className="grid gap-3.5 sm:grid-cols-3">
        <label className={labelKolom}>
          Jeda tercepat (detik)
          <input
            type="number"
            name="jedaMin"
            inputMode="numeric"
            min={WA_LIMITS.jedaMinimum}
            max={WA_LIMITS.jedaMaksimum}
            defaultValue={config.jedaMin}
            aria-invalid={galat.jedaMin ? true : undefined}
            className={kolom}
          />
          <span className="text-xs font-normal text-redup">Minimal {WA_LIMITS.jedaMinimum} detik.</span>
          <Galat pesan={galat.jedaMin} />
        </label>
        <label className={labelKolom}>
          Jeda terlama (detik)
          <input
            type="number"
            name="jedaMaks"
            inputMode="numeric"
            min={WA_LIMITS.jedaMinimum}
            max={WA_LIMITS.jedaMaksimum}
            defaultValue={config.jedaMaks}
            aria-invalid={galat.jedaMaks ? true : undefined}
            className={kolom}
          />
          <span className="text-xs font-normal text-redup">Jeda diacak di antara dua nilai ini.</span>
          <Galat pesan={galat.jedaMaks} />
        </label>
        <label className={labelKolom}>
          Batas pesan per pasangan per 24 jam
          <input
            type="number"
            name="batasHarian"
            inputMode="numeric"
            min={WA_LIMITS.batasHarianMin}
            max={WA_LIMITS.batasHarianMaks}
            defaultValue={config.batasHarian}
            aria-invalid={galat.batasHarian ? true : undefined}
            className={kolom}
          />
          <span className="text-xs font-normal text-redup">Berlaku untuk setiap pasangan sendiri-sendiri.</span>
          <Galat pesan={galat.batasHarian} />
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={memproses} className={tombolGelap}>
          {memproses ? "Menyimpan…" : "Simpan pengaturan"}
        </button>
        {hasil?.ok ? (
          <span role="status" className="text-sm font-medium text-hijau">
            Tersimpan dan tercatat di log audit.
          </span>
        ) : null}
        {hasil && !hasil.ok && hasil.formError ? (
          <span role="alert" className={pesanGalat}>
            {hasil.formError}
          </span>
        ) : null}
      </div>
    </form>
  );
}

export function FormUji({ terhubung }: { terhubung: boolean }) {
  const [hasil, aksi, memproses] = useActionState<UjiResult, FormData>(ujiKirimAction, null);

  return (
    <form action={aksi} className="flex flex-col gap-3">
      <label className={labelKolom}>
        Nomor tujuan
        <input
          type="tel"
          name="nomor"
          inputMode="tel"
          placeholder="0812xxxxxxxx"
          disabled={!terhubung}
          className={`${kolom} sm:max-w-xs`}
        />
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={!terhubung || memproses} className={tombolTerang}>
          {memproses ? "Mengirim…" : "Kirim pesan uji"}
        </button>
        {!terhubung ? <span className="text-sm text-redup">Hubungkan WhatsApp dulu.</span> : null}
        {hasil?.ok ? (
          <span role="status" className="text-sm font-medium text-hijau">
            Pesan uji terkirim.
          </span>
        ) : null}
        {hasil && !hasil.ok ? (
          <span role="alert" className={pesanGalat}>
            {hasil.error}
          </span>
        ) : null}
      </div>
    </form>
  );
}
