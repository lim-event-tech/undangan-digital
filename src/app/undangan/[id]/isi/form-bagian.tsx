"use client";

import { pesanGalat } from "@/components/ui";
import { CONTENT_LIMITS } from "@/lib/invitations/content";
import { MAX_INVITATION_TITLE } from "@/lib/invitations/title";
import { RSVP_MAX_ATTENDEES } from "@/lib/invitations/editor-form";
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

export function FormSambutan({ sambutan }: { sambutan: string }) {
  const { formRef, status, errors, formError, formProps } = useAutoSave(simpanSambutanAction);

  return (
    <KartuBagian
      id="sambutan"
      judul="Sambutan"
      deskripsi="Teks undangan formal untuk peserta. Boleh dikosongkan."
      aksi={<StatusSimpan status={status} />}
    >
      <form ref={formRef} {...formProps} className="flex flex-col gap-3.5">
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

export function FormRsvp({ batas, hariIni, maksPeserta }: { batas: string; hariIni: string; maksPeserta: number }) {
  const { formRef, status, errors, formError, formProps } = useAutoSave(simpanRsvpAction);
  return <KartuBagian id="rsvp" judul="Pengaturan RSVP" deskripsi="Batas peserta mencakup tamu utama dan pendamping. Nilai ini menjadi bawaan untuk tamu baru dan dapat diubah per tamu." aksi={<StatusSimpan status={status} />}>
    <form ref={formRef} {...formProps} className="grid gap-3.5 sm:grid-cols-2">
      <BidangTeks label="Batas waktu RSVP" name="batas" type="date" min={hariIni} defaultValue={batas} hint="Kosongkan bila tanpa batas" error={errors.batas} />
      <BidangTeks label="Maks. peserta per tamu" name="maksPeserta" type="number" inputMode="numeric" min={1} max={RSVP_MAX_ATTENDEES} required defaultValue={maksPeserta} error={errors.maksPeserta} />
      <div className="sm:col-span-2"><GalatForm pesan={formError} /></div>
    </form>
  </KartuBagian>;
}
