"use client";

import { useActionState, useState } from "react";
import { Ikon } from "@/components/ikon";
import { tombolGelap, tombolTerang } from "@/components/ui";
import type { WabaConfig } from "@/lib/waba/config";
import type { WabaTemplateItem } from "@/lib/waba/client";
import { simpanWabaAction, ujiWabaAction } from "./actions";

export function FormWaba({ config }: { config: WabaConfig }) {
  const [saveState, saveAction, isSaving] = useActionState(simpanWabaAction, null);
  const [testState, testAction, isTesting] = useActionState(ujiWabaAction, null);
  const [selectedTemplate, setSelectedTemplate] = useState(config.defaultTemplate);

  const templates: WabaTemplateItem[] = testState?.ok && testState.templates ? testState.templates : [];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-garis bg-kertas p-4">
        <div className="flex flex-col">
          <span className="text-sm font-medium">Status Gateway Resmi</span>
          <span className="text-xs text-redup">
            {config.aktif ? "Layanan aktif dan dapat digunakan oleh akun yang memiliki kredit WABA." : "Layanan WABA sedang dimatikan (hanya menggunakan Baileys)."}
          </span>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            config.aktif ? "bg-hijau-bg text-hijau" : "bg-krem-2 text-redup"
          }`}
        >
          {config.aktif ? "Aktif" : "Nonaktif"}
        </span>
      </div>

      <form action={saveAction} className="flex flex-col gap-4">
        <label className="flex items-center gap-3 text-sm font-medium">
          <input
            type="checkbox"
            name="aktif"
            defaultChecked={config.aktif}
            value="1"
            className="size-4.5 accent-emas"
          />
          Aktifkan Pengiriman via WABA Gateway Resmi
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-[13px] font-medium text-redup-2 sm:col-span-2">
            Base URL WABA (Aplikasi Induk)
            <input
              type="url"
              name="baseUrl"
              defaultValue={config.baseUrl}
              placeholder="https://event.lingkaridemanajemen.id"
              required
              className="min-h-11 rounded-md border border-garis-input bg-white px-3 text-sm text-tinta focus:border-emas-muda focus:ring-3 focus:ring-emas-muda/20 focus:outline-none"
            />
            <span className="text-xs text-redup">
              URL server utama Portal Notifikasi WhatsApp Lingkar Ide Manajemen.
            </span>
          </label>

          <label className="flex flex-col gap-1 text-[13px] font-medium text-redup-2 sm:col-span-2">
            WABA API Key
            <input
              type="password"
              name="apiKey"
              defaultValue={config.apiKey}
              placeholder="lim_waba_xxxxxxxxxxxxxxxxxxxxxxxx"
              className="min-h-11 rounded-md border border-garis-input bg-white px-3 font-mono text-sm text-tinta focus:border-emas-muda focus:ring-3 focus:ring-emas-muda/20 focus:outline-none"
            />
            <span className="text-xs text-redup">
              Kunci API khusus aplikasi anak dari Dashboard Admin Induk (diawali lim_waba_...).
            </span>
          </label>

          <label className="flex flex-col gap-1 text-[13px] font-medium text-redup-2">
            Default Template WhatsApp
            <div className="flex gap-2">
              <input
                type="text"
                name="defaultTemplate"
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
                placeholder="undangan_resmi"
                required
                className="min-h-11 flex-1 rounded-md border border-garis-input bg-white px-3 font-mono text-sm text-tinta focus:border-emas-muda focus:ring-3 focus:ring-emas-muda/20 focus:outline-none"
              />
            </div>
            <span className="text-xs text-redup">
              Nama template yang sudah berstatus APPROVED di Meta WhatsApp Cloud API.
            </span>
          </label>

          <label className="flex flex-col gap-1 text-[13px] font-medium text-redup-2">
            Kode Bahasa
            <input
              type="text"
              name="language"
              defaultValue={config.language || "id"}
              placeholder="id"
              className="min-h-11 rounded-md border border-garis-input bg-white px-3 text-sm text-tinta focus:border-emas-muda focus:ring-3 focus:ring-emas-muda/20 focus:outline-none"
            />
            <span className="text-xs text-redup">Kode bahasa ISO Meta (default: id).</span>
          </label>
        </div>

        {saveState && !saveState.ok && saveState.formError ? (
          <p role="alert" className="m-0 rounded-md bg-galat-bg p-3 text-xs font-medium text-galat">
            {saveState.formError}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={isSaving}
              className={`${tombolGelap} disabled:opacity-50`}
            >
              {isSaving ? "Menyimpan..." : "Simpan Pengaturan WABA"}
            </button>
            {saveState?.ok ? (
              <span className="text-xs font-medium text-hijau" role="status">
                Pengaturan tersimpan
              </span>
            ) : null}
          </div>
        </div>
      </form>

      <div className="flex flex-col gap-3 rounded-lg border border-garis bg-krem/40 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="m-0 text-sm font-semibold text-tinta">Uji Koneksi & Katalog Template Meta</h3>
            <p className="mt-0.5 mb-0 text-xs text-redup">
              Periksa status autentikasi ke Aplikasi Induk dan tampilkan daftar template yang siap digunakan.
            </p>
          </div>
          <form action={testAction}>
            <button
              type="submit"
              disabled={isTesting || !config.apiKey}
              className={`${tombolTerang} text-xs disabled:opacity-50`}
            >
              {isTesting ? "Memeriksa..." : "Uji Koneksi & Muat Template"}
            </button>
          </form>
        </div>

        {testState ? (
          testState.ok ? (
            <div className="flex flex-col gap-2 rounded-md bg-white p-3 text-xs">
              <span className="font-semibold text-hijau flex items-center gap-1.5">
                <Ikon nama="ceklis" ukuran={14} tebal={2.5} />
                Koneksi berhasil! Ditemukan {templates.length} template di Meta Cloud API.
              </span>
              {templates.length > 0 ? (
                <div className="mt-2 flex flex-col gap-2 max-h-60 overflow-y-auto">
                  {templates.map((t) => (
                    <div
                      key={t.id || t.name}
                      onClick={() => setSelectedTemplate(t.name)}
                      className={`cursor-pointer flex items-center justify-between gap-2 rounded border p-2 hover:bg-kertas transition-colors ${
                        selectedTemplate === t.name ? "border-emas bg-krem" : "border-garis"
                      }`}
                    >
                      <div className="flex flex-col min-w-0">
                        <span className="font-mono font-medium text-tinta truncate">{t.name}</span>
                        <span className="text-[11px] text-redup truncate">{t.category} · {t.language}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                            t.status === "APPROVED"
                              ? "bg-hijau-bg text-hijau"
                              : t.status === "REJECTED"
                              ? "bg-galat-bg text-galat"
                              : "bg-jingga-bg text-jingga"
                          }`}
                        >
                          {t.status}
                        </span>
                        {selectedTemplate === t.name ? (
                          <span className="text-[11px] font-bold text-emas-tua">Terpilih</span>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="m-0 text-redup">Belum ada template yang terdaftar di akun WABA Anda.</p>
              )}
            </div>
          ) : (
            <p role="alert" className="m-0 rounded-md bg-galat-bg p-3 text-xs text-galat">
              {testState.error}
            </p>
          )
        ) : null}
      </div>
    </div>
  );
}
