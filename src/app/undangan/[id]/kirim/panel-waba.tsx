"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { kartu, tombolEmas } from "@/components/ui";
import { useInvitationAction } from "@/components/invitation-context";
import { kirimBatchWabaAction } from "./actions";

export function PanelWaba({
  tersedia,
  kuota,
  terkirim,
  templateName,
  tamuBelumTerkirim,
}: {
  tersedia: boolean;
  kuota: number;
  terkirim: number;
  templateName: string;
  tamuBelumTerkirim: number;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [hasil, setHasil] = useState<{
    pesan?: string;
    galat?: string;
  } | null>(null);

  const kirimBatchAction = useInvitationAction(kirimBatchWabaAction);

  if (!tersedia) return null;

  const handleKirimMassal = () => {
    if (kuota <= 0) return;
    const konfirmasi = confirm(
      `Kirim undangan ke tamu yang belum terkirim via WhatsApp Business API Resmi? Maksimal ${Math.min(
        kuota,
        tamuBelumTerkirim,
      )} pesan akan dikirim dan memotong kredit akun Anda.`,
    );
    if (!konfirmasi) return;

    setHasil(null);
    startTransition(async () => {
      try {
        const res = await kirimBatchAction();
        if (res.ok) {
          setHasil({
            pesan: `Berhasil mengirim ${res.totalSent} pesan via WABA resmi.${
              res.totalFailed > 0 ? ` (${res.totalFailed} gagal)` : ""
            } Sisa kredit: ${res.remainingQuota}.`,
          });
        } else {
          setHasil({
            galat: res.error || "Gagal melakukan pengiriman massal WABA.",
          });
        }
        router.refresh();
      } catch (err) {
        setHasil({
          galat: err instanceof Error ? err.message : "Terjadi kesalahan tak terduga.",
        });
      }
    });
  };

  return (
    <section aria-labelledby="judul-waba-resmi" className={`${kartu} flex flex-col gap-4 p-5 sm:p-6`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h2 id="judul-waba-resmi" className="m-0 font-judul text-2xl font-medium">
              WhatsApp Business API (WABA) Resmi
            </h2>
            <span className="rounded-full bg-hijau-bg px-2.5 py-0.5 text-xs font-semibold text-hijau">
              Resmi Meta
            </span>
          </div>
          <p className="m-0 text-sm text-redup">
            Kirim undangan langsung melalui cloud server WhatsApp resmi tanpa risiko blokir nomor dan tanpa perlu scan QR.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="rounded-lg border border-garis bg-kertas px-3 py-1.5 text-center">
            <span className="block text-[11px] font-medium uppercase tracking-wider text-redup">
              Sisa Kredit
            </span>
            <span className={`text-lg font-bold ${kuota > 0 ? "text-emas" : "text-merah"}`}>
              {kuota}
            </span>
          </div>
          <div className="rounded-lg border border-garis bg-kertas px-3 py-1.5 text-center">
            <span className="block text-[11px] font-medium uppercase tracking-wider text-redup">
              Total Terkirim
            </span>
            <span className="text-lg font-bold text-tinta">{terkirim}</span>
          </div>
        </div>
      </div>

      {kuota <= 0 ? (
        <div className="rounded-lg border border-merah/20 bg-merah-bg p-3.5 text-xs text-merah">
          <strong>Kredit pesan WABA Anda telah habis.</strong> Silakan hubungi Super Admin untuk penambahan kredit kuota pesan resmi.
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-emas/20 bg-emas/5 p-3.5 text-xs text-tinta-2">
          <div>
            Template Meta aktif: <code className="rounded bg-white px-1.5 py-0.5 font-mono text-[11px] font-semibold text-emas-tua">{templateName}</code>
            {tamuBelumTerkirim > 0 ? (
              <span className="ml-2 text-redup">· Ada {tamuBelumTerkirim} tamu belum terkirim</span>
            ) : (
              <span className="ml-2 text-hijau font-medium">· Semua tamu sudah terkirim</span>
            )}
          </div>
          {tamuBelumTerkirim > 0 ? (
            <button
              type="button"
              onClick={handleKirimMassal}
              disabled={isPending}
              className={`${tombolEmas} min-h-9 px-4 text-xs font-semibold`}
            >
              {isPending ? "Mengirim via WABA..." : `Kirim Massal WABA (${Math.min(kuota, tamuBelumTerkirim)} tamu)`}
            </button>
          ) : null}
        </div>
      )}

      {hasil?.pesan ? (
        <p className="m-0 rounded-lg bg-hijau-bg p-3 text-xs font-medium text-hijau" role="status">
          {hasil.pesan}
        </p>
      ) : null}

      {hasil?.galat ? (
        <p className="m-0 rounded-lg bg-merah-bg p-3 text-xs font-medium text-merah" role="alert">
          {hasil.galat}
        </p>
      ) : null}
    </section>
  );
}