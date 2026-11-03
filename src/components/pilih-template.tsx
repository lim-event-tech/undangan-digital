"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { PilihanTemplate } from "@/templates/registry";

type Props = {
  templates: PilihanTemplate[];
  awal: string;
  aktif: string | null;
  aksi?: (formData: FormData) => void | Promise<void>;
};

const tombol =
  "inline-flex min-h-11.5 items-center justify-center gap-2 rounded-md border px-5 text-sm font-medium tracking-[0.06em] whitespace-nowrap no-underline transition-colors focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-emas-muda";
const tombolPutih = `${tombol} border-[#CDBF9F] bg-white text-tinta hover:border-emas-muda hover:bg-[#FBF8F1] hover:text-tinta`;
const tombolTinta = `${tombol} border-tinta bg-tinta text-kertas hover:border-tinta-2 hover:bg-tinta-2 hover:text-kertas disabled:cursor-not-allowed disabled:opacity-50`;

function IkonPanah() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

function TombolPakai({
  pilihan,
  aktif,
  aksi,
  label,
  className,
}: {
  pilihan: PilihanTemplate;
  aktif: string | null;
  aksi?: Props["aksi"];
  label: string;
  className: string;
}) {
  if (!aksi) {
    return (
      <Link href={`/undangan/baru?template=${pilihan.key}`} className={className}>
        {label}
        <IkonPanah />
      </Link>
    );
  }
  const sama = pilihan.key === aktif;
  return (
    <form action={aksi}>
      <input type="hidden" name="template" value={pilihan.key} />
      <button type="submit" disabled={sama} className={className}>
        {sama ? "Template aktif" : label}
        {sama ? null : <IkonPanah />}
      </button>
    </form>
  );
}

