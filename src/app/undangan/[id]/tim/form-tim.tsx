"use client";

import { useInvitationAction } from "@/components/invitation-context";
import { useActionState, useState } from "react";
import { Ikon } from "@/components/ikon";
import { kolom, labelKolom, pesanGalat, tombolBahaya, tombolGelap, tombolTerang } from "@/components/ui";
import { CHECKIN_ACCESS_OPTIONS, ROLE_OPTIONS, type CheckinAccess, type Role } from "@/lib/team/access";
import { cabutUndanganAction, keluarkanAnggotaAction, ubahAnggotaAction, undangAnggotaAction, type UndangState } from "./actions";

function SalinTautan({ link }: { link: string }) {
  const [status, setStatus] = useState<"diam" | "tersalin" | "gagal">("diam");
  async function salin() {
    try {
      await navigator.clipboard.writeText(link);
      setStatus("tersalin");
    } catch {
      setStatus("gagal");
    }
    setTimeout(() => setStatus("diam"), 1800);
  }
  return (
    <button type="button" onClick={salin} className={tombolTerang}>
      <Ikon nama={status === "tersalin" ? "ceklis" : "salin"} ukuran={16} />
      {status === "tersalin" ? "Tautan tersalin" : status === "gagal" ? "Gagal menyalin" : "Salin tautan"}
    </button>
  );
}

export function FormUndang({ penuh }: { penuh: boolean }) {
  const undang = useInvitationAction(undangAnggotaAction);
  const [hasil, aksi, memproses] = useActionState<UndangState, FormData>(undang, null);
  return (
    <form action={aksi} className="flex flex-col gap-3">
      <label className={labelKolom}>
        Email anggota baru
        <input name="email" type="email" required disabled={penuh} placeholder="nama@gmail.com" autoComplete="off" className={`${kolom} sm:max-w-md`} />
      </label>
      <div className="grid gap-3 sm:max-w-md sm:grid-cols-2">
        <label className={labelKolom}>
          Peran
          <select name="peran" defaultValue="anggota" disabled={penuh} className={kolom}>
            {ROLE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </label>
        <label className={labelKolom}>
          Hak check-in
          <select name="checkin" defaultValue="milik" disabled={penuh} className={kolom}>
            {CHECKIN_ACCESS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </label>
      </div>
      <p className="m-0 text-xs leading-relaxed text-redup">Pemilik setara dengan pembuat undangan: bisa mengisi undangan, mengatur tim, melihat dan mengekspor semua data. Hanya pembuat yang bisa menghapus undangan.</p>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={penuh || memproses} className={tombolGelap}>{memproses ? "Mengirim…" : "Kirim undangan"}</button>
        {penuh ? <span className="text-sm text-redup">Anggota tim sudah mencapai batas.</span> : null}
      </div>
      {hasil && !hasil.ok ? <p role="alert" className={`m-0 ${pesanGalat}`}>{hasil.error}</p> : null}
      {hasil?.ok ? (
        <div role="status" className="flex flex-col gap-2 rounded-[10px] bg-kertas p-4 text-sm leading-relaxed">
          {hasil.surel === "terkirim" ? (
            <p className="m-0 font-medium text-hijau">Undangan dikirim ke {hasil.email}.</p>
          ) : (
            <p className="m-0 font-medium text-emas-tua">
              {hasil.surel === "tidak-diatur" ? "Pengiriman surel belum diatur admin, jadi kirim tautan ini sendiri ke " : `Surel gagal terkirim (${hasil.galatSurel}). Kirim tautan ini sendiri ke `}
              {hasil.email}.
            </p>
          )}
          <code className="overflow-x-auto rounded-md bg-white px-3 py-2 text-[13px] text-tinta-2">{hasil.link}</code>
          <div><SalinTautan link={hasil.link} /></div>
          <p className="m-0 text-xs text-redup">Tautan hanya ditampilkan sekarang. Berlaku 7 hari dan hanya bisa dipakai sekali.</p>
        </div>
      ) : null}
    </form>
  );
}

export function TombolCabut({ id, email }: { id: string; email: string }) {
  const cabut = useInvitationAction(cabutUndanganAction);
  return (
    <form action={cabut}>
      <input type="hidden" name="id" value={id} />
      <button type="submit" aria-label={`Batalkan undangan untuk ${email}`} className={tombolTerang}>Batalkan</button>
    </form>
  );
}

export function TombolKeluarkan({ userId, nama }: { userId: string; nama: string }) {
  const keluarkan = useInvitationAction(keluarkanAnggotaAction);
  return (
    <form
      action={keluarkan}
      onSubmit={(event) => {
        if (!window.confirm(`Keluarkan ${nama} dari tim? Tamu yang ia tambahkan menjadi milik Anda.`)) event.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={userId} />
      <button type="submit" aria-label={`Keluarkan ${nama}`} className={tombolBahaya}>Keluarkan</button>
    </form>
  );
}

export function FormAturAnggota({ userId, nama, peran, checkin }: { userId: string; nama: string; peran: Role; checkin: CheckinAccess }) {
  const ubah = useInvitationAction(ubahAnggotaAction);
  return (
    <form action={ubah} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="id" value={userId} />
      <label className="flex flex-col gap-1 text-xs text-redup">
        Peran
        <select name="peran" defaultValue={peran} aria-label={`Peran ${nama}`} className={`${kolom} min-h-10 py-1.5 text-sm`}>
          {ROLE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs text-redup">
        Hak check-in
        <select name="checkin" defaultValue={checkin} aria-label={`Hak check-in ${nama}`} className={`${kolom} min-h-10 py-1.5 text-sm`}>
          {CHECKIN_ACCESS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </label>
      <button type="submit" className={`${tombolTerang} min-h-10 px-3.5`}>Simpan</button>
    </form>
  );
}
