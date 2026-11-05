"use client";

import jsQR from "jsqr";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { pesanGalat, tombolGelap, tombolTerang } from "@/components/ui";
import {
  batalkanAction,
  cariAction,
  masukkanAction,
  pindaiAction,
  type GuestInfo,
  type UsherResult,
} from "./actions";

const SCAN_INTERVAL_MS = 220;
const SAME_CODE_PAUSE_MS = 3500;

function jam(iso: string): string {
  const local = new Date(new Date(iso).getTime() + 7 * 3_600_000);
  return `${String(local.getUTCHours()).padStart(2, "0")}.${String(local.getUTCMinutes()).padStart(2, "0")}`;
}

function orang(guest: GuestInfo): string {
  return `${guest.attendeeCount} peserta`;
}

const TAMPILAN: Record<string, { judul: string; kelas: string }> = {
  masuk: { judul: "Silakan masuk", kelas: "bg-hijau-bg text-hijau" },
  "sudah-masuk": { judul: "Sudah masuk", kelas: "bg-jingga-bg text-jingga" },
  "belum-konfirmasi": { judul: "Belum konfirmasi hadir", kelas: "bg-jingga-bg text-jingga" },
  "undangan-lain": { judul: "QR dari undangan lain", kelas: "bg-galat-bg text-galat" },
  "tidak-dikenal": { judul: "Tamu tidak dikenal", kelas: "bg-galat-bg text-galat" },
  "kode-tidak-valid": { judul: "Kode tidak valid", kelas: "bg-galat-bg text-galat" },
  ditolak: { judul: "Ditolak", kelas: "bg-galat-bg text-galat" },
};

