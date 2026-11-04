"use client";

import { useActionState } from "react";
import { kolom, labelKolom, pesanGalat, tombolGelap } from "@/components/ui";
import { Saklar } from "@/app/undangan/isi/bidang";
import { ANNOUNCEMENT_KINDS, ANNOUNCEMENT_LABEL, SETTING_LIMITS, type PlatformSettings } from "@/lib/platform/settings";
import type { SaveResult } from "@/lib/save-result";
import { simpanPengaturanAction } from "./actions";

function Bagian({ id, judul, keterangan, children }: { id: string; judul: string; keterangan: string; children: React.ReactNode }) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-judul`}
      className="flex scroll-mt-6 flex-col gap-4 rounded-[10px] border border-garis bg-white p-5 sm:p-6"
    >
      <header>
        <h2 id={`${id}-judul`} className="m-0 font-judul text-2xl font-medium">
          {judul}
        </h2>
        <p className="mt-1 mb-0 text-sm leading-relaxed text-redup">{keterangan}</p>
      </header>
      {children}
    </section>
  );
}

function Galat({ pesan }: { pesan?: string }) {
  if (!pesan) return null;
  return (
    <span role="alert" className={pesanGalat}>
      {pesan}
    </span>
  );
}

export function FormPengaturan({ pengaturan }: { pengaturan: PlatformSettings }) {
  const [hasil, aksi, memproses] = useActionState<SaveResult | null, FormData>(simpanPengaturanAction, null);
  const galat = hasil && !hasil.ok ? (hasil.errors ?? {}) : {};

  return (
    <form action={aksi} className="flex flex-col gap-5">
      <Bagian
        id="pendaftaran"
        judul="Pendaftaran"
        keterangan="Matikan sementara bila ada lonjakan pendaftaran palsu. Akun lama tetap bisa masuk."
      >
        <Saklar label="Terima pendaftaran baru" name="daftarTerbuka" defaultChecked={pengaturan.daftarTerbuka} />
      </Bagian>

      <Bagian
        id="slug"
        judul="Slug yang dicadangkan"
        keterangan="Pengguna tidak bisa memakai kata ini sebagai nama link. Kata bawaan sistem (admin, api, u, masuk, daftar, dan lainnya) selalu dicadangkan."
      >
        <label className={labelKolom}>
          Kata tambahan
          <textarea
            name="slugCadangan"
            rows={3}
            defaultValue={pengaturan.slugCadangan.join(", ")}
            aria-invalid={galat.slugCadangan ? true : undefined}
            className={`${kolom} min-h-20 py-2.5 leading-relaxed`}
          />
          <span className="text-xs font-normal text-redup">Pisahkan dengan koma atau baris baru.</span>
          <Galat pesan={galat.slugCadangan} />
        </label>
      </Bagian>

      <Bagian
        id="pesan-wa"
        judul="Pesan WhatsApp bawaan"
        keterangan="Isi awal pesan saat pengguna belum menulis sendiri. Sisipan: {nama}, {link}, {batas_rsvp}, {event}. Kosongkan untuk memakai pesan sistem."
      >
        <label className={labelKolom}>
          Teks pesan
          <textarea
            name="pesanWaBawaan"
            rows={7}
            maxLength={SETTING_LIMITS.pesanWa}
            defaultValue={pengaturan.pesanWaBawaan}
            aria-invalid={galat.pesanWaBawaan ? true : undefined}
            className={`${kolom} min-h-40 py-2.5 leading-relaxed`}
          />
          <Galat pesan={galat.pesanWaBawaan} />
        </label>
      </Bagian>

      <Bagian
        id="pengumuman"
        judul="Pengumuman ke pengguna"
        keterangan="Pita di atas dashboard semua pengguna. Kosongkan teks untuk menyembunyikannya."
      >
        <label className={labelKolom}>
          Isi pengumuman
          <textarea
            name="pengumumanTeks"
            rows={3}
            maxLength={SETTING_LIMITS.pengumuman}
            defaultValue={pengaturan.pengumuman.teks}
            aria-invalid={galat.pengumumanTeks ? true : undefined}
            className={`${kolom} min-h-20 py-2.5 leading-relaxed`}
          />
          <Galat pesan={galat.pengumumanTeks} />
        </label>
        <div className="grid gap-3.5 sm:grid-cols-2">
          <label className={labelKolom}>
            Jenis
            <select name="pengumumanJenis" defaultValue={pengaturan.pengumuman.jenis} className={kolom}>
              {ANNOUNCEMENT_KINDS.map((jenis) => (
                <option key={jenis} value={jenis}>
                  {ANNOUNCEMENT_LABEL[jenis]}
                </option>
              ))}
            </select>
          </label>
          <label className={labelKolom}>
            Tampil sampai
            <input
              type="date"
              name="pengumumanSampai"
              defaultValue={pengaturan.pengumuman.sampai ?? ""}
              aria-invalid={galat.pengumumanSampai ? true : undefined}
              className={kolom}
            />
            <Galat pesan={galat.pengumumanSampai} />
          </label>
        </div>
      </Bagian>

      <Bagian
        id="pemeliharaan"
        judul="Mode pemeliharaan"
        keterangan="Menutup dashboard pengguna sementara. Halaman undangan dan RSVP untuk tamu tetap terbuka. Panel admin tidak terpengaruh."
      >
        <Saklar label="Aktifkan mode pemeliharaan" name="pemeliharaanAktif" defaultChecked={pengaturan.pemeliharaan.aktif} />
        <label className={labelKolom}>
          Pesan untuk pengguna
          <textarea
            name="pemeliharaanPesan"
            rows={3}
            maxLength={SETTING_LIMITS.pesanPemeliharaan}
            defaultValue={pengaturan.pemeliharaan.pesan}
            aria-invalid={galat.pemeliharaanPesan ? true : undefined}
            className={`${kolom} min-h-20 py-2.5 leading-relaxed`}
          />
          <Galat pesan={galat.pemeliharaanPesan} />
        </label>
      </Bagian>

      <div className="sticky bottom-0 flex flex-wrap items-center gap-3 border-t border-garis bg-kertas/95 py-3 backdrop-blur">
        <button type="submit" disabled={memproses} className={tombolGelap}>
          {memproses ? "Menyimpan…" : "Simpan perubahan"}
        </button>
        {hasil?.ok ? (
          <span role="status" className="text-sm font-medium text-hijau">
            Pengaturan tersimpan dan tercatat di log audit.
          </span>
        ) : null}
        {hasil && !hasil.ok ? (
          <span role="alert" className={pesanGalat}>
            {hasil.formError ?? "Periksa isian yang ditandai."}
          </span>
        ) : null}
      </div>
    </form>
  );
}
