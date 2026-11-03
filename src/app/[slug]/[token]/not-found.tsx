export default function UndanganTidakDitemukan() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-melati-halaman p-6">
      <div className="flex max-w-sm flex-col items-center gap-3 text-center">
        <span aria-hidden="true" className="font-judul text-5xl text-melati-emas">
          &#10086;
        </span>
        <h1 className="m-0 font-judul text-[34px] leading-tight font-medium text-melati-teks">
          Undangan tidak ditemukan
        </h1>
        <p className="m-0 text-sm leading-relaxed text-melati-teks/80">
          Link yang Anda buka tidak lengkap atau sudah tidak berlaku. Coba buka lagi link dari
          pesan yang Anda terima, tanpa mengubah bagian akhirnya.
        </p>
        <p className="m-0 text-sm leading-relaxed text-melati-teks/80">
          Masih bermasalah? Hubungi orang yang mengirim undangan dan minta link baru.
        </p>
        <p className="mt-2 mb-0 text-xs tracking-[0.12em] text-melati-teks/60 uppercase">
          Kode: link tidak valid
        </p>
      </div>
    </main>
  );
}
