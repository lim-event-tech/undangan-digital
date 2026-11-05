"use client";

import { useInvitationAction } from "@/components/invitation-context";

import { useActionState, useState } from "react";
import {
  NEW_GROUP_VALUE,
  type GuestFieldErrors,
  type GuestFormState,
} from "@/lib/guests/form";
import {
  kartu,
  kolom,
  labelKolom,
  pesanGalat,
  tombolBahaya,
  tombolGelap,
  tombolTerang,
} from "@/components/ui";
import { deleteGuestAction, saveGuestAction } from "./actions";

export type FormTamuProps = {
  events: { id: string; name: string }[];
  groups: string[];
  defaults: { maxAdults: number; maxChildren: number };
  guest: {
    id: string;
    name: string;
    phone: string;
    groupName: string | null;
    eventIds: string[];
    maxAdults: number;
    maxChildren: number;
  } | null;
  batalHref: string;
};

const awal: GuestFormState = {};

function nomorNasional(phone: string): string {
  return phone
    .replace(/^\+62/, "")
    .replace(/^(\d{3})(\d{4})(\d*)$/, "$1 $2 $3")
    .trim();
}

function Galat({ errors, nama }: { errors?: GuestFieldErrors; nama: keyof GuestFieldErrors }) {
  const pesan = errors?.[nama];
  if (!pesan) return null;
  return (
    <span id={`galat-${nama}`} role="alert" className={pesanGalat}>
      {pesan}
    </span>
  );
}