export function PilihTemplate({ templates, awal, aktif, aksi }: Props) {
  const [pilih, setPilih] = useState(awal);
  const [mode, setMode] = useState<"hp" | "desktop">("hp");
  const pilihan = templates.find((t) => t.key === pilih) ?? templates[0];

  return (
    <div className="flex flex-col gap-5.5 pb-20 lg:pb-0">
      <div className="flex flex-col gap-2.5">
        <h1 className="m-0 font-judul text-[38px] leading-[1.08] font-semibold tracking-[-0.005em] text-tinta lining-nums md:text-[51px]">
          Pilih <span className="font-medium text-emas italic">template</span> undangan
        </h1>
        <p className="m-0 max-w-160 text-base leading-relaxed">
          Semua template memakai susunan bagian yang sama. Anda bisa ganti template kapan saja
          tanpa kehilangan isi yang sudah diisi.
        </p>
      </div>

      <div className="flex flex-wrap items-start gap-6.5">
        <div
          role="group"
          aria-label="Daftar template"
          className="grid min-w-0 flex-[1_1_520px] grid-cols-[repeat(auto-fit,minmax(min(150px,100%),1fr))] gap-4.5"
        >
          {templates.map((t) => {
            const dipilih = t.key === pilih;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setPilih(t.key)}
                aria-pressed={dipilih}
                className="relative flex cursor-pointer flex-col gap-2 rounded-[10px] border border-garis px-2 pt-2 pb-3 text-left text-tinta transition-[transform,box-shadow] duration-200 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-emas-muda"
                style={{
                  background: dipilih ? "#F3E9D2" : "#FFFFFF",
                  boxShadow: dipilih ? "0 18px 40px -22px rgba(42,38,34,.32)" : "none",
                  transform: dipilih ? "translateY(-4px)" : "none",
                }}
              >
                <span className="block h-47.5 overflow-hidden rounded-md border border-garis bg-[#F5EEDF]">
                  <Image
                    unoptimized
                    src={t.gambar.hp}
                    alt={`Tampilan template ${t.label}`}
                    width={780}
                    height={1688}
                    className="block size-full object-cover object-top"
                  />
                </span>
                <span className="font-judul text-[21px] leading-[1.08] font-semibold">{t.label}</span>
                <span className="-mt-1 text-xs text-redup">{t.ket}</span>
                {t.ribbon && !dipilih ? (
                  <span className="absolute -top-2.5 -left-2 rounded-sm border border-[#D9C9A6] bg-white px-3 py-1.25 text-[11px] leading-[1.3] font-medium tracking-[0.16em] text-tinta uppercase shadow-[0_8px_24px_-16px_rgba(42,38,34,.35)]">
                    {t.ribbon}
                  </span>
                ) : null}
                {dipilih ? (
                  <span className="absolute -top-2.5 -right-2 inline-flex items-center gap-1.5 rounded-sm border border-[#D9C9A6] bg-[#EFE4CC] px-3 py-1.25 text-[11px] leading-[1.3] font-medium tracking-[0.16em] text-tinta uppercase shadow-[0_8px_24px_-16px_rgba(42,38,34,.35)]">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M5 12.5l4.5 4.5L19 7" />
                    </svg>
                    Dipilih
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        <section
          aria-label="Pratinjau template"
          className="flex min-w-0 flex-[1_1_380px] flex-col gap-3.5 rounded-[10px] border border-garis bg-white p-4.5 shadow-[0_1px_2px_rgba(42,38,34,.04),0_12px_32px_-18px_rgba(42,38,34,.22)]"
        >
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <h2 className="m-0 font-judul text-[28px] leading-[1.08] font-semibold">Pratinjau: {pilihan.label}</h2>
            <div role="group" aria-label="Perangkat" className="flex gap-1.5 rounded-lg border border-garis bg-kertas p-1">
              {(["hp", "desktop"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  aria-pressed={mode === m}
                  className={`flex min-h-10 cursor-pointer items-center gap-1.5 rounded-lg px-3 text-[13px] font-medium text-[#4A433B] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emas-muda ${mode === m ? "bg-white shadow-sm" : "bg-transparent"}`}
                >
                  {m === "hp" ? "HP" : "Desktop"}
                </button>
              ))}
            </div>
          </div>
          <div className="flex min-h-117.5 items-center justify-center rounded-lg border border-dashed border-[#CDBF9F] bg-[#F5EEDF] p-4">
            {mode === "hp" ? (
              <div key={`hp-${pilihan.key}`} className="pt-muncul h-110 w-57.5 overflow-hidden rounded-[34px] border border-tinta bg-tinta p-2 shadow-[0_18px_40px_-22px_rgba(42,38,34,.32)]">
                <Image
                  unoptimized
                  src={pilihan.gambar.hp}
                  alt={`Tampilan HP template ${pilihan.label}`}
                  width={780}
                  height={1688}
                  className="block size-full rounded-[26px] object-cover object-top"
                />
              </div>
            ) : (
              <div key={`desk-${pilihan.key}`} className="pt-muncul flex w-full max-w-95 flex-col items-center">
                <div className="w-full overflow-hidden rounded-t-[14px] border border-tinta bg-tinta p-2 shadow-[0_18px_40px_-22px_rgba(42,38,34,.32)]">
                  <Image
                    unoptimized
                    src={pilihan.gambar.desktop}
                    alt={`Tampilan desktop template ${pilihan.label}`}
                    width={1280}
                    height={800}
                    className="block h-auto w-full"
                  />
                </div>
                <span className="h-4 w-30 border border-t-0 border-tinta bg-white" />
              </div>
            )}
          </div>
          <p className="m-0 text-[13px] text-redup">
            Di desktop, undangan tampil sebagai kolom selebar HP di tengah layar dengan latar tema di kiri dan kanan.
          </p>
          <div className="flex flex-wrap gap-2.5">
            <a href={`/pratinjau/${pilihan.key}`} target="_blank" rel="noopener noreferrer" className={tombolPutih}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              Buka contoh penuh
            </a>
            <div className="hidden md:block">
              <TombolPakai pilihan={pilihan} aktif={aktif} aksi={aksi} label={`Pakai ${pilihan.label}`} className={tombolTinta} />
            </div>
          </div>
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 flex items-center justify-between gap-2.5 border-t border-garis bg-kertas px-4 py-2.5 md:hidden">
        <span className="font-semibold">{pilihan.label}</span>
        <TombolPakai pilihan={pilihan} aktif={aktif} aksi={aksi} label="Pakai template" className={tombolTinta} />
      </div>
    </div>
  );
}
