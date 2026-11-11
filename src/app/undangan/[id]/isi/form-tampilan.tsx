"use client";

import { useState } from "react";
import { kolom, labelKolom, pesanGalat, tombolTerang } from "@/components/ui";
import {
  FONT_PILIHAN,
  PALET_SIAP,
  WARNA_KUNCI,
  peringatanKontras,
  type TampilanSettings,
  type WarnaKustom,
} from "@/lib/invitations/tampilan";
import { simpanTampilanAction } from "./actions";
import { Saklar } from "./bidang";
import { KartuBagian } from "./kartu-bagian";
import { StatusSimpan, useAutoSave } from "./use-auto-save";

const WARNA_AWAL: WarnaKustom = PALET_SIAP[0].warna;

export function FormTampilan({ tampilan }: { tampilan: TampilanSettings }) {
  const { formRef, status, errors, formError, formProps } = useAutoSave(simpanTampilanAction);
  const [kustom, setKustom] = useState(tampilan.warna !== null);
  const [warna, setWarna] = useState<WarnaKustom>(tampilan.warna ?? WARNA_AWAL);
  const peringatan = kustom ? peringatanKontras(warna) : [];

  function ubah(next: WarnaKustom) {
    setWarna(next);
    requestAnimationFrame(() => formProps.onChange());
  }

  return (
    <KartuBagian
      id="tampilan"
      judul="Tampilan template"
      deskripsi="Atur hiasan, warna, dan font. Pengaturan ini berlaku di semua template dan langsung terlihat di pratinjau."
      aksi={<StatusSimpan status={status} />}
    >
      <form ref={formRef} {...formProps} className="flex flex-col gap-4">
        <div className="flex flex-col divide-y divide-garis-halus">
          <Saklar
            label="Tampilkan hiasan"
            hint="Ornamen sampul, bingkai, latar parallax, dan pembatas antarbagian. Matikan untuk tampilan polos."
            name="hiasan"
            defaultChecked={tampilan.hiasan}
          />
          <Saklar
            label="Pakai palet warna sendiri"
            hint="Bila dimatikan, warna bawaan template dipakai."
            name="warnaKustom"
            checked={kustom}
            onChange={(event) => setKustom(event.target.checked)}
          />
        </div>

        {kustom ? (
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2" role="group" aria-label="Palet siap pakai">
              {PALET_SIAP.map((palet) => (
                <button
                  key={palet.key}
                  type="button"
                  className={`${tombolTerang} gap-2`}
                  onClick={() => ubah(palet.warna)}
                >
                  <span aria-hidden="true" className="flex">
                    {[palet.warna.kertas, palet.warna.utama, palet.warna.aksen].map((hex, i) => (
                      <span key={i} className="-ml-1 size-4 rounded-full border border-garis first:ml-0" style={{ background: hex }} />
                    ))}
                  </span>
                  {palet.label}
                </button>
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {WARNA_KUNCI.map((item) => (
                <label key={item.key} className={labelKolom}>
                  {item.label}
                  <span className="flex items-center gap-3">
                    <input
                      type="color"
                      name={item.key}
                      value={warna[item.key]}
                      onChange={(event) => setWarna((lama) => ({ ...lama, [item.key]: event.target.value }))}
                      className="h-11 w-16 cursor-pointer rounded-md border border-garis-input bg-white p-1"
                    />
                    <span className="font-mono text-xs text-redup">{warna[item.key].toUpperCase()}</span>
                  </span>
                  <span className="text-xs font-normal text-redup">{item.hint}</span>
                  {errors[item.key] ? <span role="alert" className={pesanGalat}>{errors[item.key]}</span> : null}
                </label>
              ))}
            </div>
            {peringatan.map((teks) => (
              <p key={teks} role="status" className="m-0 text-[13px] font-medium text-emas-tua">{teks}</p>
            ))}
          </div>
        ) : null}

        <label className={labelKolom}>
          Font
          <select name="font" defaultValue={tampilan.font} className={kolom}>
            {FONT_PILIHAN.map((item) => (
              <option key={item.key} value={item.key}>{item.label}</option>
            ))}
          </select>
          {errors.font ? <span role="alert" className={pesanGalat}>{errors.font}</span> : null}
        </label>

        {formError ? <p role="alert" className={pesanGalat}>{formError}</p> : null}
      </form>
    </KartuBagian>
  );
}
