"use client";

import { useInvitationAction } from "@/components/invitation-context";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState, useTransition } from "react";
import { kartu, pesanGalat, tombolGelap, tombolTerang } from "@/components/ui";
import { batalkanAntreanAction, kirimOtomatisAction, type BlastState } from "./actions";

export type RingkasanAntrean = {
  menunggu: number;
  mengirim: number;
  terkirim: number;
  gagal: number;
};

export type KegagalanAntrean = { id: string; nama: string; error: string };

export function PanelOtomatis({
  jenis,
  tersedia,
  alasan,
  target,
  estimasiMenit,
  jedaMin,
  batasHarian,
  ringkasan,
  kegagalan,
}: {
  jenis: "undangan" | "pengingat";
  tersedia: boolean;
  alasan: string | null;
  target: number;
  estimasiMenit: number;
  jedaMin: number;
  batasHarian: number;
  ringkasan: RingkasanAntrean;
  kegagalan: KegagalanAntrean[];
}) {
  const kirimOtomatisActionForInvitation = useInvitationAction(kirimOtomatisAction);
  const batalkanAntreanActionForInvitation = useInvitationAction(batalkanAntreanAction);

  const router = useRouter();
  const [hasil, aksi, memproses] = useActionState<BlastState, FormData>(kirimOtomatisActionForInvitation, null);
  const [konfirmasi, setKonfirmasi] = useState(false);
  const [membatalkan, mulaiBatal] = useTransition();
  const aktif = ringkasan.menunggu + ringkasan.mengirim;

  useEffect(() => {
    if (aktif === 0) return;
    const timer = setInterval(() => router.refresh(), 5000);
    return () => clearInterval(timer);
  }, [aktif, router]);

  const label = jenis === "pengingat" ? "pengingat" : "undangan";
  const sisaKuota = Math.max(0, batasHarian - ringkasan.terkirim);

  return (
    <section aria-labelledby="judul-otomatis" className={`${kartu} flex flex-col gap-4 p-5 sm:p-6`}>
      <header>
        <h2 id="judul-otomatis" className="m-0 font-judul text-2xl font-medium">
          Kirim otomatis lewat WhatsApp
        </h2>
        <p className="mt-1 mb-0 text-sm leading-relaxed text-redup">
          Pesan masuk antrean dan dikirim satu per satu dengan jeda minimal {jedaMin} detik, jadi
          Anda tidak perlu menekan kirim untuk setiap tamu. Anda boleh menutup halaman ini. Batas
          pengiriman otomatis {batasHarian} pesan per 24 jam; sisa kuota Anda saat ini {sisaKuota}.
        </p>
      </header>

      {!tersedia ? (
        <p role="status" className="m-0 rounded-[10px] bg-krem p-3 text-sm leading-relaxed text-emas-tua">
          {alasan}
        </p>
      ) : (
        <form action={aksi} className="flex flex-col gap-3">
          <input type="hidden" name="jenis" value={jenis} />
          {!konfirmasi ? (
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                disabled={target === 0}
                onClick={() => setKonfirmasi(true)}
                className={tombolGelap}
              >
                {target === 0 ? `Tidak ada ${label} yang perlu dikirim` : `Kirim ${label} ke ${target} tamu`}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3 rounded-[10px] bg-kertas p-4">
              <p className="m-0 text-sm leading-relaxed">
                Kirim {label} ke <strong>{target} tamu</strong>? Perkiraan selesai sekitar{" "}
                <strong>{estimasiMenit} menit</strong>. Pesan yang sudah masuk antrean masih bisa
                dibatalkan.
                {target > sisaKuota
                  ? ` Kuota 24 jam Anda tinggal ${sisaKuota}, jadi sisanya menunggu sampai kuota pulih.`
                  : ""}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="submit"
                  disabled={memproses}
                  onClick={() => setTimeout(() => setKonfirmasi(false), 0)}
                  className={tombolGelap}
                >
                  {memproses ? "Memasukkan ke antrean…" : "Ya, kirim"}
                </button>
                <button type="button" onClick={() => setKonfirmasi(false)} className={tombolTerang}>
                  Batal
                </button>
              </div>
            </div>
          )}
          {hasil?.ok ? (
            <p role="status" className="m-0 text-sm font-medium text-hijau">
              {hasil.added} pesan masuk antrean.
            </p>
          ) : null}
          {hasil && !hasil.ok ? (
            <p role="alert" className={`m-0 ${pesanGalat}`}>
              {hasil.error}
            </p>
          ) : null}
        </form>
      )}

      {aktif > 0 || ringkasan.terkirim > 0 || ringkasan.gagal > 0 ? (
        <div className="flex flex-col gap-3">
          <dl className="m-0 grid grid-cols-3 gap-3">
            {(
              [
                ["Dalam antrean", aktif],
                ["Terkirim (24 jam)", ringkasan.terkirim],
                ["Gagal (24 jam)", ringkasan.gagal],
              ] as const
            ).map(([judul, nilai]) => (
              <div key={judul} className="rounded-[10px] bg-kertas p-3">
                <dt className="text-xs text-redup">{judul}</dt>
                <dd className="m-0 mt-0.5 font-judul text-2xl font-medium">{nilai}</dd>
              </div>
            ))}
          </dl>
          {ringkasan.menunggu > 0 ? (
            <div>
              <button
                type="button"
                disabled={membatalkan}
                onClick={() =>
                  mulaiBatal(async () => {
                    await batalkanAntreanActionForInvitation();
                    router.refresh();
                  })
                }
                className={tombolTerang}
              >
                {membatalkan ? "Membatalkan…" : `Batalkan ${ringkasan.menunggu} pesan yang menunggu`}
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      {kegagalan.length > 0 ? (
        <div className="flex flex-col gap-1">
          <h3 className="m-0 text-sm font-medium">Gagal terkirim</h3>
          <ul className="m-0 flex list-none flex-col gap-1 p-0">
            {kegagalan.map((k) => (
              <li key={k.id} className="text-[13px] text-redup-2">
                <span className="font-medium text-tinta">{k.nama}</span> · {k.error}
              </li>
            ))}
          </ul>
          <p className="m-0 text-xs text-redup">
            Tamu yang gagal tetap tercatat belum dikirimi. Kirim otomatis lagi, atau pakai tombol
            manual di daftar.
          </p>
        </div>
      ) : null}
    </section>
  );
}
