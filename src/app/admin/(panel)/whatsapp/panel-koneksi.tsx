"use client";

import Image from "next/image";
import { useEffect, useState, useTransition } from "react";
import { tombolBahaya, tombolGelap, tombolTerang } from "@/components/ui";
import { hubungkanAction, keluarkanAction, putuskanAction } from "./actions";

export type StatusWa = "mati" | "menyambung" | "menunggu-qr" | "terhubung" | "keluar";

export type DataKoneksi = {
  status: StatusWa;
  nomor: string | null;
  galat: string | null;
  sejak: number | null;
  qrImage: string | null;
  antrean: { menunggu: number; mengirim: number; terkirim: number; gagal: number };
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

export function PanelKoneksi({ awal }: { awal: DataKoneksi }) {
  const [data, setData] = useState<DataKoneksi>(awal);
  const [memproses, mulai] = useTransition();

  useEffect(() => {
    let aktif = true;
    async function muat() {
      if (document.hidden) return;
      try {
        const res = await fetch("/api/admin/whatsapp", { cache: "no-store" });
        if (!res.ok || !aktif) return;
        setData((await res.json()) as DataKoneksi);
      } catch {
        return;
      }
    }
    const timer = setInterval(muat, 2000);
    return () => {
      aktif = false;
      clearInterval(timer);
    };
  }, []);

  function jalankan(aksi: () => Promise<void>) {
    mulai(async () => {
      await aksi();
      const res = await fetch("/api/admin/whatsapp", { cache: "no-store" });
      if (res.ok) setData((await res.json()) as DataKoneksi);
    });
  }

  const tersambung = data.status === "terhubung";
  const bisaHubungkan = data.status === "mati" || data.status === "keluar";
  const bisaPutus = data.status !== "mati" && data.status !== "keluar";

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <span className={`rounded-full px-3 py-1 text-sm font-medium ${WARNA[data.status]}`}>
          {LABEL[data.status]}
        </span>
        {tersambung && data.nomor ? (
          <span className="text-sm text-redup-2">Nomor pengirim {data.nomor}</span>
        ) : null}
      </div>

      {data.galat ? (
        <p role="alert" className="m-0 rounded-[10px] bg-galat-bg p-3 text-sm leading-relaxed text-galat">
          {data.galat}
        </p>
      ) : null}

      {data.status === "menunggu-qr" && data.qrImage ? (
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
          <Image
            src={data.qrImage}
            alt="Kode QR untuk menautkan WhatsApp"
            width={280}
            height={280}
            unoptimized
            className="size-[280px] rounded-lg border border-garis bg-white p-2"
          />
          <ol className="m-0 flex list-decimal flex-col gap-1.5 pl-5 text-sm leading-relaxed text-redup-2">
            <li>Buka WhatsApp di HP yang nomornya dipakai untuk mengirim.</li>
            <li>Pilih Perangkat tertaut, lalu Tautkan perangkat.</li>
            <li>Arahkan kamera ke kode ini. Kode diperbarui otomatis.</li>
          </ol>
        </div>
      ) : null}

      {data.status === "menyambung" ? (
        <p className="m-0 text-sm text-redup">Sedang menyambung ke WhatsApp…</p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {bisaHubungkan ? (
          <button
            type="button"
            disabled={memproses}
            onClick={() => jalankan(hubungkanAction)}
            className={tombolGelap}
          >
            {data.status === "keluar" ? "Hubungkan dan buat QR" : "Hubungkan"}
          </button>
        ) : null}
        {bisaPutus ? (
          <button
            type="button"
            disabled={memproses}
            onClick={() => jalankan(putuskanAction)}
            className={tombolTerang}
          >
            Putuskan sementara
          </button>
        ) : null}
        {data.status !== "keluar" ? (
          <button
            type="button"
            disabled={memproses}
            onClick={() => {
              if (window.confirm("Keluarkan perangkat ini dari WhatsApp? Anda harus memindai QR lagi untuk menyambung.")) {
                jalankan(keluarkanAction);
              }
            }}
            className={tombolBahaya}
          >
            Keluarkan perangkat
          </button>
        ) : null}
      </div>

      <dl className="m-0 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {(
          [
            ["Menunggu", data.antrean.menunggu + data.antrean.mengirim],
            ["Terkirim (24 jam)", data.antrean.terkirim],
            ["Gagal (24 jam)", data.antrean.gagal],
          ] as const
        ).map(([label, nilai]) => (
          <div key={label} className="rounded-[10px] bg-kertas p-3">
            <dt className="text-xs text-redup">{label}</dt>
            <dd className="m-0 mt-0.5 font-judul text-2xl font-medium">{nilai}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
