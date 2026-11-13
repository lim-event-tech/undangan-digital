"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Ikon } from "@/components/ikon";
import { kartu, tombolEmas, tombolTerang } from "@/components/ui";
import { useInvitationAction } from "@/components/invitation-context";
import type { WabaTemplateItem } from "@/lib/waba/client";
import {
  renderTemplatePreview,
  type TemplateVariableContext,
} from "@/lib/waba/templates-guide";
import { ModalAjukanTemplate } from "@/components/waba/modal-ajukan-template";
import {
  ajukanTemplateWabaAction,
  kirimBatchWabaAction,
  simpanPilihanTemplateWabaAction,
} from "./actions";

export function PanelWaba({
  tersedia,
  gatewayAktif = false,
  kuota,
  terkirim,
  templateName,
  tamuBelumTerkirim,
  daftarTemplate = [],
  sampleContext,
}: {
  tersedia: boolean;
  gatewayAktif?: boolean;
  kuota: number;
  terkirim: number;
  templateName: string;
  tamuBelumTerkirim: number;
  daftarTemplate?: WabaTemplateItem[];
  sampleContext: TemplateVariableContext;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedTemplate, setSelectedTemplate] = useState<string>(templateName);
  const [bukaModalAjukan, setBukaModalAjukan] = useState(false);
  const [pesanTemplate, setPesanTemplate] = useState<string | null>(null);

  const [hasil, setHasil] = useState<{
    pesan?: string;
    galat?: string;
  } | null>(null);

  const kirimBatchAction = useInvitationAction(kirimBatchWabaAction);
  const simpanPilihanAction = useInvitationAction(simpanPilihanTemplateWabaAction);
  const ajukanTemplateAction = useInvitationAction(ajukanTemplateWabaAction);

  if (!tersedia) return null;

  const currentTemplateItem = daftarTemplate.find((t) => t.name === selectedTemplate);

  const handleSimpanPilihanTemplate = () => {
    setPesanTemplate(null);
    startTransition(async () => {
      try {
        const res = await simpanPilihanAction(selectedTemplate);
        if (res.ok) {
          setPesanTemplate("Template WhatsApp berhasil disimpan untuk undangan ini.");
          router.refresh();
        } else {
          setHasil({ galat: res.error || "Gagal menyimpan pilihan template." });
        }
      } catch (err) {
        setHasil({ galat: err instanceof Error ? err.message : "Terjadi kesalahan." });
      }
    });
  };

  const handleKirimMassal = () => {
    if (!gatewayAktif) {
      alert("Koneksi Gateway WABA belum diaktifkan oleh Administrator di Admin Panel.");
      return;
    }
    if (kuota <= 0) return;
    const konfirmasi = confirm(
      `Kirim undangan ke tamu yang belum terkirim via WhatsApp Business API Resmi menggunakan template "${selectedTemplate}"? Maksimal ${Math.min(
        kuota,
        tamuBelumTerkirim,
      )} pesan akan dikirim dan memotong kredit akun Anda.`,
    );
    if (!konfirmasi) return;

    setHasil(null);
    startTransition(async () => {
      try {
        const res = await kirimBatchAction(selectedTemplate);
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

  const preview = currentTemplateItem
    ? renderTemplatePreview(
        currentTemplateItem.bodyText,
        sampleContext,
        currentTemplateItem.headerFormat === "TEXT" ? "Undangan Resmi" : undefined,
        "LIM-RSVP · Lingkar Ide Manajemen",
        currentTemplateItem.headerFormat,
      )
    : renderTemplatePreview(
        "{{1}}",
        sampleContext,
        undefined,
        "LIM-RSVP · Lingkar Ide Manajemen",
        "IMAGE",
      );

  return (
    <section aria-labelledby="judul-waba-resmi" className={`${kartu} flex flex-col gap-4 p-5 sm:p-6`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h2 id="judul-waba-resmi" className="m-0 font-judul text-2xl font-medium">
              WhatsApp Business API (WABA) Resmi
            </h2>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                gatewayAktif ? "bg-hijau-bg text-hijau" : "bg-jingga-bg text-jingga"
              }`}
            >
              {gatewayAktif ? "Resmi Meta (Aktif)" : "Resmi Meta (Gateway Nonaktif)"}
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

      {!gatewayAktif ? (
        <div className="rounded-lg border border-jingga/30 bg-jingga-bg p-3.5 text-xs leading-relaxed text-jingga">
          <strong className="font-semibold">Gateway WABA Sistem Belum Diaktifkan.</strong> Akun Anda telah diberi izin resmi WABA Meta, namun koneksi Gateway WABA di sistem saat ini berstatus <em>Nonaktif</em> di pengaturan sistem. Silakan hubungi Super Admin untuk mengaktifkan saklar WABA di menu <strong>Admin &gt; WhatsApp</strong> agar pengiriman dapat berjalan.
        </div>
      ) : null}

      {/* Bagian Pemilihan & Panduan Template */}
      <div className="flex flex-col gap-3 rounded-lg border border-garis bg-kertas/60 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="m-0 text-sm font-semibold text-tinta">Pilih Template WhatsApp Resmi</h3>
            <p className="mt-0.5 mb-0 text-xs text-redup">
              Pengiriman WABA wajib menggunakan template yang disetujui (Approved) oleh Meta.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setBukaModalAjukan(true)}
            className={`${tombolTerang} min-h-9 px-3 text-xs font-semibold`}
          >
            + Ajukan Template Baru
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label htmlFor="pilih-template-waba" className="sr-only">
            Pilih Template WhatsApp
          </label>
          <select
            id="pilih-template-waba"
            value={selectedTemplate}
            onChange={(e) => {
              setSelectedTemplate(e.target.value);
              setPesanTemplate(null);
            }}
            className="min-h-10 rounded-md border border-garis-input bg-white px-3 text-sm text-tinta focus:border-emas-muda focus:outline-none"
          >
            {daftarTemplate.length > 0 ? (
              daftarTemplate.map((t) => (
                <option key={t.id || t.name} value={t.name}>
                  {t.name} [{t.status}] {t.category ? `· ${t.category}` : ""}
                </option>
              ))
            ) : (
              <option value={selectedTemplate}>{selectedTemplate} (Default Platform)</option>
            )}
          </select>

          {selectedTemplate !== templateName ? (
            <button
              type="button"
              disabled={isPending}
              onClick={handleSimpanPilihanTemplate}
              className={`${tombolEmas} min-h-10 px-4 text-xs font-semibold`}
            >
              Gunakan Template Ini
            </button>
          ) : (
            <span className="text-xs font-semibold text-hijau">✓ Template aktif untuk acara ini</span>
          )}
        </div>

        {pesanTemplate ? (
          <p className="m-0 text-xs font-medium text-hijau" role="status">
            {pesanTemplate}
          </p>
        ) : null}

        {/* Pratinjau Tampilan Template Terpilih */}
        <details className="mt-1 text-xs">
          <summary className="cursor-pointer font-medium text-emas hover:underline">
            Lihat Pratinjau Pesan Template &quot;{selectedTemplate}&quot;
          </summary>
          <div className="mt-2.5 rounded-lg border border-garis bg-[#EFEAE2] p-3">
            <div className="max-w-md overflow-hidden rounded-lg bg-white p-3 text-xs text-[#111B21] shadow-xs">
              {preview.isImageHeader ? (
                <div className="mb-2 -mx-3 -mt-3 flex aspect-[16/9] items-center justify-center bg-stone-200 text-stone-500">
                  <div className="flex flex-col items-center gap-1">
                    <Ikon nama="gambar" ukuran={20} />
                    <span className="text-[10px] font-medium">Header Poster / Cover Acara</span>
                  </div>
                </div>
              ) : null}
              {preview.header ? (
                <div className="mb-1 font-bold text-gray-800">{preview.header}</div>
              ) : null}
              <div className="leading-relaxed">{preview.body}</div>
              {preview.footer ? (
                <div className="mt-1.5 text-[10px] text-gray-400">{preview.footer}</div>
              ) : null}
            </div>
            <p className="mt-2 mb-0 text-[11px] text-stone-600">
              <em>Format resmi LIM-RSVP:</em> 1 Header Gambar poster/cover, 1 variabel gabungan tanpa line break, tanpa tombol.
            </p>
          </div>
        </details>
      </div>

      {kuota <= 0 ? (
        <div className="rounded-lg border border-merah/20 bg-merah-bg p-3.5 text-xs text-merah">
          <strong>Kredit pesan WABA Anda telah habis.</strong> Silakan hubungi Super Admin untuk penambahan kredit kuota pesan resmi.
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-emas/20 bg-emas/5 p-3.5 text-xs text-tinta-2">
          <div>
            Template kirim: <code className="rounded bg-white px-1.5 py-0.5 font-mono text-[11px] font-semibold text-emas-tua">{selectedTemplate}</code>
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
              disabled={isPending || !gatewayAktif}
              className={`${tombolEmas} min-h-9 px-4 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50`}
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

      {/* Modal Panduan Pengajuan Template WhatsApp */}
      <ModalAjukanTemplate
        terbuka={bukaModalAjukan}
        onTutup={() => setBukaModalAjukan(false)}
        onBerhasil={(templateBaru) => {
          setSelectedTemplate(templateBaru.name);
          setPesanTemplate(`Template "${templateBaru.name}" berhasil diajukan ke Meta (status: ${templateBaru.status}).`);
          router.refresh();
        }}
        submitAction={ajukanTemplateAction}
      />
    </section>
  );
}