function KartuHasil({
  hasil,
  onTetapMasuk,
}: {
  hasil: UsherResult;
  onTetapMasuk: (guest: GuestInfo) => void;
}) {
  const tampilan = TAMPILAN[hasil.status] ?? TAMPILAN["tidak-dikenal"];
  const guest = hasil.status === "ditolak" ? null : hasil.guest;
  return (
    <div role="status" aria-live="assertive" className={`flex flex-col gap-1.5 rounded-[10px] p-5 ${tampilan.kelas}`}>
      <span className="text-xs font-medium tracking-[0.14em] uppercase">{tampilan.judul}</span>
      {hasil.status === "ditolak" ? <span className="text-sm">{hasil.pesan}</span> : null}
      {guest ? (
        <>
          <span className="font-judul text-[30px] leading-tight font-medium">{guest.name}</span>
          <span className="text-sm">
            {guest.groupName ? `${guest.groupName} · ` : ""}
            {guest.attending ? orang(guest) : "Belum konfirmasi hadir"}
          </span>
          {hasil.status === "sudah-masuk" && guest.checkedInAt ? (
            <span className="text-sm">Masuk pukul {jam(guest.checkedInAt)}</span>
          ) : null}
          {hasil.status === "belum-konfirmasi" ? (
            <div className="pt-1">
              <button type="button" onClick={() => onTetapMasuk(guest)} className={tombolGelap}>
                Tetap masukkan
              </button>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

export function Pemindai({ slug, kunci }: { slug: string; kunci: string }) {
  const video = useRef<HTMLVideoElement>(null);
  const kanvas = useRef<HTMLCanvasElement>(null);
  const aliran = useRef<MediaStream | null>(null);
  const terakhir = useRef<{ kode: string; waktu: number }>({ kode: "", waktu: 0 });
  const sibuk = useRef(false);

  const [kameraAktif, setKameraAktif] = useState(false);
  const [galatKamera, setGalatKamera] = useState<string | null>(null);
  const [hasil, setHasil] = useState<UsherResult | null>(null);
  const [cari, setCari] = useState("");
  const [daftar, setDaftar] = useState<GuestInfo[] | null>(null);
  const [galatCari, setGalatCari] = useState<string | null>(null);
  const [, mulai] = useTransition();

  const proses = useCallback(
    async (kode: string) => {
      if (sibuk.current) return;
      sibuk.current = true;
      try {
        setHasil(await pindaiAction(slug, kunci, kode));
      } catch {
        setHasil({ status: "ditolak", pesan: "Koneksi bermasalah. Coba lagi." });
      } finally {
        sibuk.current = false;
      }
    },
    [slug, kunci],
  );

  const matikanKamera = useCallback(() => {
    aliran.current?.getTracks().forEach((track) => track.stop());
    aliran.current = null;
    setKameraAktif(false);
  }, []);

  useEffect(() => matikanKamera, [matikanKamera]);

  useEffect(() => {
    if (!kameraAktif) return;
    let berhenti = false;
    const timer = setInterval(() => {
      const el = video.current;
      const canvas = kanvas.current;
      if (berhenti || !el || !canvas || el.readyState < 2 || sibuk.current) return;
      const lebar = Math.min(el.videoWidth, 640);
      const tinggi = Math.round((lebar / el.videoWidth) * el.videoHeight);
      if (!lebar || !tinggi) return;
      canvas.width = lebar;
      canvas.height = tinggi;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) return;
      context.drawImage(el, 0, 0, lebar, tinggi);
      const gambar = context.getImageData(0, 0, lebar, tinggi);
      const temuan = jsQR(gambar.data, lebar, tinggi, { inversionAttempts: "dontInvert" });
      if (!temuan?.data) return;
      const sekarang = Date.now();
      if (temuan.data === terakhir.current.kode && sekarang - terakhir.current.waktu < SAME_CODE_PAUSE_MS) return;
      terakhir.current = { kode: temuan.data, waktu: sekarang };
      void proses(temuan.data);
    }, SCAN_INTERVAL_MS);
    return () => {
      berhenti = true;
      clearInterval(timer);
    };
  }, [kameraAktif, proses]);

  async function nyalakanKamera() {
    setGalatKamera(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setGalatKamera("Peramban ini tidak bisa membuka kamera. Gunakan kolom kode atau cari nama tamu.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      aliran.current = stream;
      if (video.current) {
        video.current.srcObject = stream;
        await video.current.play();
      }
      setKameraAktif(true);
    } catch {
      setGalatKamera("Kamera tidak bisa dibuka. Izinkan akses kamera di peramban, atau pakai kolom kode.");
    }
  }

  function muatDaftar(kata: string) {
    mulai(async () => {
      const hasilCari = await cariAction(slug, kunci, kata);
      if (hasilCari.status === "ok") {
        setDaftar(hasilCari.guests);
        setGalatCari(null);
      } else {
        setGalatCari(hasilCari.pesan);
      }
    });
  }

  async function masukkan(guest: GuestInfo) {
    setHasil(await masukkanAction(slug, kunci, guest.id));
    if (daftar) muatDaftar(cari);
  }

  async function batalkan(guest: GuestInfo) {
    await batalkanAction(slug, kunci, guest.id);
    setHasil(null);
    muatDaftar(cari);
  }

  return (
    <div className="flex flex-col gap-5">
      <section aria-labelledby="judul-pindai" className="flex flex-col gap-3 rounded-[10px] border border-garis bg-white p-4">
        <h2 id="judul-pindai" className="m-0 font-judul text-2xl font-medium">
          Pindai QR tamu
        </h2>
        <div className={`relative overflow-hidden rounded-lg bg-tinta ${kameraAktif ? "" : "hidden"}`}>
          <video ref={video} muted playsInline className="aspect-square w-full object-cover" />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-[18%] rounded-xl border-2 border-white/80"
          />
        </div>
        <canvas ref={kanvas} className="hidden" />
        <div className="flex flex-wrap gap-2">
          {kameraAktif ? (
            <button type="button" onClick={matikanKamera} className={tombolTerang}>
              Matikan kamera
            </button>
          ) : (
            <button type="button" onClick={nyalakanKamera} className={tombolGelap}>
              Nyalakan kamera
            </button>
          )}
        </div>
        {galatKamera ? (
          <p role="alert" className={`m-0 ${pesanGalat}`}>
            {galatKamera}
          </p>
        ) : null}
      </section>

      {hasil ? <KartuHasil hasil={hasil} onTetapMasuk={(guest) => void masukkan(guest)} /> : null}

      <section aria-labelledby="judul-cari" className="flex flex-col gap-3 rounded-[10px] border border-garis bg-white p-4">
        <h2 id="judul-cari" className="m-0 font-judul text-2xl font-medium">
          Cari nama tamu
        </h2>
        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            muatDaftar(cari);
          }}
        >
          <label className="sr-only" htmlFor="cari-nama">
            Nama tamu
          </label>
          <input
            id="cari-nama"
            type="search"
            value={cari}
            onChange={(event) => setCari(event.target.value)}
            placeholder="Nama tamu"
            className="min-h-11 min-w-0 flex-1 rounded-md border border-garis-input bg-white px-3 text-sm focus:border-emas-muda focus:ring-3 focus:ring-emas-muda/20 focus:outline-none"
          />
          <button type="submit" className={tombolTerang}>
            Cari
          </button>
        </form>
        {galatCari ? (
          <p role="alert" className={`m-0 ${pesanGalat}`}>
            {galatCari}
          </p>
        ) : null}
        {daftar ? (
          daftar.length === 0 ? (
            <p className="m-0 text-sm text-redup">Tidak ada tamu yang cocok.</p>
          ) : (
            <ul className="m-0 flex list-none flex-col p-0">
              {daftar.map((guest) => (
                <li key={guest.id} className="flex items-center justify-between gap-3 border-t border-garis-halus py-3 first:border-t-0">
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate font-medium">{guest.name}</span>
                    <span className="text-xs text-redup">
                      {guest.attending ? `Hadir · ${orang(guest)}` : "Belum konfirmasi hadir"}
                      {guest.checkedInAt ? ` · masuk ${jam(guest.checkedInAt)}` : ""}
                    </span>
                  </div>
                  {guest.checkedInAt ? (
                    <button type="button" onClick={() => void batalkan(guest)} className={`${tombolTerang} min-h-10 px-3.5`}>
                      Batalkan
                    </button>
                  ) : (
                    <button type="button" onClick={() => void masukkan(guest)} className={`${tombolGelap} min-h-10 px-3.5`}>
                      Masukkan
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )
        ) : null}
      </section>
    </div>
  );
}
