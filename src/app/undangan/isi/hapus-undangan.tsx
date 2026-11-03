import { kartu, tombolBahaya } from "@/components/ui";
import { hapusUndanganAction } from "./actions";

export function HapusUndangan({ jumlahTamu }: { jumlahTamu: number }) {
  return (
    <section aria-labelledby="hapus-undangan-judul" className={`${kartu} flex flex-col gap-3 p-5 sm:p-6`}>
      <h2 id="hapus-undangan-judul" className="m-0 font-judul text-2xl font-medium">
        Hapus undangan
      </h2>
      <details>
        <summary className="cursor-pointer text-sm font-medium text-galat">
          Hapus undangan ini beserta semua tamunya
        </summary>
        <form action={hapusUndanganAction} className="mt-3 flex flex-col gap-2.5">
          <p className="m-0 text-[13px] leading-relaxed text-redup-2">
            Undangan, {jumlahTamu} tamu, acara, foto, dan semua jawaban RSVP akan dihapus
            permanen dan tidak bisa dikembalikan. Link yang sudah dikirim ke tamu berhenti
            bekerja.
          </p>
          <button type="submit" className={`${tombolBahaya} self-start`}>
            Ya, hapus undangan
          </button>
        </form>
      </details>
    </section>
  );
}
