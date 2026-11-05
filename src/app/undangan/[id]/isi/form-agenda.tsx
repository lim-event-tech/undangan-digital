"use client";

import { useState } from "react";
import { pesanGalat, tombolTerang } from "@/components/ui";
import { AGENDA_LIMITS, MAX_AGENDA, type AgendaItem } from "@/lib/events/agenda";
import type { FieldErrors } from "@/lib/save-result";
import { BidangArea, BidangTeks } from "./bidang";
import { AksiBaris } from "./form-formal";

export function FormAgenda({ agenda, errors, changed }: { agenda: AgendaItem[]; errors: FieldErrors; changed: () => void }) {
  const [items, setItems] = useState(agenda);
  function update(next: AgendaItem[]) {
    setItems(next);
    requestAnimationFrame(changed);
  }
  function move(index: number, direction: number) {
    const next = [...items];
    [next[index], next[index + direction]] = [next[index + direction], next[index]];
    update(next);
  }
  return <div className="flex flex-col gap-3 border-t border-garis pt-4 sm:col-span-6">
    <h3 className="m-0 text-base font-medium">Agenda per sesi</h3>
    <p className="m-0 text-sm text-redup">Rincian kegiatan dalam sesi ini. Tamu menjawab RSVP untuk sesi, bukan untuk setiap baris agenda.</p>
    {items.map((item, index) => <fieldset key={item.id} className="flex min-w-0 flex-col gap-3 rounded-lg border border-garis p-3">
      <legend className="px-1 text-sm">Agenda {index + 1}</legend>
      <input type="hidden" name="agenda-id" value={item.id} />
      <BidangTeks name="agenda-jam" label="Jam agenda" type="time" required defaultValue={item.jam} error={errors[`agenda-jam-${index}`]} />
      <BidangTeks name="agenda-judul" label="Judul kegiatan" required maxLength={AGENDA_LIMITS.judul} defaultValue={item.judul} error={errors[`agenda-judul-${index}`]} />
      <BidangArea name="agenda-keterangan" label="Keterangan kegiatan" rows={2} maxLength={AGENDA_LIMITS.keterangan} defaultValue={item.keterangan} error={errors[`agenda-keterangan-${index}`]} />
      <AksiBaris index={index} count={items.length} nama={`agenda ${index + 1}`} move={(direction) => move(index, direction)} remove={() => update(items.filter((row) => row.id !== item.id))} />
    </fieldset>)}
    <button type="button" className={tombolTerang} disabled={items.length >= MAX_AGENDA} onClick={() => update([...items, { id: crypto.randomUUID(), jam: "", judul: "", keterangan: "" }])}>Tambah agenda</button>
    {errors.agenda ? <p role="alert" className={pesanGalat}>{errors.agenda}</p> : null}
  </div>;
}
