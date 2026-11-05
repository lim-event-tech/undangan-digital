"use client";

import { useMemo, useState } from "react";
import { pesanGalat, tombolTerang } from "@/components/ui";
import { CONTENT_LIMITS, MAX_PENGISI_ACARA, type InvitationContent, type PengisiAcara } from "@/lib/invitations/content";
import { FORMAL_FIELDS, type SimpleFormalGroup } from "@/lib/invitations/formal-form";
import { simpanFormalAction } from "./actions";
import { BidangArea, BidangTeks } from "./bidang";
import { KartuBagian } from "./kartu-bagian";
import { StatusSimpan, useAutoSave } from "./use-auto-save";

const TITLES: Record<SimpleFormalGroup, [string, string]> = {
  identitas: ["Tentang event", "Jenis, tema, dan tujuan kegiatan. Semua isian ini opsional."],
  penyelenggara: ["Penyelenggara dan EO", "Penyelenggara adalah pemilik acara. EO adalah pihak yang mengelolanya. Nama penyelenggara wajib sebelum terbit."],
  informasiPeserta: ["Informasi peserta", "Dress code, ketentuan kehadiran, dan petunjuk menuju lokasi. Bagian kosong disembunyikan."],
  kontak: ["Narahubung", "Kontak panitia yang tampil kepada tamu. Isi nama dan setidaknya satu kanal kontak, atau kosongkan seluruhnya."],
};

export function FormFormal({ group, value }: { group: SimpleFormalGroup; value: InvitationContent[SimpleFormalGroup] }) {
  const action = useMemo(() => simpanFormalAction.bind(null, group), [group]);
  const { formRef, status, errors, formError, formProps } = useAutoSave(action);
  const values = value as Record<string, string>;
  return (
    <KartuBagian id={group} judul={TITLES[group][0]} deskripsi={TITLES[group][1]} aksi={<StatusSimpan status={status} />}>
      <form ref={formRef} {...formProps} className="flex flex-col gap-3.5">
        {FORMAL_FIELDS[group].map((field) => {
          const props = { label: field.label, name: field.key, maxLength: field.max, placeholder: field.placeholder, defaultValue: values[field.key], error: errors[field.key] };
          return field.area ? <BidangArea key={field.key} {...props} rows={4} /> : <BidangTeks key={field.key} {...props} />;
        })}
        {formError ? <p role="alert" className={pesanGalat}>{formError}</p> : null}
      </form>
    </KartuBagian>
  );
}

export function AksiBaris({ index, count, nama, move, remove }: { index: number; count: number; nama: string; move: (direction: number) => void; remove: () => void }) {
  return <div className="flex flex-wrap gap-2">
    <button type="button" className={tombolTerang} disabled={index === 0} aria-label={`Naikkan ${nama}`} onClick={() => move(-1)}>Naik</button>
    <button type="button" className={tombolTerang} disabled={index === count - 1} aria-label={`Turunkan ${nama}`} onClick={() => move(1)}>Turun</button>
    <button type="button" className={tombolTerang} aria-label={`Hapus ${nama}`} onClick={remove}>Hapus</button>
  </div>;
}

export function FormPengisi({ pengisi }: { pengisi: PengisiAcara[] }) {
  const action = useMemo(() => simpanFormalAction.bind(null, "pengisiAcara"), []);
  const { formRef, status, errors, formError, formProps } = useAutoSave(action);
  const [items, setItems] = useState(pengisi);
  function update(next: PengisiAcara[]) {
    setItems(next);
    requestAnimationFrame(() => formProps.onChange());
  }
  function move(index: number, direction: number) {
    const next = [...items];
    [next[index], next[index + direction]] = [next[index + direction], next[index]];
    update(next);
  }
  return <KartuBagian id="pengisi" judul="Pengisi acara" deskripsi={`Narasumber, moderator, atau pembawa acara. Opsional, maksimal ${MAX_PENGISI_ACARA} orang.`} aksi={<StatusSimpan status={status} />}>
    <form ref={formRef} {...formProps} className="flex flex-col gap-4">
      {!items.length ? <p className="m-0 text-sm text-redup">Belum ada pengisi acara. Bagian ini disembunyikan bila kosong.</p> : null}
      {items.map((item, index) => <fieldset key={item.id} className="flex min-w-0 flex-col gap-3 rounded-lg border border-garis p-4">
        <legend className="px-1 text-sm">Pengisi acara {index + 1}</legend>
        <input type="hidden" name="id" value={item.id} />
        {(["nama", "peran", "instansi", "profil"] as const).map((key) => {
          const props = { name: key, label: { nama: "Nama", peran: "Peran atau jabatan", instansi: "Instansi", profil: "Profil singkat" }[key], defaultValue: item[key], error: errors[`${key}-${index}`], maxLength: key === "profil" ? CONTENT_LIMITS.profil : CONTENT_LIMITS.nama };
          return key === "profil" ? <BidangArea key={key} {...props} rows={3} /> : <BidangTeks key={key} {...props} required={key === "nama"} />;
        })}
        <AksiBaris index={index} count={items.length} nama={`pengisi acara ${index + 1}`} move={(direction) => move(index, direction)} remove={() => update(items.filter((row) => row.id !== item.id))} />
      </fieldset>)}
      <button type="button" className={tombolTerang} disabled={items.length >= MAX_PENGISI_ACARA} onClick={() => update([...items, { id: crypto.randomUUID(), nama: "", peran: "", instansi: "", profil: "" }])}>Tambah pengisi acara</button>
      {errors.pengisiAcara || formError ? <p role="alert" className={pesanGalat}>{errors.pengisiAcara ?? formError}</p> : null}
    </form>
  </KartuBagian>;
}
