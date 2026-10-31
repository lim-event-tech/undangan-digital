import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { googleConfigured } from "@/lib/auth-options";
import { getSession } from "@/lib/session";
import { kartu } from "@/components/ui";
import { TombolGoogle } from "./tombol-google";

export const metadata: Metadata = { title: "Masuk" };

const PESAN_GALAT: Record<string, string> = {
  diblokir: "Akun ini sedang diblokir. Hubungi admin bila ini keliru.",
  oauth: "Masuk dengan Google gagal. Coba lagi.",
};

export default async function MasukPage({ searchParams }: PageProps<"/masuk">) {
  const session = await getSession();
  if (session && session.user.status !== "diblokir") redirect("/undangan");

  const { galat } = await searchParams;
  const kodeGalat = typeof galat === "string" ? galat : undefined;
  const pesan = kodeGalat
    ? (PESAN_GALAT[kodeGalat] ?? "Tidak bisa masuk. Coba lagi.")
    : null;

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <section className="hidden flex-col justify-between border-r border-garis bg-krem-2/60 p-12 lg:flex">
        <span className="font-judul text-[26px] font-semibold">
          UndanganDigital
        </span>
        <div className="flex max-w-md flex-col gap-4">
          <h2 className="font-judul text-[52px] leading-[1.08] font-semibold">
            Semua tamu,{" "}
            <span className="font-medium text-emas italic">satu dashboard.</span>
          </h2>
          <p className="m-0 text-base leading-relaxed text-redup-2">
            Susun daftar tamu, bagikan link pribadi untuk tiap tamu, dan lihat
            siapa saja yang sudah menjawab.
          </p>
        </div>
        <span aria-hidden="true" />
      </section>

      <main className="flex items-center justify-center p-5 sm:p-10">
        <div
          className={`${kartu} flex w-full max-w-md flex-col gap-6 p-7 shadow-[0_1px_2px_rgba(42,38,34,0.04),0_12px_32px_-18px_rgba(42,38,34,0.22)]`}
        >
          <div className="flex flex-col gap-1.5">
            <h1 className="m-0 font-judul text-[34px] leading-tight font-semibold">
              Masuk
            </h1>
            <p className="m-0 text-sm text-redup">
              Masuk dengan akun Google Anda. Akun dibuat otomatis pada masuk
              pertama.
            </p>
          </div>

          {pesan ? (
            <p
              role="alert"
              className="m-0 rounded-md bg-galat-bg p-3 text-[13px] font-medium text-galat"
            >
              {pesan}
            </p>
          ) : null}

          <TombolGoogle siap={googleConfigured()} />

          <p className="m-0 text-[13px] text-redup">
            Tamu undangan tidak perlu masuk. Halaman ini hanya untuk pasangan.
          </p>
        </div>
      </main>
    </div>
  );
}
