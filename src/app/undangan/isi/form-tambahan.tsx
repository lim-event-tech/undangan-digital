"use client";

import { useState } from "react";
import { pesanGalat, tombolTerang } from "@/components/ui";
import {
  CONTENT_LIMITS,
  MAX_MOMEN,
  MAX_REKENING,
  type HitungMundurSettings,
  type Momen,
  type Rekening,
  type UcapanSettings,
} from "@/lib/invitations/content";
import {
  simpanAmplopAction,
  simpanCeritaAction,
  simpanHitungMundurAction,
  simpanUcapanAction,
} from "./actions";
import { BidangArea, BidangTeks, Saklar } from "./bidang";
import { KartuBagian } from "./kartu-bagian";
import { StatusSimpan, useAutoSave } from "./use-auto-save";

function GalatForm({ pesan }: { pesan?: string }) {
  if (!pesan) return null;
  return (
    <p role="alert" className={`m-0 ${pesanGalat}`}>
      {pesan}
    </p>
  );
}

export function FormHitungMundur({ pengaturan }: { pengaturan: HitungMundurSettings }) {
  const { formRef, status, formError, formProps } = useAutoSave(simpanHitungMundurAction);

  return (
    <KartuBagian
      id="hitung-mundur"
      judul="Hitung mundur"
      deskripsi="Menghitung mundur ke acara pertama yang sudah punya tanggal dan jam."
      aksi={<StatusSimpan status={status} />}
    >
      <form ref={formRef} {...formProps} className="flex flex-col divide-y divide-garis-halus">
        <Saklar label="Tampilkan hitung mundur" name="aktif" defaultChecked={pengaturan.aktif} />
        <Saklar label="Tampilkan detik" name="detik" defaultChecked={pengaturan.detik} />
        <GalatForm pesan={formError} />
      </form>
    </KartuBagian>
  );
}

type ItemMomen = Momen & { kunci: number };

export function FormCerita({ cerita }: { cerita: Momen[] }) {
  const { formRef, status, errors, formError, formProps } = useAutoSave(simpanCeritaAction);
  const [urutan, setUrutan] = useState(cerita.length);
  const [items, setItems] = useState<ItemMomen[]>(() =>
    cerita.map((momen, index) => ({ ...momen, kunci: index })),
  );

  function tambah() {
    setItems((current) => [...current, { tahun: "", judul: "", teks: "", kunci: urutan }]);
    setUrutan((current) => current + 1);
  }

  function hapus(kunci: number) {
    setItems((current) => current.filter((item) => item.kunci !== kunci));
    requestAnimationFrame(() => formProps.onChange());
  }

  return (
    <KartuBagian
      id="cerita"
      judul="Cerita kami"
      deskripsi={`Momen perjalanan berdua, maksimal ${MAX_MOMEN}. Bagian ini disembunyikan dari undangan bila kosong.`}
      aksi={<StatusSimpan status={status} />}
    >
      <form ref={formRef} {...formProps} className="flex flex-col gap-4">
        {items.length === 0 ? (
          <p className="m-0 rounded-lg border border-dashed border-garis-input bg-kertas px-4 py-6 text-center text-sm text-redup">
            Belum ada momen. Tambahkan pertemuan pertama, lamaran, atau momen lain yang berkesan.
          </p>
        ) : null}
        {items.map((item, index) => (
          <fieldset
            key={item.kunci}
            className="m-0 grid gap-3.5 rounded-lg border border-garis-halus bg-kertas/60 p-4 sm:grid-cols-4"
          >
            <legend className="px-1 text-[13px] font-medium tracking-[0.06em] text-emas uppercase">
              Momen {index + 1}
            </legend>
            <BidangTeks
              label="Tahun atau waktu"
              name="tahun"
              maxLength={CONTENT_LIMITS.ceritaTahun}
              defaultValue={item.tahun}
              placeholder="mis. 2019"
              error={errors[`tahun-${index}`]}
            />
            <div className="sm:col-span-3">
              <BidangTeks
                label="Judul"
                name="judul"
                maxLength={CONTENT_LIMITS.ceritaJudul}
                defaultValue={item.judul}
                placeholder="mis. Pertama bertemu"
                error={errors[`judul-${index}`]}
              />
            </div>
            <div className="sm:col-span-4">
              <BidangArea
                label="Cerita singkat"
                name="teks"
                rows={3}
                maxLength={CONTENT_LIMITS.ceritaTeks}
                defaultValue={item.teks}
                error={errors[`teks-${index}`]}
              />
            </div>
            <div className="sm:col-span-4">
              <button
                type="button"
                onClick={() => hapus(item.kunci)}
                className="min-h-9 cursor-pointer border-0 bg-transparent p-0 text-[13px] font-medium text-galat underline"
              >
                Hapus momen {index + 1}
              </button>
            </div>
          </fieldset>
        ))}
        <div>
          <button
            type="button"
            onClick={tambah}
            disabled={items.length >= MAX_MOMEN}
            className={tombolTerang}
          >
            + Tambah momen
          </button>
        </div>
        <GalatForm pesan={errors.cerita ?? formError} />
      </form>
    </KartuBagian>
  );
}

