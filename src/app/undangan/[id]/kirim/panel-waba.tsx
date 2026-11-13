"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Ikon } from "@/components/ikon";
import { kartu, kolom, tombolEmas, tombolTerang } from "@/components/ui";
import { useInvitationAction } from "@/components/invitation-context";
import type { WabaTemplateConfig } from "@/lib/invitations/content";
import type { WabaTemplateItem } from "@/lib/waba/client";
import {
  WABA_APP_VARIABLES,
  defaultWabaVariableMappings,
  extractWabaVariableIndices,
  renderTemplatePreview,
  type TemplateVariableContext,
} from "@/lib/waba/templates-guide";
import { ModalAjukanTemplate } from "@/components/waba/modal-ajukan-template";
import {
  ajukanTemplateWabaAction,
  kirimBatchWabaAction,
  simpanPilihanTemplateWabaAction,
} from "./actions";

function detectTemplateHasButton(item?: WabaTemplateItem, saved?: WabaTemplateConfig): boolean {
  if (item?.buttons && item.buttons.length > 0) {
    return item.buttons.some((b) => b.type.toUpperCase() === "URL");
  }
  if (saved?.hasButton !== undefined) return saved.hasButton;
  return Boolean(item?.name && item.name.includes("tombol"));
}

function buildInitialVariables(
  bodyText: string,
  saved?: WabaTemplateConfig,
): Record<string, string> {
  const indices = extractWabaVariableIndices(bodyText);
  const maxIdx = indices.length > 0 ? indices[indices.length - 1] : 0;
  const defaults = defaultWabaVariableMappings(maxIdx);
  const merged: Record<string, string> = {};
  for (const idx of indices) {
    const key = String(idx);
    const savedVal = saved?.variables?.[key];
    merged[key] = savedVal !== undefined ? savedVal : (defaults[key] ?? "");
  }
  return merged;
}

