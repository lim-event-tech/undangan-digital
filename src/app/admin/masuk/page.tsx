import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { googleConfigured } from "@/lib/auth-options";
import { getAdmin } from "@/lib/session";
import { TombolGoogle } from "../../masuk/tombol-google";
import { FormMasukAdmin } from "./form-masuk-admin";

export const metadata: Metadata = { title: "Masuk admin" };

const PESAN_GALAT: Record<string, string> = {
  bukan: "Akun ini tidak punya akses admin.",
  google: "Email Google ini belum didaftarkan sebagai admin. Minta Super admin menambahkannya di halaman Tim.",
};

export default async function MasukAdminPage({ searchParams }: PageProps<"/admin/masuk">) {
  if (await getAdmin()) redirect("/admin");

  const sp = await searchParams;
  const kode = typeof sp.galat === "string" ? sp.galat : undefined;
  const pesan = kode ? (PESAN_GALAT[kode] ?? "Tidak bisa masuk. Coba lagi.") : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-kertas p-5">
      <div className="flex w-full max-w-md flex-col gap-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <span className="text-xs tracking-[0.2em] text-emas uppercase">Admin global</span>
          <span className="font-judul text-[32px] leading-none font-semibold">UndanganDigital</span>
        </div>
        <div className="flex flex-col gap-6 rounded-[10px] border border-garis bg-white p-7 shadow-[0_1px_2px_rgba(42,38,34,0.04),0_12px_32px_-18px_rgba(42,38,34,0.22)]">
          <div className="flex flex-col gap-1.5">
            <h1 className="m-0 font-judul text-[34px] leading-tight font-semibold">Masuk admin</h1>
            <p className="m-0 text-sm text-redup">
              Halaman ini hanya untuk tim admin. Akun pasangan masuk lewat halaman Masuk biasa.
            </p>
          </div>
          {pesan ? (
            <p role="alert" className="m-0 rounded-md bg-galat-bg p-3 text-[13px] font-medium text-galat">
              {pesan}
            </p>
          ) : null}
          <FormMasukAdmin />
          <div className="flex items-center gap-3 text-xs text-redup" aria-hidden="true">
            <span className="h-px flex-1 bg-garis" />
            atau
            <span className="h-px flex-1 bg-garis" />
          </div>
          <TombolGoogle siap={googleConfigured()} admin />
        </div>
        <p className="m-0 text-center text-xs text-redup">
          Admin masuk dengan email Google yang didaftarkan Super admin, atau dengan kata sandi. Lupa kata sandi? Minta Super admin menggantinya di halaman Tim.
        </p>
      </div>
    </div>
  );
}
