"use client";

import { useActionState, useState } from "react";
import { Saklar } from "@/app/undangan/[id]/isi/bidang";
import { kolom, labelKolom, pesanGalat, tombolGelap, tombolTerang } from "@/components/ui";
import type { SmtpSecurity } from "@/lib/mail/config";
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
  const [host, setHost] = useState(config.host);
  const [port, setPort] = useState(String(config.port));
  const [keamanan, setKeamanan] = useState<SmtpSecurity>(config.keamanan);
  const [user, setUser] = useState(config.user);
  const [dariEmail, setDariEmail] = useState(config.dariEmail);
  const pakaiGoogle = () => {
    setHost("smtp.gmail.com");
    setPort("465");
    setKeamanan("ssl");
  };
  return (
    <form action={aksi} className="flex flex-col gap-4">
      <Saklar label="Aktifkan pengiriman surel" hint="Dipakai untuk mengirim undangan anggota tim. Bila mati, pemilik undangan hanya bisa menyalin tautan undangan." name="aktif" defaultChecked={config.aktif} />
      <div className="flex flex-col gap-1.5">
        <div>
          <button type="button" onClick={pakaiGoogle} className={tombolTerang}>Isi untuk Google (Gmail)</button>
        </div>
        <p className="m-0 text-xs text-redup">Mengisi server smtp.gmail.com, port 465, SSL/TLS. Isi nama pengguna dengan alamat Gmail lengkap dan kata sandi dengan Sandi Aplikasi 16 karakter (akun Google harus memakai verifikasi 2 langkah), bukan kata sandi akun. Alamat pengirim sebaiknya sama dengan alamat Gmail tersebut.</p>
      </div>
      <div className="grid gap-3.5 sm:grid-cols-6">
        <label className={`${labelKolom} sm:col-span-3`}>
          Server SMTP
          <input name="host" value={host} onChange={(e) => setHost(e.target.value)} placeholder="smtp.example.com" autoCapitalize="none" spellCheck={false} className={kolom} />
          <Galat pesan={galat.host} />
        </label>
        <label className={`${labelKolom} sm:col-span-1`}>
          Port
          <input name="port" type="number" inputMode="numeric" min={1} max={65535} value={port} onChange={(e) => setPort(e.target.value)} className={kolom} />
          <Galat pesan={galat.port} />
        </label>
        <label className={`${labelKolom} sm:col-span-2`}>
          Koneksi
          <select name="keamanan" value={keamanan} onChange={(e) => setKeamanan(e.target.value as SmtpSecurity)} className={kolom}>
            <option value="starttls">STARTTLS (port 587)</option>
            <option value="ssl">SSL/TLS (port 465)</option>
            <option value="tanpa">Tanpa enkripsi (tidak disarankan)</option>
          </select>
          <Galat pesan={galat.keamanan} />
        </label>
        <label className={`${labelKolom} sm:col-span-3`}>
          Nama pengguna
          <input name="user" value={user} onChange={(e) => setUser(e.target.value)} autoComplete="off" autoCapitalize="none" spellCheck={false} className={kolom} />
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
          <input name="dariEmail" type="email" value={dariEmail} onChange={(e) => setDariEmail(e.target.value)} placeholder="undangan@example.com" className={kolom} />
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
