"use client";

import { useState } from "react";
import { pesanGalat, tombolTerang } from "@/components/ui";
import { BAGIAN, DEFAULT_SUSUNAN, type BagianId, type Susunan } from "@/lib/invitations/content";
import { simpanSusunanAction } from "./actions";
import { KartuBagian } from "./kartu-bagian";
import { StatusSimpan, useAutoSave } from "./use-auto-save";

const INFO = new Map(BAGIAN.map((item) => [item.id, item]));

function pindah(urutan: BagianId[], id: BagianId, ke: number): BagianId[] {
  const tanpa = urutan.filter((item) => item !== id);
  const batas = Math.max(1, Math.min(tanpa.length - 1, ke));
  tanpa.splice(batas, 0, id);
  return tanpa;
}

export function FormSusunan({ susunan }: { susunan: Susunan }) {
  const { formRef, status, formError, formProps } = useAutoSave(simpanSusunanAction);
  const [urutan, setUrutan] = useState<BagianId[]>(susunan.urutan);
  const [sembunyi, setSembunyi] = useState<Set<BagianId>>(() => new Set(susunan.sembunyi));
  const [diseret, setDiseret] = useState<BagianId | null>(null);
  const [sasaran, setSasaran] = useState<BagianId | null>(null);
  const [pengumuman, setPengumuman] = useState("");

  function simpanSetelah() {
    requestAnimationFrame(() => formProps.onChange());
  }

  function geser(id: BagianId, ke: number) {
    const baru = pindah(urutan, id, ke);
    if (baru.join() === urutan.join()) return;
    setUrutan(baru);
    setPengumuman(`${INFO.get(id)?.label} dipindah ke urutan ${baru.indexOf(id) + 1} dari ${baru.length}`);
    simpanSetelah();
  }

  function alih(id: BagianId) {
    setSembunyi((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    simpanSetelah();
  }

  function bawaan() {
    setUrutan(DEFAULT_SUSUNAN.urutan);
    setSembunyi(new Set(DEFAULT_SUSUNAN.sembunyi));
    setPengumuman("Susunan dikembalikan ke bawaan");
    simpanSetelah();
  }

  return (
    <KartuBagian
      id="susunan"
      judul="Susunan bagian"
      deskripsi="Seret bagian untuk mengubah urutannya di undangan, atau pakai tombol naik dan turun. Sampul selalu di awal dan penutup selalu di akhir. Bagian yang kosong tidak tampil walau diaktifkan."
      aksi={<StatusSimpan status={status} />}
    >
      <form ref={formRef} {...formProps} className="flex flex-col gap-3">
        {urutan.map((id) => (
          <input key={`u-${id}`} type="hidden" name="urutan" value={id} />
        ))}
        {[...sembunyi].map((id) => (
          <input key={`s-${id}`} type="hidden" name="sembunyi" value={id} />
        ))}

        <ol className="m-0 flex list-none flex-col gap-2 p-0">
          {urutan.map((id, index) => {
            const info = INFO.get(id)!;
            const tetap = info.tetap;
            const tersembunyi = sembunyi.has(id);
            return (
              <li
                key={id}
                draggable={!tetap}
                onDragStart={(event) => {
                  if (tetap) return;
                  setDiseret(id);
                  event.dataTransfer.effectAllowed = "move";
                  event.dataTransfer.setData("text/plain", id);
                }}
                onDragOver={(event) => {
                  if (!diseret || tetap) return;
                  event.preventDefault();
                  setSasaran(id);
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  if (diseret && !tetap) geser(diseret, index);
                  setDiseret(null);
                  setSasaran(null);
                }}
                onDragEnd={() => {
                  setDiseret(null);
                  setSasaran(null);
                }}
                className={`flex flex-wrap items-center gap-3 rounded-lg border bg-white px-3 py-2.5 ${
                  sasaran === id && diseret !== id ? "border-emas-muda bg-krem" : "border-garis-halus"
                } ${diseret === id ? "opacity-50" : ""}`}
              >
                <span
                  aria-hidden="true"
                  className={`select-none text-lg leading-none ${tetap ? "text-garis" : "cursor-grab text-redup"}`}
                  title={tetap ? "Posisi tetap" : "Seret untuk memindahkan"}
                >
                  ⠿
                </span>
                <span className="w-6 text-sm text-redup lining-nums">{index + 1}</span>
                <span className={`min-w-0 flex-1 text-sm font-medium ${tersembunyi ? "text-redup line-through" : ""}`}>
                  {info.label}
                  {tetap ? <span className="ml-2 text-xs font-normal text-redup">posisi tetap</span> : null}
                </span>
                {tetap ? null : (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => geser(id, index - 1)}
                      disabled={index <= 1}
                      aria-label={`Naikkan ${info.label}`}
                      className={`${tombolTerang} min-h-9 px-2.5`}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => geser(id, index + 1)}
                      disabled={index >= urutan.length - 2}
                      aria-label={`Turunkan ${info.label}`}
                      className={`${tombolTerang} min-h-9 px-2.5`}
                    >
                      ↓
                    </button>
                  </div>
                )}
                {info.wajib ? (
                  <span className="w-20 text-right text-xs text-redup">Wajib</span>
                ) : (
                  <label className="flex min-h-9 w-20 items-center justify-end gap-2 text-xs font-medium">
                    <input
                      type="checkbox"
                      checked={!tersembunyi}
                      onChange={() => alih(id)}
                      aria-label={`Tampilkan ${info.label}`}
                      className="size-4 accent-emas"
                    />
                    Tampil
                  </label>
                )}
              </li>
            );
          })}
        </ol>

        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={bawaan} className={tombolTerang}>
            Kembalikan ke bawaan
          </button>
          {formError ? (
            <p role="alert" className={`m-0 ${pesanGalat}`}>
              {formError}
            </p>
          ) : null}
        </div>
        <p role="status" aria-live="polite" className="sr-only">
          {pengumuman}
        </p>
      </form>
    </KartuBagian>
  );
}