export function PanelWaba({
  tersedia,
  pemilik,
  gatewayAktif = false,
  kuota,
  terkirim,
  templateName,
  savedConfig,
  tamuBelumTerkirim,
  daftarTemplate = [],
  sampleContext,
  appUrl,
}: {
  tersedia: boolean;
  pemilik: boolean;
  gatewayAktif?: boolean;
  kuota: number;
  terkirim: number;
  templateName: string;
  savedConfig?: WabaTemplateConfig;
  tamuBelumTerkirim: number;
  daftarTemplate?: WabaTemplateItem[];
  sampleContext: TemplateVariableContext;
  appUrl?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedTemplate, setSelectedTemplate] = useState<string>(templateName);

  const initialItem = daftarTemplate.find((t) => t.name === templateName);
  const initialBody = initialItem?.bodyText || savedConfig?.bodyText || "{{1}}";
  const [variables, setVariables] = useState<Record<string, string>>(() =>
    buildInitialVariables(initialBody, savedConfig),
  );
  const [hasButton, setHasButton] = useState<boolean>(() =>
    detectTemplateHasButton(initialItem, savedConfig),
  );
  const [activeVarKey, setActiveVarKey] = useState<string>("1");
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const [bukaModalAjukan, setBukaModalAjukan] = useState(false);
  const [pesanTemplate, setPesanTemplate] = useState<string | null>(null);
  const [hasil, setHasil] = useState<{ pesan?: string; galat?: string } | null>(null);

  const kirimBatchAction = useInvitationAction(kirimBatchWabaAction);
  const simpanPilihanAction = useInvitationAction(simpanPilihanTemplateWabaAction);
  const ajukanTemplateAction = useInvitationAction(ajukanTemplateWabaAction);

  if (!tersedia) return null;

  const currentTemplateItem = daftarTemplate.find((t) => t.name === selectedTemplate);
  const activeBodyText =
    currentTemplateItem?.bodyText ||
    (selectedTemplate === templateName ? savedConfig?.bodyText : undefined) ||
    "{{1}}";
  const activeHeaderFormat =
    currentTemplateItem?.headerFormat ||
    (selectedTemplate === templateName ? savedConfig?.headerFormat : undefined) ||
    "IMAGE";
  const variableIndices = extractWabaVariableIndices(activeBodyText);

  const handleSelectTemplate = (nextName: string) => {
    setSelectedTemplate(nextName);
    setPesanTemplate(null);
    const nextItem = daftarTemplate.find((t) => t.name === nextName);
    const nextBody = nextItem?.bodyText || (nextName === templateName ? savedConfig?.bodyText : undefined) || "{{1}}";
    setVariables(buildInitialVariables(nextBody, nextName === templateName ? savedConfig : undefined));
    setHasButton(detectTemplateHasButton(nextItem, nextName === templateName ? savedConfig : undefined));
    const firstIdx = extractWabaVariableIndices(nextBody)[0];
    setActiveVarKey(firstIdx ? String(firstIdx) : "1");
  };

  const insertAppVariable = (varKey: string) => {
    const targetKey = variableIndices.map(String).includes(activeVarKey)
      ? activeVarKey
      : String(variableIndices[0] ?? 1);
    const tag = `{${varKey}}`;
    const el = inputRefs.current[targetKey];
    const currentVal = variables[targetKey] ?? "";

    if (!el) {
      setVariables((prev) => ({ ...prev, [targetKey]: `${currentVal}${tag}` }));
      return;
    }

    const start = el.selectionStart ?? currentVal.length;
    const end = el.selectionEnd ?? currentVal.length;
    const nextVal = `${currentVal.slice(0, start)}${tag}${currentVal.slice(end)}`;
    setVariables((prev) => ({ ...prev, [targetKey]: nextVal }));
    setPesanTemplate(null);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + tag.length, start + tag.length);
    });
  };

  const handleSimpanPengaturan = () => {
    setPesanTemplate(null);
    setHasil(null);
    startTransition(async () => {
      try {
        const res = await simpanPilihanAction(selectedTemplate, {
          variables,
          hasButton,
          bodyText: activeBodyText,
          headerFormat: activeHeaderFormat,
        });
        if (res.ok) {
          setPesanTemplate("Template dan pengaturan variabel WABA berhasil disimpan untuk seluruh tim.");
          router.refresh();
        } else {
          setHasil({ galat: res.error || "Gagal menyimpan pengaturan template." });
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
    const templateLabel = pemilik ? selectedTemplate : templateName;
    const konfirmasi = confirm(
      `Kirim undangan ke tamu yang belum terkirim via WhatsApp Business API Resmi menggunakan template "${templateLabel}"? Maksimal ${Math.min(
        kuota,
        tamuBelumTerkirim,
      )} pesan akan dikirim dan memotong kredit akun.`,
    );
    if (!konfirmasi) return;

    setHasil(null);
    startTransition(async () => {
      try {
        const res = await kirimBatchAction(pemilik ? selectedTemplate : undefined);
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

  const previewContext: TemplateVariableContext = {
    ...sampleContext,
    variableMappings: pemilik ? variables : savedConfig?.variables,
  };
  const preview = renderTemplatePreview(
    activeBodyText,
    previewContext,
    activeHeaderFormat === "TEXT" ? "Undangan Resmi" : undefined,
    currentTemplateItem?.footerText || "LIM-RSVP · Lingkar Ide Manajemen",
    activeHeaderFormat,
    (pemilik ? hasButton : savedConfig?.hasButton) ? "Buka Undangan" : undefined,
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
            {pemilik
              ? "Kirim undangan langsung melalui cloud server WhatsApp resmi tanpa risiko blokir nomor dan tanpa perlu scan QR."
              : "Kirim undangan ke tamu Anda via WhatsApp resmi menggunakan template yang sudah diatur oleh pemilik undangan."}
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
          <strong className="font-semibold">Gateway WABA Sistem Belum Diaktifkan.</strong> Akun telah diberi izin resmi WABA Meta, namun koneksi Gateway WABA di sistem saat ini berstatus <em>Nonaktif</em>. Hubungi Super Admin untuk mengaktifkan saklar WABA di menu <strong>Admin &gt; WhatsApp</strong>.
        </div>
      ) : null}

      {pemilik ? (
        <div className="flex flex-col gap-4 rounded-lg border border-garis bg-kertas/60 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="m-0 text-sm font-semibold text-tinta">Pengaturan Template &amp; Isi Variabel WABA</h3>
              <p className="mt-0.5 mb-0 text-xs text-redup">
                Pengaturan ini berlaku untuk Anda dan seluruh anggota tim saat mengirim pesan WABA resmi.
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
              onChange={(e) => handleSelectTemplate(e.target.value)}
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

            {selectedTemplate === templateName ? (
              <span className="text-xs font-semibold text-hijau">✓ Template aktif untuk acara ini</span>
            ) : null}
          </div>

          {variableIndices.length > 0 ? (
            <div className="flex flex-col gap-3 rounded-lg border border-garis bg-white p-3.5">
              <div>
                <h4 className="m-0 text-xs font-semibold uppercase tracking-wider text-redup">
                  Isi Variabel Pesan ({variableIndices.map((i) => `{{${i}}}`).join(", ")})
                </h4>
                <p className="mt-0.5 mb-0 text-xs text-redup">
                  Setiap variabel bisa diisi variabel aplikasi (klik tombol sisipkan di bawah) maupun teks tambahan manual.
                  {variableIndices.length === 1 ? " Kosongkan bila ingin memakai isi Pesan WhatsApp standar." : ""}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {variableIndices.map((idx) => {
                  const key = String(idx);
                  return (
                    <label key={key} className="flex flex-col gap-1 text-xs font-medium text-tinta">
                      <span>Variabel {`{{${key}}}`}</span>
                      <input
                        ref={(el) => {
                          inputRefs.current[key] = el;
                        }}
                        type="text"
                        value={variables[key] ?? ""}
                        onFocus={() => setActiveVarKey(key)}
                        onChange={(e) => {
                          setVariables((prev) => ({ ...prev, [key]: e.target.value }));
                          setPesanTemplate(null);
                        }}
                        placeholder={
                          variableIndices.length === 1
                            ? "Kosongkan untuk pakai pesan WhatsApp standar"
                            : `Isi untuk {{${key}}}...`
                        }
                        className={`${kolom} min-h-9 text-xs`}
                      />
                    </label>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <span className="mr-1 text-[11px] font-medium text-redup">Sisipkan ke {`{{${activeVarKey}}}`}:</span>
                {WABA_APP_VARIABLES.map((v) => (
                  <button
                    key={v.key}
                    type="button"
                    onClick={() => insertAppVariable(v.key)}
                    className="inline-flex min-h-7 cursor-pointer items-center rounded-full border border-garis-input bg-kertas px-2.5 text-[11px] font-medium text-tinta-2 hover:bg-white"
                  >
                    + {v.label}
                  </button>
                ))}
              </div>

              <label className="flex items-center gap-2 text-xs text-tinta">
                <input
                  type="checkbox"
                  checked={hasButton}
                  onChange={(e) => {
                    setHasButton(e.target.checked);
                    setPesanTemplate(null);
                  }}
                  className="h-4 w-4 accent-emas"
                />
                <span>Template ini memiliki tombol URL link undangan pribadi (otomatis diisi token tamu)</span>
              </label>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={isPending}
              onClick={handleSimpanPengaturan}
              className={`${tombolEmas} min-h-10 px-4 text-xs font-semibold`}
            >
              {isPending ? "Menyimpan..." : "Simpan Pengaturan WABA"}
            </button>
            {pesanTemplate ? (
              <p className="m-0 text-xs font-medium text-hijau" role="status">
                {pesanTemplate}
              </p>
            ) : null}
          </div>

          <details className="text-xs" open={variableIndices.length > 1}>
            <summary className="cursor-pointer font-medium text-emas hover:underline">
              Pratinjau Pesan Template &quot;{selectedTemplate}&quot;
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
                <div className="leading-relaxed whitespace-pre-line">{preview.body}</div>
                {preview.footer ? (
                  <div className="mt-1.5 text-[10px] text-gray-400">{preview.footer}</div>
                ) : null}
              </div>
              {preview.buttonText ? (
                <div className="mt-1.5 max-w-md">
                  <div className="flex items-center justify-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-medium text-[#00A884] shadow-xs">
                    <Ikon nama="tautan" ukuran={14} />
                    <span>{preview.buttonText}</span>
                  </div>
                </div>
              ) : null}
            </div>
          </details>
        </div>
      ) : (
        <details className="rounded-lg border border-garis bg-kertas/60 p-3.5 text-xs">
          <summary className="cursor-pointer font-medium text-tinta hover:text-emas">
            Template aktif dari pemilik: <code className="rounded bg-white px-1.5 py-0.5 font-mono text-[11px] font-semibold text-emas-tua">{templateName}</code> (lihat pratinjau)
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
              <div className="leading-relaxed whitespace-pre-line">{preview.body}</div>
              {preview.footer ? (
                <div className="mt-1.5 text-[10px] text-gray-400">{preview.footer}</div>
              ) : null}
            </div>
            {preview.buttonText ? (
              <div className="mt-1.5 max-w-md">
                <div className="flex items-center justify-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-medium text-[#00A884] shadow-xs">
                  <Ikon nama="tautan" ukuran={14} />
                  <span>{preview.buttonText}</span>
                </div>
              </div>
            ) : null}
          </div>
        </details>
      )}

      {kuota <= 0 ? (
        <div className="rounded-lg border border-merah/20 bg-merah-bg p-3.5 text-xs text-merah">
          <strong>Kredit pesan WABA Anda telah habis.</strong> Silakan hubungi Super Admin untuk penambahan kredit kuota pesan resmi.
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-emas/20 bg-emas/5 p-3.5 text-xs text-tinta-2">
          <div>
            Template kirim: <code className="rounded bg-white px-1.5 py-0.5 font-mono text-[11px] font-semibold text-emas-tua">{pemilik ? selectedTemplate : templateName}</code>
            {tamuBelumTerkirim > 0 ? (
              <span className="ml-2 text-redup">· Ada {tamuBelumTerkirim} tamu belum terkirim</span>
            ) : (
              <span className="ml-2 font-medium text-hijau">· Semua tamu sudah terkirim</span>
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

      {pemilik ? (
        <ModalAjukanTemplate
          terbuka={bukaModalAjukan}
          onTutup={() => setBukaModalAjukan(false)}
          appUrl={appUrl}
          onBerhasil={(templateBaru) => {
            handleSelectTemplate(templateBaru.name);
            setPesanTemplate(`Template "${templateBaru.name}" berhasil diajukan ke Meta (status: ${templateBaru.status}).`);
            router.refresh();
          }}
          submitAction={ajukanTemplateAction}
        />
      ) : null}
    </section>
  );
}
