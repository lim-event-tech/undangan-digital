"use client";

import { useRef, useState } from "react";
import { kolom, pesanGalat } from "@/components/ui";
import { KartuBagian } from "@/app/undangan/isi/kartu-bagian";
import { StatusSimpan, useAutoSave } from "@/app/undangan/isi/use-auto-save";
import {
  DEFAULT_MESSAGE,
  DEFAULT_REMINDER_MESSAGE,
  MAX_MESSAGE_LENGTH,
  MESSAGE_PLACEHOLDERS,
  renderMessage,
  type MessageVars,
} from "@/lib/whatsapp";
import { simpanPengingatAction, simpanPesanAction } from "./actions";

type Jenis = "undangan" | "pengingat";

const JENIS = {
  undangan: {
    id: "pesan",
    judul: "Pesan WhatsApp",
    deskripsi:
      "Pesan ini dikirim ke setiap tamu. Sisipan seperti {nama} dan {link} diganti otomatis untuk tiap tamu. Kosongkan untuk memakai pesan bawaan.",
    bawaan: DEFAULT_MESSAGE,
    simpan: simpanPesanAction,
  },
  pengingat: {
    id: "pesan-pengingat",
    judul: "Pesan pengingat",
    deskripsi:
      "Pesan ini dikirim ke tamu yang belum menjawab RSVP. Sisipan sama seperti pesan undangan. Kosongkan untuk memakai pesan bawaan.",
    bawaan: DEFAULT_REMINDER_MESSAGE,
    simpan: simpanPengingatAction,
  },
} as const;

export function FormPesan({
  saved,
  sample,
  jenis = "undangan",
  bawaan,
}: {
  saved: string;
  sample: MessageVars;
  jenis?: Jenis;
  bawaan?: string;
}) {
  const config = { ...JENIS[jenis], bawaan: bawaan || JENIS[jenis].bawaan };
  const { formRef, status, errors, formError, formProps } = useAutoSave(config.simpan);
  const [text, setText] = useState(saved);
  const area = useRef<HTMLTextAreaElement>(null);
  const usingDefault = text.trim() === "";
  const preview = renderMessage(usingDefault ? config.bawaan : text, sample);

  function insert(key: string) {
    const element = area.current;
    const tag = `{${key}}`;
    if (!element) {
      setText((current) => `${current}${tag}`);
      return;
    }
    const start = element.selectionStart;
    const end = element.selectionEnd;
    const next = `${text.slice(0, start)}${tag}${text.slice(end)}`;
    setText(next);
    requestAnimationFrame(() => {
      element.focus();
      element.setSelectionRange(start + tag.length, start + tag.length);
      formProps.onChange();
    });
  }

  return (
    <KartuBagian
      id={config.id}
      judul={config.judul}
      deskripsi={config.deskripsi}
      aksi={<StatusSimpan status={status} />}
    >
      <form ref={formRef} {...formProps} className="grid gap-5 lg:grid-cols-2">
        <div className="flex flex-col gap-2.5">
          <label htmlFor="isi-pesan" className="text-[13px] font-medium">
            Isi pesan
          </label>
          <textarea
            id="isi-pesan"
            ref={area}
            name="pesan"
            rows={10}
            maxLength={MAX_MESSAGE_LENGTH}
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder={config.bawaan}
            aria-invalid={errors.pesan ? true : undefined}
            aria-describedby={errors.pesan ? "galat-pesan" : undefined}
            className={`${kolom} min-h-56 py-2.5 leading-relaxed`}
          />
          <div className="flex flex-wrap gap-2" role="group" aria-label="Sisipkan sisipan">
            {MESSAGE_PLACEHOLDERS.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => insert(item.key)}
                className="inline-flex min-h-9 items-center rounded-full border border-garis-input bg-white px-3 text-xs font-medium text-tinta-2 hover:bg-kertas focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emas-muda"
              >
                + {item.label}
              </button>
            ))}
          </div>
          {errors.pesan ? (
            <p id="galat-pesan" role="alert" className={`m-0 ${pesanGalat}`}>
              {errors.pesan}
            </p>
          ) : null}
          {formError ? (
            <p role="alert" className={`m-0 ${pesanGalat}`}>
              {formError}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2.5">
          <span className="text-[13px] font-medium">
            Contoh untuk {sample.nama}
            {usingDefault ? " (pesan bawaan)" : ""}
          </span>
          <div className="rounded-lg border border-garis-halus bg-hijau-bg/50 p-4">
            <p className="m-0 text-sm leading-relaxed break-words whitespace-pre-wrap text-tinta-2">
              {preview}
            </p>
          </div>
        </div>
      </form>
    </KartuBagian>
  );
}
