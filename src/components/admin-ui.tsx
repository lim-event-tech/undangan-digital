import Link from "next/link";
import type { ReactNode } from "react";
import { judulHalaman } from "@/components/ui";

const STATUS_UNDANGAN = {
  draf: { label: "Draf", kelas: "bg-krem-2 text-redup-2" },
  terbit: { label: "Terbit", kelas: "bg-hijau-bg text-hijau" },
  ditangguhkan: { label: "Ditangguhkan", kelas: "bg-jingga-bg text-jingga" },
} as const;

export function LencanaUndangan({ status }: { status: keyof typeof STATUS_UNDANGAN }) {
  const item = STATUS_UNDANGAN[status];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${item.kelas}`}
    >
      {item.label}
    </span>
  );
}

export function LencanaAkun({ status }: { status: "aktif" | "diblokir" }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${
        status === "aktif" ? "bg-hijau-bg text-hijau" : "bg-galat-bg text-galat"
      }`}
    >
      {status === "aktif" ? "Aktif" : "Diblokir"}
    </span>
  );
}

export function JudulAdmin({
  bagian,
  judul,
  keterangan,
  aksi,
}: {
  bagian: string;
  judul: string;
  keterangan?: string;
  aksi?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="max-w-2xl">
        <p className="m-0 text-xs tracking-[0.16em] text-emas uppercase">{bagian}</p>
        <h1 className={`mt-1 mb-0 ${judulHalaman}`}>{judul}</h1>
        {keterangan ? <p className="mt-1.5 mb-0 text-sm leading-relaxed text-redup">{keterangan}</p> : null}
      </div>
      {aksi ? <div className="flex flex-wrap gap-2">{aksi}</div> : null}
    </div>
  );
}

export function Halaman({ children }: { children: ReactNode }) {
  return <div className="mx-auto flex max-w-6xl flex-col gap-6">{children}</div>;
}

export function Notifikasi({
  jenis,
  children,
}: {
  jenis: "info" | "galat" | "sukses";
  children: ReactNode;
}) {
  const kelas =
    jenis === "galat"
      ? "bg-galat-bg text-galat"
      : jenis === "sukses"
        ? "bg-hijau-bg text-hijau"
        : "bg-krem text-emas-tua";
  return (
    <div role={jenis === "galat" ? "alert" : "status"} className={`rounded-[10px] p-4 text-sm leading-relaxed ${kelas}`}>
      {children}
    </div>
  );
}

export function Penomoran({
  halaman,
  total,
  ukuran,
  href,
}: {
  halaman: number;
  total: number;
  ukuran: number;
  href: (page: number) => string;
}) {
  const jumlah = Math.max(1, Math.ceil(total / ukuran));
  if (jumlah <= 1) return null;
  const tautan = "inline-flex min-h-10 items-center rounded-md border border-garis-input bg-white px-3.5 text-sm font-medium text-tinta no-underline hover:bg-kertas";
  return (
    <nav aria-label="Halaman" className="flex items-center justify-between gap-3 text-sm text-redup">
      <span>
        Halaman {halaman} dari {jumlah} · {total} data
      </span>
      <span className="flex gap-2">
        {halaman > 1 ? (
          <Link href={href(halaman - 1)} className={tautan}>
            Sebelumnya
          </Link>
        ) : null}
        {halaman < jumlah ? (
          <Link href={href(halaman + 1)} className={tautan}>
            Berikutnya
          </Link>
        ) : null}
      </span>
    </nav>
  );
}

export function satu(value: string | string[] | undefined): string | undefined {
  const v = Array.isArray(value) ? value[0] : value;
  return v === "" ? undefined : v;
}

export function angka(value: string | undefined, fallback = 1): number {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= 10_000 ? n : fallback;
}

export function bangunQuery(params: Record<string, string | undefined>): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value) query.set(key, value);
  const text = query.toString();
  return text ? `?${text}` : "";
}
