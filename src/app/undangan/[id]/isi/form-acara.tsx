"use client";

import { useInvitationAction } from "@/components/invitation-context";

import { useActionState, useState } from "react";
import { kolom, labelKolom, pesanGalat, tombolBahaya, tombolGelap } from "@/components/ui";
import { formatLongDate, isDateString, isZone, ZONES, type Zone } from "@/lib/datetime";
import { MAX_EVENT_DAYS, eventDays } from "@/lib/events/days";
import { EVENT_LIMITS, MAPS_ERROR, MAX_EVENTS } from "@/lib/events/form";
import type { EventDetail } from "@/lib/events/service";
import { normalizeMapsUrl } from "@/lib/maps";
import type { SaveResult } from "@/lib/save-result";
import { hapusAcaraAction, simpanAcaraAction, tambahAcaraAction } from "./actions";
import { BidangArea, BidangTeks } from "./bidang";
import { FormAgenda } from "./form-agenda";
import { KartuBagian } from "./kartu-bagian";
import { StatusSimpan, useAutoSave } from "./use-auto-save";

function KartuAcara({ acara, bisaHapus, tanggalMinimal }: { acara: EventDetail; bisaHapus: boolean; tanggalMinimal: Record<Zone, string> }) {
  const hapusAcaraActionForInvitation = useInvitationAction(hapusAcaraAction);

  const { formRef, status, errors, formError, formProps } = useAutoSave(simpanAcaraAction);
  const [maps, setMaps] = useState(acara.mapsUrl ?? "");
  const [zona, setZona] = useState(acara.timezone);
  const [tanggal, setTanggal] = useState(acara.date ?? "");
  const [tanggalSelesai, setTanggalSelesai] = useState(acara.endDate ?? "");
  const hari = eventDays({ date: isDateString(tanggal) ? tanggal : null, endDate: isDateString(tanggalSelesai) ? tanggalSelesai : null });
  const [hapus, hapusAction, menghapus] = useActionState<SaveResult | null, FormData>(
    hapusAcaraActionForInvitation,
    null,
  );

  const mapsValid = maps.trim() !== "" && normalizeMapsUrl(maps) !== null;
  const mapsGalat = errors.maps ?? (maps.trim() !== "" && !mapsValid ? MAPS_ERROR : undefined);

  return (
    <div
      id={`acara-${acara.id}`}
      className="flex scroll-mt-6 flex-col gap-4 rounded-lg border border-garis-halus bg-kertas/60 p-4"
    >
      <form ref={formRef} {...formProps} className="grid gap-3.5 sm:grid-cols-6">
        <input type="hidden" name="id" value={acara.id} />
        <div className="flex items-center justify-between gap-3 sm:col-span-6">
          <span className="text-[13px] font-medium tracking-[0.06em] text-emas uppercase">
            {acara.name}
          </span>
          <StatusSimpan status={status} />
        </div>
        <div className="sm:col-span-6">
          <BidangTeks
            label="Nama acara"
            name="nama"
            required
            maxLength={EVENT_LIMITS.name}
            defaultValue={acara.name}
            error={errors.nama}
          />
        </div>
        <div className="sm:col-span-2">
          <BidangTeks
            label="Tanggal mulai"
            name="tanggal"
            type="date"
            min={tanggalMinimal[zona]}
            value={tanggal}
            onChange={(event) => setTanggal(event.target.value)}
            error={errors.tanggal}
          />
        </div>
        <div className="sm:col-span-2">
          <BidangTeks
            label="Tanggal selesai"
            name="tanggalSelesai"
            type="date"
            min={tanggal || tanggalMinimal[zona]}
            value={tanggalSelesai}
            onChange={(event) => setTanggalSelesai(event.target.value)}
            hint="Opsional, untuk acara lebih dari satu hari"
            error={errors.tanggalSelesai}
          />
        </div>
        <label className={`${labelKolom} sm:col-span-2`}>
          Zona waktu
          <select
            name="zona"
            value={zona}
            onChange={(event) => {
              if (isZone(event.target.value)) setZona(event.target.value);
            }}
            className={kolom}
          >
            {ZONES.map((zona) => (
              <option key={zona} value={zona}>
                {zona}
              </option>
            ))}
          </select>
        </label>
        <div className="sm:col-span-3">
          <BidangTeks
            label="Jam mulai"
            name="jam"
            type="time"
            defaultValue={acara.time ?? ""}
            error={errors.jam}
          />
        </div>
        <div className="sm:col-span-3"><BidangTeks label="Jam selesai" name="jamSelesai" type="time" defaultValue={acara.endTime ?? ""} hint="Opsional. Berlaku setiap hari acara" error={errors.jamSelesai} /></div>
        {hari.length > 1 ? (
          <details className="rounded-lg border border-garis-halus bg-white p-3 sm:col-span-6" open={acara.dayTimes.length > 0}>
            <summary className="cursor-pointer text-sm font-medium">Jam khusus per hari (opsional)</summary>
            <p className="mt-2 mb-3 text-[13px] leading-relaxed text-redup-2">
              Kosongkan bila jam harian sama dengan jam mulai dan selesai di atas. Isi keduanya untuk hari yang jamnya berbeda; tamu hanya bisa memilih jam datang dalam rentang tersebut.
            </p>
            {hari.length >= MAX_EVENT_DAYS ? <p className="m-0 mb-2 text-xs text-redup">Rentang dibatasi {MAX_EVENT_DAYS} hari.</p> : null}
            <div className="flex flex-col gap-3">
              {hari.map((tgl) => {
                const khusus = acara.dayTimes.find((item) => item.date === tgl);
                return (
                  <div key={tgl} className="grid items-start gap-2 sm:grid-cols-[1fr_8rem_8rem]">
                    <span className="pt-2 text-sm">{formatLongDate(tgl)}</span>
                    <BidangTeks label="Mulai" name={`mulai-${tgl}`} type="time" defaultValue={khusus?.start ?? ""} error={errors[`mulai-${tgl}`]} />
                    <BidangTeks label="Selesai" name={`selesai-${tgl}`} type="time" defaultValue={khusus?.end ?? ""} error={errors[`selesai-${tgl}`]} />
                  </div>
                );
              })}
            </div>
          </details>
        ) : null}
        <div className="sm:col-span-6">
          <BidangTeks
            label="Nama tempat"
            name="tempat"
            maxLength={EVENT_LIMITS.venue}
            placeholder="mis. Gedung Serbaguna Melati"
            defaultValue={acara.venueName ?? ""}
            error={errors.tempat}
          />
        </div>
        <div className="sm:col-span-6">
          <BidangArea
            label="Alamat"
            name="alamat"
            rows={2}
            maxLength={EVENT_LIMITS.address}
            defaultValue={acara.address ?? ""}
            error={errors.alamat}
          />
        </div>
        <div className="sm:col-span-6">
          <BidangTeks
            label="Link lokasi (Google Maps)"
            name="maps"
            type="text"
            inputMode="url"
            autoComplete="off"
            maxLength={EVENT_LIMITS.maps}
            placeholder="https://www.google.com/maps/place/…"
            value={maps}
            onChange={(event) => setMaps(event.target.value)}
            hint={
              mapsValid
                ? "Link valid"
                : "Tempel link dari tombol Bagikan atau salin langsung dari kolom alamat browser."
            }
            error={mapsGalat}
          />
        </div>
        <FormAgenda agenda={acara.agenda} errors={errors} changed={() => formProps.onChange()} />
        {formError ? (
          <p role="alert" className={`m-0 sm:col-span-6 ${pesanGalat}`}>
            {formError}
          </p>
        ) : null}
      </form>

      {bisaHapus ? (
        <details className="border-t border-garis-halus pt-3">
          <summary className="cursor-pointer text-sm font-medium text-galat">Hapus acara ini</summary>
          <form action={hapusAction} className="mt-3 flex flex-col gap-2">
            <input type="hidden" name="id" value={acara.id} />
            <p className="m-0 text-[13px] leading-relaxed text-redup-2">
              {acara.name} beserta jawaban RSVP-nya akan dihapus. Tamu yang hanya diundang ke acara
              ini perlu dipilihkan acara lain di daftar undangan.
            </p>
            {hapus && !hapus.ok && hapus.formError ? (
              <p role="alert" className={`m-0 ${pesanGalat}`}>
                {hapus.formError}
              </p>
            ) : null}
            <button type="submit" disabled={menghapus} className={tombolBahaya}>
              {menghapus ? "Menghapus…" : "Ya, hapus acara"}
            </button>
          </form>
        </details>
      ) : null}
    </div>
  );
}

