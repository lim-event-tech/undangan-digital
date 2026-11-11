"use client";

import { useActionState } from "react";
import { Saklar } from "@/app/undangan/[id]/isi/bidang";
import { kolom, labelKolom, pesanGalat, tombolGelap, tombolTerang } from "@/components/ui";
import type { SmtpView } from "@/lib/mail/service";
import type { SaveResult } from "@/lib/save-result";
import { simpanSurelAction, ujiSurelAction, type UjiSurelResult } from "./actions";

function Galat({ pesan }: { pesan?: string }) {
  if (!pesan) return null;
  return <span role="alert" className={pesanGalat}>{pesan}</span>;
}

export function FormSurel({ config }: { config: SmtpView }) {
  const [hasil, aksi, memproses] = useActionState<SaveResult | null, FormData>(simpanSurelAction, null);
  const galat = hasil && !hasil.ok ? (hasil.errors ?? {}) : {};
  return (
    <form action={aksi} className="flex flex-col gap-4">
      <Saklar label="Aktifkan pengiriman surel" hint="Dipakai untuk mengirim undangan anggota tim. Bila mati, pemilik undangan hanya bisa menyalin tautan undangan." name="aktif" defaultChecked={config.aktif} />
      <div className="grid gap-3.5 sm:grid-cols-6">
        <label className={`${labelKolom} sm:col-span-3`}>
          Server SMTP
          <input name="host" defaultValue={config.host} placeholder="smtp.example.com" autoCapitalize="none" spellCheck={false} className={kolom} />
          <Galat pesan={galat.host} />
        </label>
        <label className={`${labelKolom} sm:col-span-1`}>
          Port
          <input name="port" type="number" inputMode="numeric" min={1} max={65535} defaultValue={config.port} className={kolom} />
          <Galat pesan={galat.port} />
        </label>
        <label className={`${labelKolom} sm:col-span-2`}>
          Koneksi
          <select name="keamanan" defaultValue={config.keamanan} className={kolom}>
            <option value="starttls">STARTTLS (port 587)</option>
            <option value="ssl">SSL/TLS (port 465)</option>
            <option value="tanpa">Tanpa enkripsi (tidak disarankan)</option>
          </select>
          <Galat pesan={galat.keamanan} />
        </label>
        <label className={`${labelKolom} sm:col-span-3`}>
          Nama pengguna
          <input name="user" defaultValue={config.user} autoComplete="off" autoCapitalize="none" spellCheck={false} className={kolom} />
          <Galat pesan={galat.user} />
        </label>
        <label className={`${labelKolom} sm:col-span-3`}>
          Kata sandi
          <input name="password" type="password" autoComplete="new-password" placeholder={config.adaPassword ? "Tersimpan. Kosongkan untuk tidak mengubah" : ""} className={kolom} />
          <Galat pesan={galat.password} />
        </label>
        {config.adaPassword ? (
          <div className="sm:col-span-6">
            <Saklar label="Hapus kata sandi tersimpan" name="hapusPassword" />
          </div>
        ) : null}
        <label className={`${labelKolom} sm:col-span-3`}>
          Nama pengirim
          <input name="dariNama" defaultValue={config.dariNama} className={kolom} />
        </label>
        <label className={`${labelKolom} sm:col-span-3`}>
          Alamat pengirim
          <input name="dariEmail" type="email" defaultValue={config.dariEmail} placeholder="undangan@example.com" className={kolom} />
          <Galat pesan={galat.dariEmail} />
        </label>
      </div>
      <p className="m-0 text-xs text-redup">Kata sandi disimpan terenkripsi dan tidak pernah ditampilkan kembali.</p>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={memproses} className={tombolGelap}>{memproses ? "Menyimpan…" : "Simpan pengaturan"}</button>
        {hasil?.ok ? <span role="status" className="text-sm font-medium text-hijau">Tersimpan dan tercatat di log audit.</span> : null}
        {hasil && !hasil.ok && hasil.formError ? <span role="alert" className={pesanGalat}>{hasil.formError}</span> : null}
      </div>
    </form>
  );
}

export function FormUjiSurel({ tujuan, siap }: { tujuan: string; siap: boolean }) {
  const [hasil, aksi, memproses] = useActionState<UjiSurelResult, FormData>(ujiSurelAction, null);
  return (
    <form action={aksi} className="flex flex-col gap-3">
      <label className={labelKolom}>
        Kirim surel uji ke
        <input name="tujuan" type="email" defaultValue={tujuan} disabled={!siap} className={`${kolom} sm:max-w-sm`} />
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={!siap || memproses} className={tombolTerang}>{memproses ? "Mengirim…" : "Kirim surel uji"}</button>
        {!siap ? <span className="text-sm text-redup">Simpan dan aktifkan pengaturan dulu.</span> : null}
        {hasil?.ok ? <span role="status" className="text-sm font-medium text-hijau">Surel uji terkirim.</span> : null}
        {hasil && !hasil.ok ? <span role="alert" className={pesanGalat}>{hasil.error}</span> : null}
      </div>
    </form>
  );
}
