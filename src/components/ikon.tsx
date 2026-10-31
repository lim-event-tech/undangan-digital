const BENTUK = {
  surat: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </>
  ),
  dasbor: <path d="M3 13h8V3H3zM13 21h8V11h-8zM13 3v6h8V3zM3 21h8v-6H3z" />,
  pena: <path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z" />,
  tamu: (
    <>
      <circle cx="9" cy="8" r="4" />
      <path d="M2 21a7 7 0 0114 0M17 11a3 3 0 100-6M22 21a6 6 0 00-5-6" />
    </>
  ),
  kirim: <path d="M22 2L11 13M22 2l-7 20-4-9-9-4z" />,
  templat: (
    <>
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </>
  ),
  unduh: <path d="M12 3v12M7 10l5 5 5-5M4 21h16" />,
  cari: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4-4" />
    </>
  ),
  tautan: (
    <path d="M10 13a5 5 0 007 0l3-3a5 5 0 00-7-7l-1 1M14 11a5 5 0 00-7 0l-3 3a5 5 0 007 7l1-1" />
  ),
  ceklis: <path d="M5 12l5 5 9-10" />,
  awas: (
    <>
      <path d="M12 8v5M12 16h.01" />
      <circle cx="12" cy="12" r="9" />
    </>
  ),
  salin: (
    <>
      <rect x="8" y="8" width="12" height="12" rx="2" />
      <path d="M16 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h2" />
    </>
  ),
  berkas: (
    <>
      <path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9z" />
      <path d="M14 3v6h6M8 13h8M8 17h5" />
    </>
  ),
  keluar: <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />,
  kunci: (
    <>
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 018 0v4" />
    </>
  ),
  tutup: <path d="M6 6l12 12M18 6L6 18" />,
  sampah: <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" />,
} as const;

export type NamaIkon = keyof typeof BENTUK;

export function Ikon({
  nama,
  ukuran = 18,
  tebal = 1.6,
  className,
}: {
  nama: NamaIkon;
  ukuran?: number;
  tebal?: number;
  className?: string;
}) {
  return (
    <svg
      width={ukuran}
      height={ukuran}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={tebal}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {BENTUK[nama]}
    </svg>
  );
}