export function FormTamu({
  events,
  groups,
  defaults,
  guest,
  batalHref,
}: FormTamuProps) {
  const saveGuestActionForInvitation = useInvitationAction(saveGuestAction);
  const deleteGuestActionForInvitation = useInvitationAction(deleteGuestAction);

  const [state, action, memproses] = useActionState(saveGuestActionForInvitation, awal);
  const v = state.values;
  const errors = state.errors;

  const grupAwal = v ? v.grup : (guest?.groupName ?? "");
  const [pilihan, setPilihan] = useState(
    grupAwal === NEW_GROUP_VALUE || groups.includes(grupAwal) ? grupAwal : "",
  );
  const bukaGrupBaru = pilihan === NEW_GROUP_VALUE;

  const acaraTerpilih = v
    ? v.acara
    : guest
      ? guest.eventIds
      : events.map((e) => e.id);

  return (
    <section
      id="tambah"
      className={`${kartu} flex flex-col gap-3 p-5`}
      aria-labelledby="judul-form-tamu"
    >
      <h2 id="judul-form-tamu" className="m-0 font-judul text-[22px] font-medium">
        {guest ? "Ubah tamu" : "Tambah tamu"}
      </h2>

      <form action={action} className="flex flex-col gap-3">
        {guest ? <input type="hidden" name="id" value={guest.id} /> : null}

        <label className={labelKolom}>
          Nama seperti di sapaan
          <input
            name="nama"
            type="text"
            required
            maxLength={120}
            autoComplete="off"
            placeholder="mis. Bapak Hendra & Istri"
            defaultValue={v?.nama ?? guest?.name ?? ""}
            aria-invalid={errors?.nama ? true : undefined}
            aria-describedby={errors?.nama ? "galat-nama" : undefined}
            className={kolom}
          />
          <Galat errors={errors} nama="nama" />
        </label>

        <label className={labelKolom}>
          Nomor WhatsApp
          <span className="flex overflow-hidden rounded-md border border-garis-input focus-within:border-emas-muda focus-within:ring-3 focus-within:ring-emas-muda/20">
            <span className="flex items-center bg-krem-2 px-2.5 text-sm font-medium">
              +62
            </span>
            <input
              name="whatsapp"
              type="tel"
              inputMode="tel"
              required
              autoComplete="off"
              placeholder="812 0000 0109"
              defaultValue={v?.whatsapp ?? (guest ? nomorNasional(guest.phone) : "")}
              aria-invalid={errors?.whatsapp ? true : undefined}
              aria-describedby={errors?.whatsapp ? "galat-whatsapp" : undefined}
              className="min-h-11 min-w-0 flex-1 border-0 bg-white px-3 text-[15px] focus:outline-none"
            />
          </span>
          <span className="text-xs font-medium text-redup">
            Boleh diketik 0812…, disimpan sebagai +62
          </span>
          <Galat errors={errors} nama="whatsapp" />
        </label>

        <label className={labelKolom}>
          Grup
          <select
            name="grup"
            value={pilihan}
            onChange={(e) => setPilihan(e.target.value)}
            className={kolom}
          >
            <option value="">Tanpa grup</option>
            {groups.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
            <option value={NEW_GROUP_VALUE}>+ Grup baru</option>
          </select>
        </label>
        {bukaGrupBaru ? (
          <label className={labelKolom}>
            Nama grup baru
            <input
              name="grupBaru"
              type="text"
              maxLength={60}
              autoComplete="off"
              placeholder="mis. Teman SMA"
              defaultValue={v?.grupBaru ?? ""}
              aria-invalid={errors?.grup ? true : undefined}
              className={kolom}
            />
          </label>
        ) : null}
        <Galat errors={errors} nama="grup" />

        <fieldset className="m-0 flex flex-col gap-1.5 border-0 p-0">
          <legend className="mb-1.5 text-[13px] font-medium">Diundang ke</legend>
          {events.map((e) => (
            <label
              key={e.id}
              className="flex min-h-10 items-center gap-2.5 text-sm"
            >
              <input
                type="checkbox"
                name="acara"
                value={e.id}
                defaultChecked={acaraTerpilih.includes(e.id)}
                className="size-5 accent-tinta"
              />
              {e.name}
            </label>
          ))}
          <Galat errors={errors} nama="acara" />
        </fieldset>

        <div className="grid grid-cols-2 gap-2.5">
          <label className={labelKolom}>
            Maks. dewasa
            <input
              name="maksDewasa"
              type="number"
              min={1}
              max={20}
              required
              defaultValue={v?.maksDewasa ?? guest?.maxAdults ?? defaults.maxAdults}
              aria-invalid={errors?.maksDewasa ? true : undefined}
              className={kolom}
            />
          </label>
          <label className={labelKolom}>
            Maks. anak
            <input
              name="maksAnak"
              type="number"
              min={0}
              max={20}
              required
              defaultValue={v?.maksAnak ?? guest?.maxChildren ?? defaults.maxChildren}
              aria-invalid={errors?.maksAnak ? true : undefined}
              className={kolom}
            />
          </label>
        </div>
        <Galat errors={errors} nama="maksDewasa" />
        <Galat errors={errors} nama="maksAnak" />
        <p className="m-0 text-xs leading-normal text-redup">
          Bawaan dari pengaturan undangan. Ubah untuk tamu ini saja bila perlu.
        </p>

        {state.duplicate ? (
          <div
            role="alert"
            className="flex flex-col gap-2 rounded-md bg-jingga-bg p-3 text-[13px] leading-relaxed text-jingga"
          >
            <span>
              Nomor ini sudah dipakai oleh <strong>{state.duplicate.name}</strong>
              . Simpan sebagai tamu terpisah?
            </span>
            <button
              type="submit"
              name="izinkanDuplikat"
              value="1"
              disabled={memproses}
              className={`${tombolTerang} min-h-10`}
            >
              Tetap simpan
            </button>
          </div>
        ) : null}

        {state.formError ? (
          <p role="alert" className={`m-0 ${pesanGalat}`}>
            {state.formError}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={memproses}
          className={`${tombolGelap} min-h-11.5`}
        >
          {memproses ? "Menyimpan…" : guest ? "Simpan perubahan" : "Simpan tamu"}
        </button>
        {guest ? (
          <a href={batalHref} className={`${tombolTerang} no-underline`}>
            Batal
          </a>
        ) : null}
      </form>

      {guest ? (
        <details className="border-t border-garis-halus pt-3">
          <summary className="cursor-pointer text-sm font-medium text-galat">
            Hapus tamu ini
          </summary>
          <form action={deleteGuestActionForInvitation} className="mt-3 flex flex-col gap-2">
            <input type="hidden" name="id" value={guest.id} />
            <p className="m-0 text-[13px] leading-relaxed text-redup-2">
              {guest.name} beserta link pribadi dan jawaban RSVP-nya akan dihapus
              permanen.
            </p>
            <button type="submit" className={tombolBahaya}>
              Ya, hapus tamu
            </button>
          </form>
        </details>
      ) : null}
    </section>
  );
}
