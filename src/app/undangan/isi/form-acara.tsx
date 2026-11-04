"use client";

import { useActionState, useState } from "react";
import { kolom, labelKolom, pesanGalat, tombolBahaya, tombolGelap } from "@/components/ui";
import { isZone, ZONES, type Zone } from "@/lib/datetime";
import { EVENT_LIMITS, MAPS_ERROR, MAX_EVENTS } from "@/lib/events/form";
import type { EventDetail } from "@/lib/events/service";
import { isGoogleMapsUrl } from "@/lib/maps";
import type { SaveResult } from "@/lib/save-result";
import { hapusAcaraAction, simpanAcaraAction, tambahAcaraAction } from "./actions";
import { BidangArea, BidangTeks } from "./bidang";
import { KartuBagian } from "./kartu-bagian";
import { StatusSimpan, useAutoSave } from "./use-auto-save";

function KartuAcara({ acara, bisaHapus, tanggalMinimal }: { acara: EventDetail; bisaHapus: boolean; tanggalMinimal: Record<Zone, string> }) {
  const { formRef, status, errors, formError, formProps } = useAutoSave(simpanAcaraAction);
  const [maps, setMaps] = useState(acara.mapsUrl ?? "");
  const [zona, setZona] = useState(acara.timezone);
  const [hapus, hapusAction, menghapus] = useActionState<SaveResult | null, FormData>(
    hapusAcaraAction,
    null,
  );

  const mapsValid = maps.trim() !== "" && isGoogleMapsUrl(maps);
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
            label="Tanggal"
            name="tanggal"
            type="date"
            min={tanggalMinimal[zona]}
            defaultValue={acara.date ?? ""}
            error={errors.tanggal}
          />
        </div>
        <div className="sm:col-span-2">
          <BidangTeks
            label="Jam"
            name="jam"
            type="time"
            defaultValue={acara.time ?? ""}
            error={errors.jam}
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
            label="Link Google Maps"
            name="maps"
            type="url"
            inputMode="url"
            autoComplete="off"
            maxLength={EVENT_LIMITS.maps}
            placeholder="https://maps.app.goo.gl/…"
            value={maps}
            onChange={(event) => setMaps(event.target.value)}
            hint={
              mapsValid
                ? "Link valid"
                : "Buka lokasi di Google Maps, ketuk Bagikan, lalu tempel link-nya di sini."
            }
            error={mapsGalat}
          />
        </div>
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
              ini perlu dipilihkan acara lain di daftar tamu.
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
  const [hasil, tambah, memproses] = useActionState<SaveResult | null, FormData>(
    tambahAcaraAction,
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
          placeholder="mis. Ngunduh Mantu"
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
      deskripsi="Tamu hanya melihat acara yang dicentang untuknya di daftar tamu. Tanggal, jam, dan link Maps wajib terisi sebelum terbit."
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
