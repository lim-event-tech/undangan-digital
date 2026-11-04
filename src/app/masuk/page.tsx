import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LayoutAuth } from "@/components/layout-auth";
import { googleConfigured } from "@/lib/auth-options";
import { getSession } from "@/lib/session";
import { FormMasuk } from "./form-masuk";
import { TombolGoogle } from "./tombol-google";

export const metadata: Metadata = { title: "Masuk" };

const PESAN_GALAT: Record<string, string> = {
  diblokir: "Akun ini sedang diblokir. Hubungi admin bila ini keliru.",
  oauth: "Masuk dengan Google gagal. Coba lagi.",
};

function satu(value: string | string[] | undefined): string | undefined {
  return typeof value === "string" ? value : undefined;
}

export default async function MasukPage({ searchParams }: PageProps<"/masuk">) {
  const session = await getSession();
  if (session && session.user.status !== "diblokir") redirect("/undangan");

  const sp = await searchParams;
  const kodeGalat = satu(sp.galat) ?? satu(sp.error);
  const pesan = kodeGalat
    ? (PESAN_GALAT[kodeGalat.toLowerCase()] ?? "Tidak bisa masuk. Coba lagi.")
    : null;

  return (
    <LayoutAuth
      judul="Masuk"
      deskripsi="Masuk dengan email dan kata sandi, atau dengan akun Google Anda."
    >
      {pesan ? (
        <p role="alert" className="m-0 rounded-md bg-galat-bg p-3 text-[13px] font-medium text-galat">
          {pesan}
        </p>
      ) : null}

      <FormMasuk />

      <div className="flex items-center gap-3 text-xs text-redup" aria-hidden="true">
        <span className="h-px flex-1 bg-garis" />
        atau
        <span className="h-px flex-1 bg-garis" />
      </div>

      <TombolGoogle siap={googleConfigured()} />

      <p className="m-0 text-[13px] text-redup">
        Tamu undangan tidak perlu masuk. Halaman ini hanya untuk pengguna.
      </p>
    </LayoutAuth>
  );
}
