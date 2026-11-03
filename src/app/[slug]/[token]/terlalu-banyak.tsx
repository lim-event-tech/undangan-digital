export function TerlaluBanyakPercobaan({ detik }: { detik: number }) {
  const menit = Math.max(1, Math.ceil(detik / 60));
  return (
    <main className="flex min-h-screen items-center justify-center bg-melati-halaman p-6">
      <div className="flex max-w-sm flex-col items-center gap-3 text-center">
        <span aria-hidden="true" className="font-judul text-5xl text-melati-emas">
          &#10086;
        </span>
        <h1 className="m-0 font-judul text-[34px] leading-tight font-medium text-melati-teks">
          Terlalu banyak percobaan
        </h1>
        <p className="m-0 text-sm leading-relaxed text-melati-teks/80">
          Link yang dibuka dari jaringan ini beberapa kali tidak dikenali. Tunggu sekitar {menit}{" "}
          menit, lalu buka lagi link dari pesan yang Anda terima.
        </p>
        <p className="mt-2 mb-0 text-xs tracking-[0.12em] text-melati-teks/60 uppercase">
          Kode: percobaan dibatasi
        </p>
      </div>
    </main>
  );
}
