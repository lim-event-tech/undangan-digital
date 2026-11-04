"use client";

import { pesanGalat } from "@/components/ui";
import { CONTENT_LIMITS, type InvitationContent } from "@/lib/invitations/content";
import { RSVP_MAX_ADULTS, RSVP_MAX_CHILDREN } from "@/lib/invitations/editor-form";
import {
  simpanMempelaiAction,
  simpanPenutupAction,
  simpanRsvpAction,
  simpanSambutanAction,
} from "./actions";
import { BidangArea, BidangTeks } from "./bidang";
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

export function FormMempelai({
  groomName,
  brideName,
  pria,
  wanita,
}: {
  groomName: string;
  brideName: string;
  pria: InvitationContent["pria"];
  wanita: InvitationContent["wanita"];
}) {
  const { formRef, status, errors, formError, formProps } = useAutoSave(simpanMempelaiAction);

  return (
    <KartuBagian
      id="mempelai"
      judul="Mempelai"
      deskripsi="Nama panggilan dipakai di sampul dan sapaan. Nama lengkap dan orang tua tampil di bagian Mempelai."
      aksi={<StatusSimpan status={status} />}
    >
      <form ref={formRef} {...formProps} className="grid gap-6 md:grid-cols-2">
        <fieldset className="m-0 flex min-w-0 flex-col gap-3.5 border-0 p-0">
          <legend className="mb-1 text-[13px] font-medium tracking-[0.06em] text-emas uppercase">
            Mempelai pria
          </legend>
          <BidangTeks
            label="Nama panggilan"
            name="panggilanPria"
            required
            maxLength={CONTENT_LIMITS.panggilan}
            defaultValue={groomName}
            error={errors.panggilanPria}
          />
          <BidangTeks
            label="Nama lengkap"
            name="namaLengkapPria"
            maxLength={CONTENT_LIMITS.namaLengkap}
            defaultValue={pria.namaLengkap}
            error={errors.namaLengkapPria}
          />
          <BidangArea
            label="Keterangan orang tua"
            name="orangTuaPria"
            rows={3}
            maxLength={CONTENT_LIMITS.orangTua}
            placeholder="mis. Putra pertama Bapak Hendra dan Ibu Sari"
            defaultValue={pria.orangTua}
            error={errors.orangTuaPria}
          />
        </fieldset>
        <fieldset className="m-0 flex min-w-0 flex-col gap-3.5 border-0 p-0">
          <legend className="mb-1 text-[13px] font-medium tracking-[0.06em] text-emas uppercase">
            Mempelai wanita
          </legend>
          <BidangTeks
            label="Nama panggilan"
            name="panggilanWanita"
            required
            maxLength={CONTENT_LIMITS.panggilan}
            defaultValue={brideName}
            error={errors.panggilanWanita}
          />
          <BidangTeks
            label="Nama lengkap"
            name="namaLengkapWanita"
            maxLength={CONTENT_LIMITS.namaLengkap}
            defaultValue={wanita.namaLengkap}
            error={errors.namaLengkapWanita}
          />
          <BidangArea
            label="Keterangan orang tua"
            name="orangTuaWanita"
            rows={3}
            maxLength={CONTENT_LIMITS.orangTua}
            placeholder="mis. Putri kedua Bapak Wahyu dan Ibu Lestari"
            defaultValue={wanita.orangTua}
            error={errors.orangTuaWanita}
          />
        </fieldset>
        <div className="md:col-span-2">
          <GalatForm pesan={formError} />
        </div>
      </form>
    </KartuBagian>
  );
}

export function FormSambutan({ kutipan, sambutan }: { kutipan: string; sambutan: string }) {
  const { formRef, status, errors, formError, formProps } = useAutoSave(simpanSambutanAction);

  return (
    <KartuBagian
      id="sambutan"
      judul="Sambutan"
      deskripsi="Kutipan pembuka dan kata sambutan untuk tamu. Boleh dikosongkan."
      aksi={<StatusSimpan status={status} />}
    >
      <form ref={formRef} {...formProps} className="flex flex-col gap-3.5">
        <BidangArea
          label="Kutipan"
          name="kutipan"
          rows={3}
          maxLength={CONTENT_LIMITS.kutipan}
          defaultValue={kutipan}
          error={errors.kutipan}
        />
        <BidangArea
          label="Teks sambutan"
          name="sambutan"
          rows={6}
          maxLength={CONTENT_LIMITS.sambutan}
          placeholder="Tanpa mengurangi rasa hormat, kami mengundang Bapak/Ibu/Saudara/i…"
          defaultValue={sambutan}
          error={errors.sambutan}
        />
        <GalatForm pesan={formError} />
      </form>
    </KartuBagian>
  );
}

export function FormPenutup({ penutup }: { penutup: string }) {
  const { formRef, status, errors, formError, formProps } = useAutoSave(simpanPenutupAction);

  return (
    <KartuBagian
      id="penutup"
      judul="Penutup"
      deskripsi="Kalimat terakhir di bagian bawah undangan."
      aksi={<StatusSimpan status={status} />}
    >
      <form ref={formRef} {...formProps} className="flex flex-col gap-3.5">
        <BidangArea
          label="Teks penutup"
          name="penutup"
          rows={4}
          maxLength={CONTENT_LIMITS.penutup}
          defaultValue={penutup}
          error={errors.penutup}
        />
        <GalatForm pesan={formError} />
      </form>
    </KartuBagian>
  );
}

export function FormRsvp({
  batas,
  hariIni,
  maksDewasa,
  maksAnak,
}: {
  batas: string;
  hariIni: string;
  maksDewasa: number;
  maksAnak: number;
}) {
  const { formRef, status, errors, formError, formProps } = useAutoSave(simpanRsvpAction);

  return (
    <KartuBagian
      id="rsvp"
      judul="Pengaturan RSVP"
      deskripsi="Batas jumlah ini menjadi bawaan untuk tamu baru. Tiap tamu tetap bisa diubah di daftar tamu."
      aksi={<StatusSimpan status={status} />}
    >
      <form ref={formRef} {...formProps} className="grid gap-3.5 sm:grid-cols-3">
        <BidangTeks
          label="Batas waktu RSVP"
          name="batas"
          type="date"
          min={hariIni}
          defaultValue={batas}
          hint="Kosongkan bila tanpa batas"
          error={errors.batas}
        />
        <BidangTeks
          label="Maks. dewasa per tamu"
          name="maksDewasa"
          type="number"
          inputMode="numeric"
          min={1}
          max={RSVP_MAX_ADULTS}
          required
          defaultValue={maksDewasa}
          error={errors.maksDewasa}
        />
        <BidangTeks
          label="Maks. anak per tamu"
          name="maksAnak"
          type="number"
          inputMode="numeric"
          min={0}
          max={RSVP_MAX_CHILDREN}
          required
          defaultValue={maksAnak}
          hint="Isi 0 untuk menyembunyikan pilihan anak"
          error={errors.maksAnak}
        />
        <div className="sm:col-span-3">
          <GalatForm pesan={formError} />
        </div>
      </form>
    </KartuBagian>
  );
}