function TambahAcara({ penuh }: { penuh: boolean }) {
  const tambahAcaraActionForInvitation = useInvitationAction(tambahAcaraAction);

  const [hasil, tambah, memproses] = useActionState<SaveResult | null, FormData>(
    tambahAcaraActionForInvitation,
    null,
  );
  const galat = hasil && !hasil.ok ? (hasil.errors?.nama ?? hasil.formError) : undefined;

  return (
    <form action={tambah} className="flex flex-wrap items-end gap-2.5 border-t border-garis-halus pt-4">
      <div className="min-w-55 flex-[1_1_240px]">
        <BidangTeks
          label="Tambah acara"
          name="nama"
          required
          maxLength={EVENT_LIMITS.name}
          placeholder="mis. Diskusi dan jejaring"
          disabled={penuh}
          error={galat}
          hint={penuh ? `Sudah mencapai ${MAX_EVENTS} acara` : undefined}
        />
      </div>
      <button type="submit" disabled={penuh || memproses} className={tombolGelap}>
        {memproses ? "Menambah…" : "+ Tambah acara"}
      </button>
    </form>
  );
}

export function BagianAcara({ acara, tanggalMinimal }: { acara: EventDetail[]; tanggalMinimal: Record<Zone, string> }) {
  return (
    <KartuBagian
      id="acara"
      judul="Acara"
      deskripsi="Tamu hanya melihat acara yang dicentang untuknya di daftar undangan. Tanggal, jam, dan link Maps wajib terisi sebelum terbit."
    >
      <div className="flex flex-col gap-4">
        {acara.map((item) => (
          <KartuAcara key={item.id} acara={item} bisaHapus={acara.length > 1} tanggalMinimal={tanggalMinimal} />
        ))}
      </div>
      <TambahAcara penuh={acara.length >= MAX_EVENTS} />
    </KartuBagian>
  );
}