export function FormUcapan({ pengaturan }: { pengaturan: UcapanSettings }) {
  const { formRef, status, formError, formProps } = useAutoSave(simpanUcapanAction);

  return (
    <KartuBagian
      id="ucapan"
      judul="Ucapan dan doa"
      deskripsi="Tamu menulis ucapan di undangan, maksimal 300 karakter. Kelola, sembunyikan, dan unduh ucapan di halaman Ucapan."
      aksi={<StatusSimpan status={status} />}
    >
      <form ref={formRef} {...formProps} className="flex flex-col divide-y divide-garis-halus">
        <Saklar
          label="Tampilkan ucapan di undangan"
          hint="Bila dimatikan, tamu tidak bisa mengirim ucapan"
          name="tampil"
          defaultChecked={pengaturan.tampil}
        />
        <Saklar
          label="Tahan ucapan baru sampai saya setujui"
          hint="Ucapan baru tidak tampil sampai Anda menyetujuinya"
          name="tahan"
          defaultChecked={pengaturan.tahan}
        />
        <GalatForm pesan={formError} />
      </form>
    </KartuBagian>
  );
}

function SlotRekening({
  nomor,
  rekening,
  errors,
}: {
  nomor: number;
  rekening: Rekening | undefined;
  errors: Record<string, string>;
}) {
  return (
    <fieldset className="m-0 flex min-w-0 flex-col gap-3.5 border-0 p-0">
      <legend className="mb-1 text-[13px] font-medium tracking-[0.06em] text-emas uppercase">
        Rekening {nomor}
      </legend>
      <BidangTeks
        label="Bank atau dompet digital"
        name={`bank${nomor}`}
        maxLength={CONTENT_LIMITS.bank}
        defaultValue={rekening?.bank ?? ""}
        placeholder="mis. BCA"
        error={errors[`bank${nomor}`]}
      />
      <BidangTeks
        label="Nomor rekening"
        name={`nomor${nomor}`}
        inputMode="numeric"
        maxLength={CONTENT_LIMITS.nomorRekening}
        defaultValue={rekening?.nomor ?? ""}
        error={errors[`nomor${nomor}`]}
      />
      <BidangTeks
        label="Atas nama"
        name={`nama${nomor}`}
        maxLength={CONTENT_LIMITS.namaRekening}
        defaultValue={rekening?.atasNama ?? ""}
        error={errors[`nama${nomor}`]}
      />
    </fieldset>
  );
}

export function FormAmplop({
  amplop,
  qris,
}: {
  amplop: Rekening[];
  qris: React.ReactNode;
}) {
  const { formRef, status, errors, formError, formProps } = useAutoSave(simpanAmplopAction);

  return (
    <KartuBagian
      id="tanda-kasih"
      judul="Tanda kasih"
      deskripsi={`Hingga ${MAX_REKENING} rekening dan satu kode QRIS. Tamu bisa menyalin nomor rekening. Platform ini tidak memproses uang. Bagian ini disembunyikan dari undangan bila kosong.`}
      aksi={<StatusSimpan status={status} />}
    >
      <form ref={formRef} {...formProps} className="grid gap-6 md:grid-cols-2">
        {Array.from({ length: MAX_REKENING }, (_, index) => (
          <SlotRekening
            key={index}
            nomor={index + 1}
            rekening={amplop[index]}
            errors={errors}
          />
        ))}
        <div className="md:col-span-2">
          <GalatForm pesan={formError} />
        </div>
      </form>
      {qris}
    </KartuBagian>
  );
}
