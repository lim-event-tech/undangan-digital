import type { Metadata } from "next";
import { judulHalaman, kartu } from "@/components/ui";
import { db } from "@/db";
import { getAccountMethods } from "@/lib/account-settings/service";
import { googleLinkMessage } from "@/lib/account-settings/shared";
import { googleConfigured } from "@/lib/auth-options";
import { requireOwnAccount } from "@/lib/session";
import { getUserWabaStatus } from "@/lib/waba/service";
import { FormAkun } from "./form-akun";

export const metadata: Metadata = { title: "Pengaturan akun" };

export default async function AkunPage({ searchParams }: PageProps<"/undangan/akun">) {
  const current = await requireOwnAccount();
  const [methods, params, wabaStatus] = await Promise.all([
    getAccountMethods(db, current.user.id),
    searchParams,
    getUserWabaStatus(db, current.user.id),
  ]);
  const error = typeof params.error === "string" ? params.error : undefined;
  const googleError = error || params.google === "gagal" ? googleLinkMessage(error) : null;
  const googleSuccess = params.google === "terhubung" && methods.googleConnected;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <header>
        <h1 className={`${judulHalaman} m-0`}>Pengaturan akun</h1>
        <p className="mt-2 mb-0 text-sm leading-relaxed text-redup-2">
          Kelola email, kata sandi, dan akun Google untuk masuk ke LIM-RSVP.
        </p>
      </header>

      <section aria-labelledby="judul-waba-akun" className={`${kartu} flex flex-col gap-4 p-5 sm:p-7`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-col gap-0.5">
            <h2 id="judul-waba-akun" className="m-0 font-judul text-2xl font-medium">WhatsApp Business API (WABA)</h2>
            <p className="m-0 text-sm leading-relaxed text-redup-2">
              Layanan pengiriman undangan resmi WhatsApp via Meta Cloud API tanpa perlu scan QR.
            </p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              wabaStatus.wabaAllowed ? "bg-hijau-bg text-hijau" : "bg-krem-2 text-redup-2"
            }`}
          >
            {wabaStatus.wabaAllowed ? "WABA Resmi Diizinkan" : "Hanya Baileys"}
          </span>
        </div>

        {wabaStatus.wabaAllowed ? (
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <div className="flex min-w-36 flex-col gap-0.5 rounded-lg border border-garis bg-kertas p-3">
              <span className="text-[11px] font-medium uppercase tracking-wider text-redup">Sisa Kredit Pesan</span>
              <span className={`text-2xl font-bold ${wabaStatus.wabaQuota > 0 ? "text-emas" : "text-merah"}`}>
                {wabaStatus.wabaQuota}
              </span>
            </div>
            <div className="flex min-w-36 flex-col gap-0.5 rounded-lg border border-garis bg-kertas p-3">
              <span className="text-[11px] font-medium uppercase tracking-wider text-redup">Total Terkirim</span>
              <span className="text-2xl font-bold text-tinta">
                {wabaStatus.wabaSentCount}
              </span>
            </div>
            <p className="m-0 text-xs leading-relaxed text-redup-2 sm:max-w-md">
              Setiap undangan yang dikirim via WABA resmi akan mengurangi 1 kredit pesan dan mencatat akumulasi pengiriman akun Anda. Untuk menambah kuota kredit, hubungi Super Admin.
            </p>
          </div>
        ) : (
          <p className="m-0 text-xs leading-relaxed text-redup">
            Akun Anda saat ini menggunakan koneksi WhatsApp standar (scan QR perangkat sendiri). Jika Anda membutuhkan akses WhatsApp Business API Resmi Meta, hubungi Super Admin untuk mengaktifkan izin WABA akun Anda.
          </p>
        )}
      </section>

      <FormAkun
        email={current.user.email}
        hasPassword={methods.hasPassword}
        googleConnected={methods.googleConnected}
        googleAvailable={googleConfigured()}
        googleMessage={googleError ?? (googleSuccess ? "Akun Google berhasil dihubungkan." : null)}
        googleError={Boolean(googleError)}
      />
    </div>
  );
}
