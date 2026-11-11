"use client";

import { useInvitationAction } from "@/components/invitation-context";
import Image from "next/image";
import { useEffect, useState, useTransition } from "react";
import { kartu, tombolBahaya, tombolGelap, tombolTerang } from "@/components/ui";
import { hubungkanSayaAction, keluarkanSayaAction, putuskanSayaAction } from "./actions";

export type StatusWa = "mati" | "menyambung" | "menunggu-qr" | "terhubung" | "keluar";

export type DataKoneksi = {
  status: StatusWa;
  nomor: string | null;
  galat: string | null;
  qrImage: string | null;
};

const LABEL: Record<StatusWa, string> = {
  mati: "Terputus",
  menyambung: "Menyambung",
  "menunggu-qr": "Menunggu dipindai",
  terhubung: "Terhubung",
  keluar: "Belum ditautkan",
};

const WARNA: Record<StatusWa, string> = {
  mati: "bg-krem text-emas-tua",
  menyambung: "bg-krem text-emas-tua",
  "menunggu-qr": "bg-jingga-bg text-jingga",
  terhubung: "bg-hijau-bg text-hijau",
  keluar: "bg-krem text-emas-tua",
};

export function KoneksiWa({ awal, tersedia }: { awal: DataKoneksi; tersedia: boolean }) {
  const hubungkan = useInvitationAction(hubungkanSayaAction);
  const putuskan = useInvitationAction(putuskanSayaAction);
  const keluarkan = useInvitationAction(keluarkanSayaAction);
  const [data, setData] = useState<DataKoneksi>(awal);
  const [memproses, mulai] = useTransition();

  useEffect(() => {
    if (!tersedia) return;
    let aktif = true;
    async function muat() {
      if (document.hidden) return;
      try {
        const res = await fetch("/api/whatsapp/saya", { cache: "no-store" });
        if (!res.ok || !aktif) return;
        setData((await res.json()) as DataKoneksi);
      } catch {
        return;
      }
    }
    const timer = setInterval(muat, 2500);
    return () => {
      aktif = false;
      clearInterval(timer);
    };
  }, [tersedia]);

  function jalankan(aksi: () => Promise<void>) {
    mulai(async () => {
      await aksi();
      const res = await fetch("/api/whatsapp/saya", { cache: "no-store" });
      if (res.ok) setData((await res.json()) as DataKoneksi);
    });
  }

  const bisaHubungkan = data.status === "mati" || data.status === "keluar";
  const bisaPutus = data.status !== "mati" && data.status !== "keluar";

  return (
    <section aria-labelledby="judul-koneksi-wa" className={`${kartu} flex flex-col gap-4 p-5 sm:p-6`}>
      <header>
        <h2 id="judul-koneksi-wa" className="m-0 font-judul text-2xl font-medium">Nomor WhatsApp Anda</h2>
        <p className="mt-1 mb-0 text-sm leading-relaxed text-redup">
          Kirim otomatis memakai nomor WhatsApp Anda sendiri. Tautkan dengan memindai QR dari menu Perangkat tertaut di WhatsApp. Pesan ke tamu Anda dikirim dari nomor ini.
        </p>
      </header>
      {!tersedia ? (
        <p role="status" className="m-0 rounded-[10px] bg-krem p-3 text-sm leading-relaxed text-emas-tua">
          Kirim otomatis sedang dimatikan oleh admin. Gunakan tombol WhatsApp manual di daftar.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <span className={`rounded-full px-3 py-1 text-sm font-medium ${WARNA[data.status]}`}>{LABEL[data.status]}</span>
            {data.status === "terhubung" && data.nomor ? <span className="text-sm text-redup-2">Nomor pengirim {data.nomor}</span> : null}
          </div>
          {data.galat ? (
            <p role="alert" className="m-0 rounded-[10px] bg-galat-bg p-3 text-sm leading-relaxed text-galat">{data.galat}</p>
          ) : null}
          {data.status === "menunggu-qr" && data.qrImage ? (
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <Image src={data.qrImage} alt="Kode QR untuk menautkan WhatsApp" width={280} height={280} unoptimized className="size-[280px] rounded-lg border border-garis bg-white p-2" />
              <ol className="m-0 flex list-decimal flex-col gap-1.5 pl-5 text-sm leading-relaxed text-redup-2">
                <li>Buka WhatsApp di HP yang nomornya ingin dipakai mengirim.</li>
                <li>Pilih Perangkat tertaut, lalu Tautkan perangkat.</li>
                <li>Arahkan kamera ke kode ini. Kode diperbarui otomatis.</li>
              </ol>
            </div>
          ) : null}
          {data.status === "menyambung" ? <p className="m-0 text-sm text-redup">Sedang menyambung ke WhatsApp…</p> : null}
          <div className="flex flex-wrap gap-2">
            {bisaHubungkan ? (
              <button type="button" disabled={memproses} onClick={() => jalankan(hubungkan)} className={tombolGelap}>
                {data.status === "keluar" ? "Hubungkan dan buat QR" : "Hubungkan"}
              </button>
            ) : null}
            {bisaPutus ? (
              <button type="button" disabled={memproses} onClick={() => jalankan(putuskan)} className={tombolTerang}>
                Putuskan sementara
              </button>
            ) : null}
            {data.status !== "keluar" ? (
              <button
                type="button"
                disabled={memproses}
                onClick={() => {
                  if (window.confirm("Keluarkan perangkat ini dari WhatsApp? Anda harus memindai QR lagi untuk menyambung.")) jalankan(keluarkan);
                }}
                className={tombolBahaya}
              >
                Keluarkan perangkat
              </button>
            ) : null}
          </div>
        </>
      )}
    </section>
  );
}
