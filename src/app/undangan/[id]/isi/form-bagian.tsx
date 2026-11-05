"use client";

import { pesanGalat } from "@/components/ui";
import { CONTENT_LIMITS } from "@/lib/invitations/content";
import { MAX_INVITATION_TITLE } from "@/lib/invitations/title";
import { RSVP_MAX_ADULTS, RSVP_MAX_CHILDREN } from "@/lib/invitations/editor-form";
import {
  simpanTitleAction,
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

export function FormTitle({ title }: { title: string }) {
  const { formRef, status, errors, formError, formProps } = useAutoSave(simpanTitleAction);
  return (
    <KartuBagian id="identitas-event" judul="Identitas event" deskripsi="Judul event tampil pada sampul, pesan undangan, dan pratinjau tautan." aksi={<StatusSimpan status={status} />}>
      <form ref={formRef} {...formProps} className="flex flex-col gap-3.5">
        <BidangTeks label="Judul event" name="title" required maxLength={MAX_INVITATION_TITLE} defaultValue={title} error={errors.title} />
        <GalatForm pesan={formError} />
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
