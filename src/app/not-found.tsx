import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-kertas p-6">
      <div className="flex max-w-sm flex-col items-center gap-3 text-center">
        <h1 className="m-0 font-judul text-[34px] leading-tight font-medium">
          Halaman tidak ditemukan
        </h1>
        <p className="m-0 text-sm leading-relaxed text-redup-2">
          Alamat yang Anda buka tidak ada atau sudah dipindahkan.
        </p>
        <Link href="/masuk" className="text-sm font-medium text-emas">
          Ke halaman masuk
        </Link>
      </div>
    </main>
  );
}
