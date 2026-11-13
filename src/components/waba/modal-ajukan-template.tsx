"use client";

import { useState, useTransition } from "react";
import { Ikon } from "@/components/ikon";
import { kolom, labelKolom, pesanGalat, tombolEmas, tombolTerang } from "@/components/ui";
import type { CreateWabaTemplatePayload, WabaTemplateItem } from "@/lib/waba/client";
import {
  WABA_TEMPLATE_PRESETS,
  renderTemplatePreview,
  validateTemplateName,
  type TemplateVariableContext,
} from "@/lib/waba/templates-guide";

const CONTOH_KONTEKS: TemplateVariableContext = {
  guestName: "Bapak Hendra Wijaya",
  eventTitle: "The Wedding of Sarah & Dimas",
  deadlinePhrase: "paling lambat 20 November 2026",
  link: "https://event.lingkaridemanajemen.id/tamu-sarah-dimas",
  token: "tamu-sarah-dimas",
};

export function ModalAjukanTemplate({
  terbuka,
  onTutup,
  onBerhasil,
  submitAction,
}: {
  terbuka: boolean;
  onTutup: () => void;
  onBerhasil: (template: WabaTemplateItem) => void;
  submitAction: (payload: CreateWabaTemplatePayload) => Promise<{ ok: boolean; data?: WabaTemplateItem; error?: string }>;
}) {
  const [selectedPresetId, setSelectedPresetId] = useState<string>("undangan_resmi");
  const [name, setName] = useState<string>("lim_undangan_resmi");
  const [category, setCategory] = useState<"UTILITY" | "MARKETING">("UTILITY");
  const [headerFormat, setHeaderFormat] = useState<"NONE" | "TEXT" | "IMAGE">("IMAGE");
  const [headerContent, setHeaderContent] = useState<string>("");
  const [bodyText, setBodyText] = useState<string>("{{1}}");
  const [footerText, setFooterText] = useState<string>("LIM-RSVP · Lingkar Ide Manajemen");
  const [sertakanTombol, setSertakanTombol] = useState<boolean>(false);
  const [buttonText, setButtonText] = useState<string>("Buka Undangan");
  const [buttonUrl, setButtonUrl] = useState<string>("https://event.lingkaridemanajemen.id/{{1}}");

  const [isPending, startTransition] = useTransition();
  const [galat, setGalat] = useState<string | null>(null);

  if (!terbuka) return null;

  const handlePilihPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    const preset = WABA_TEMPLATE_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    setName(preset.payload.name);
    setCategory(preset.payload.category === "MARKETING" ? "MARKETING" : "UTILITY");
    setHeaderFormat(
      preset.payload.headerFormat === "TEXT"
        ? "TEXT"
        : preset.payload.headerFormat === "NONE"
        ? "NONE"
        : "IMAGE",
    );
    setHeaderContent(preset.payload.headerContent || "");
    setBodyText(preset.payload.bodyText);
    setFooterText(preset.payload.footerText || "");
    if (preset.payload.buttons && preset.payload.buttons.length > 0) {
      setSertakanTombol(true);
      setButtonText(preset.payload.buttons[0].text);
      setButtonUrl(preset.payload.buttons[0].url || "https://event.lingkaridemanajemen.id/{{1}}");
    } else {
      setSertakanTombol(false);
    }
  };

  const preview = renderTemplatePreview(
    bodyText,
    CONTOH_KONTEKS,
    headerFormat === "TEXT" ? headerContent : undefined,
    footerText,
    headerFormat,
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setGalat(null);

    const validName = validateTemplateName(name);
    if (!validName.ok) {
      setGalat(validName.error);
      return;
    }

    if (!bodyText.trim()) {
      setGalat("Teks isi template tidak boleh kosong.");
      return;
    }

    const payload: CreateWabaTemplatePayload = {
      name: validName.name,
      category,
      language: "id",
      headerFormat,
      headerContent: headerFormat === "TEXT" ? headerContent.trim() : undefined,
      bodyText: bodyText.trim(),
      footerText: footerText.trim() ? footerText.trim().slice(0, 60) : undefined,
      buttons:
        sertakanTombol && buttonText.trim()
          ? [
              {
                type: "URL",
                text: buttonText.trim(),
                url: buttonUrl.trim() || "https://event.lingkaridemanajemen.id/{{1}}",
                example: ["demo-token"],
              },
            ]
          : undefined,
    };

    startTransition(async () => {
      try {
        const res = await submitAction(payload);
        if (res.ok && res.data) {
          onBerhasil(res.data);
          onTutup();
        } else {
          setGalat(res.error || "Gagal mengajukan template ke Meta.");
        }
      } catch (err) {
        setGalat(err instanceof Error ? err.message : "Terjadi kesalahan saat pengajuan.");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-garis px-6 py-4">
          <div className="flex items-center gap-2">
            <h2 className="m-0 font-judul text-xl font-medium text-tinta">
              Panduan Pengajuan Template WhatsApp (Meta WABA)
            </h2>
            <span className="rounded-full bg-hijau-bg px-2.5 py-0.5 text-xs font-semibold text-hijau">
              Resmi Meta
            </span>
          </div>
          <button
            type="button"
            onClick={onTutup}
            className="rounded-md p-1.5 text-redup hover:bg-kertas hover:text-tinta"
            aria-label="Tutup"
          >
            <Ikon nama="tutup" ukuran={20} />
          </button>
        </div>

        {/* Content Modal Grid */}
        <div className="grid flex-1 overflow-y-auto p-6 md:grid-cols-12 md:gap-6">
          {/* Form Kiri */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5 md:col-span-7">
            {/* Pilihan Preset Cepat */}
            <div>
              <span className="block text-xs font-semibold uppercase tracking-wider text-redup">
                1. Pilih Preset Standar Rekomendasi
              </span>
              <p className="mt-0.5 mb-2 text-xs text-redup">
                Gunakan format yang telah diuji dan disetujui Meta untuk kategori undangan &amp; RSVP.
              </p>
              <div className="flex flex-col gap-2">
                {WABA_TEMPLATE_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handlePilihPreset(p.id)}
                    className={`flex flex-col rounded-lg border p-3 text-left transition-colors ${
                      selectedPresetId === p.id
                        ? "border-emas bg-emas/5 ring-1 ring-emas"
                        : "border-garis bg-white hover:bg-kertas"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-tinta">{p.label}</span>
                      {selectedPresetId === p.id ? (
                        <span className="text-[11px] font-semibold text-emas-tua">Terpilih</span>
                      ) : null}
                    </div>
                    <span className="mt-1 text-[11px] text-redup leading-relaxed">{p.deskripsi}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Input Form Rincian */}
            <div className="flex flex-col gap-4 border-t border-garis pt-4">
              <span className="block text-xs font-semibold uppercase tracking-wider text-redup">
                2. Sesuaikan Rincian Template
              </span>

              <label className={labelKolom}>
                Nama Teknis Template (Meta Name)
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_"))}
                  placeholder="contoh: lim_undangan_pernikahan"
                  className={kolom}
                />
                <span className="text-[11px] text-redup">
                  Hanya boleh huruf kecil (a-z), angka (0-9), dan garis bawah (_).
                </span>
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className={labelKolom}>
                  Kategori Meta
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as "UTILITY" | "MARKETING")}
                    className={kolom}
                  >
                    <option value="UTILITY">UTILITY (Undangan &amp; RSVP)</option>
                    <option value="MARKETING">MARKETING (Promosi Acara)</option>
                  </select>
                </label>

                <label className={labelKolom}>
                  Format Header
                  <select
                    value={headerFormat}
                    onChange={(e) => setHeaderFormat(e.target.value as "NONE" | "TEXT" | "IMAGE")}
                    className={kolom}
                  >
                    <option value="IMAGE">Gambar Poster / Sampul (Standar LIM-RSVP)</option>
                    <option value="TEXT">Teks Judul</option>
                    <option value="NONE">Tanpa Header</option>
                  </select>
                </label>
              </div>

              {headerFormat === "IMAGE" ? (
                <div className="rounded-md border border-emas/30 bg-emas/5 p-3 text-xs leading-relaxed text-tinta-2">
                  <strong className="font-semibold text-emas-tua">Header Gambar Otomatis:</strong> Foto sampul atau poster undangan yang diunggah di aplikasi LIM-RSVP akan dikirimkan otomatis sebagai header gambar pesan WhatsApp (sesuai pengiriman Baileys).
                </div>
              ) : null}

              {headerFormat === "TEXT" ? (
                <label className={labelKolom}>
                  Teks Judul Header
                  <input
                    type="text"
                    value={headerContent}
                    onChange={(e) => setHeaderContent(e.target.value)}
                    placeholder="Undangan Resmi"
                    maxLength={60}
                    className={kolom}
                  />
                </label>
              ) : null}

              <label className={labelKolom}>
                <div className="flex items-center justify-between">
                  <span>Isi Pesan Utama (Body Text)</span>
                  <span className="text-[11px] text-redup">{bodyText.length} karakter</span>
                </div>
                <textarea
                  rows={4}
                  required
                  value={bodyText}
                  onChange={(e) => setBodyText(e.target.value)}
                  className="w-full rounded-md border border-garis-input bg-white p-3 font-mono text-xs leading-relaxed text-tinta focus:border-emas-muda focus:outline-none focus:ring-3 focus:ring-emas-muda/20"
                />
                <div className="rounded-md bg-krem/50 p-2.5 text-[11px] leading-relaxed text-redup-2">
                  <strong className="font-semibold text-tinta">Ketentuan Variabel LIM-RSVP:</strong>
                  <p className="mt-1 mb-0">
                    Gunakan 1 variabel <code className="font-bold text-emas-tua">{"{{1}}"}</code>. Aplikasi LIM-RSVP akan otomatis mengolah dan menggabungkan konten undangan yang Anda susun di halaman pengiriman (nama tamu, nama event, batas RSVP, dan link undangan) menjadi 1 variabel teks tanpa <em>line break</em> sesuai regulasi Meta.
                  </p>
                </div>
              </label>

              <label className={labelKolom}>
                Catatan Kaki (Footer)
                <input
                  type="text"
                  value={footerText}
                  onChange={(e) => setFooterText(e.target.value)}
                  placeholder="LIM-RSVP · Lingkar Ide Manajemen"
                  maxLength={60}
                  className={kolom}
                />
              </label>

              {/* Opsi Tombol */}
              <div className="flex flex-col gap-2 rounded-lg border border-garis bg-kertas/50 p-3">
                <label className="flex items-center gap-2 text-xs font-semibold text-tinta cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sertakanTombol}
                    onChange={(e) => setSertakanTombol(e.target.checked)}
                    className="size-4 rounded border-garis-input text-emas focus:ring-emas"
                  />
                  <span>Sertakan Tombol URL (Opsional)</span>
                </label>
                <p className="m-0 text-[11px] text-redup">
                  Standar LIM-RSVP adalah <strong>tanpa tombol</strong> karena tautan pribadi sudah disertakan langsung di dalam konten pesan.
                </p>

                {sertakanTombol ? (
                  <div className="mt-2 grid grid-cols-2 gap-3">
                    <label className={labelKolom}>
                      Teks Tombol
                      <input
                        type="text"
                        value={buttonText}
                        onChange={(e) => setButtonText(e.target.value)}
                        placeholder="Buka Undangan"
                        maxLength={25}
                        className={kolom}
                      />
                    </label>

                    <label className={labelKolom}>
                      URL Tautan Tombol
                      <input
                        type="text"
                        value={buttonUrl}
                        onChange={(e) => setButtonUrl(e.target.value)}
                        placeholder="https://event.lingkaridemanajemen.id/{{1}}"
                        className={kolom}
                      />
                    </label>
                  </div>
                ) : null}
              </div>
            </div>

            {galat ? (
              <p role="alert" className={pesanGalat}>
                {galat}
              </p>
            ) : null}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button type="button" onClick={onTutup} className={tombolTerang}>
                Batal
              </button>
              <button
                type="submit"
                disabled={isPending}
                className={`${tombolEmas} font-semibold disabled:opacity-50`}
              >
                {isPending ? "Mengajukan ke Meta..." : "Kirim Pengajuan ke Meta"}
              </button>
            </div>
          </form>

          {/* Preview WhatsApp Kanan */}
          <div className="mt-6 flex flex-col md:col-span-5 md:mt-0">
            <span className="block text-xs font-semibold uppercase tracking-wider text-redup">
              Simulasi Pratinjau WhatsApp
            </span>
            <p className="mt-0.5 mb-3 text-xs text-redup">
              Tampilan pesan saat diterima di HP tamu dengan data acara asli:
            </p>

            <div className="flex flex-1 flex-col rounded-xl border border-garis bg-[#EFEAE2] p-4 shadow-inner">
              {/* Balon Chat WA */}
              <div className="relative max-w-[95%] self-start overflow-hidden rounded-lg bg-white p-3.5 text-xs text-[#111B21] shadow-sm">
                {preview.isImageHeader ? (
                  <div className="mb-2.5 -mx-3.5 -mt-3.5 flex aspect-[16/9] items-center justify-center bg-stone-200 text-stone-500">
                    <div className="flex flex-col items-center gap-1">
                      <Ikon nama="gambar" ukuran={24} />
                      <span className="text-[10px] font-medium">Header Poster / Cover Acara</span>
                    </div>
                  </div>
                ) : null}

                {preview.header ? (
                  <div className="mb-2 border-b border-gray-100 pb-1.5 font-bold text-gray-800">
                    {preview.header}
                  </div>
                ) : null}

                <div className="leading-relaxed">{preview.body}</div>

                {preview.footer ? (
                  <div className="mt-2 text-[10px] text-gray-400">{preview.footer}</div>
                ) : null}

                <div className="mt-1 flex justify-end text-[9px] text-gray-400">
                  <span>08:45</span>
                </div>
              </div>

              {sertakanTombol && buttonText.trim() ? (
                <div className="mt-2 max-w-[95%]">
                  <div className="flex items-center justify-center gap-1.5 rounded-lg bg-white py-2 px-3 text-xs font-medium text-[#00A884] shadow-sm">
                    <Ikon nama="tautan" ukuran={14} />
                    <span>{buttonText}</span>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
