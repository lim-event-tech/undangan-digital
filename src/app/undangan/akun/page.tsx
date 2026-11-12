import type { Metadata } from "next";
import { judulHalaman } from "@/components/ui";
import { db } from "@/db";
import { getAccountMethods } from "@/lib/account-settings/service";
import { googleLinkMessage } from "@/lib/account-settings/shared";
import { googleConfigured } from "@/lib/auth-options";
import { requireOwnAccount } from "@/lib/session";
import { FormAkun } from "./form-akun";

export const metadata: Metadata = { title: "Pengaturan akun" };

export default async function AkunPage({ searchParams }: PageProps<"/undangan/akun">) {
  const current = await requireOwnAccount();
  const [methods, params] = await Promise.all([
    getAccountMethods(db, current.user.id),
    searchParams,
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
