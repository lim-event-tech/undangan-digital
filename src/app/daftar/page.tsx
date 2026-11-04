import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LayoutAuth } from "@/components/layout-auth";
import { googleConfigured } from "@/lib/auth-options";
import { getSession } from "@/lib/session";
import { TombolGoogle } from "../masuk/tombol-google";
import { FormDaftar } from "./form-daftar";

export const metadata: Metadata = { title: "Daftar" };

export default async function DaftarPage() {
  const session = await getSession();
  if (session && session.user.status !== "diblokir") redirect("/undangan");

  return (
    <LayoutAuth
      judul="Daftar"
      deskripsi="Buat akun untuk menyiapkan undangan event Anda."
    >
      <FormDaftar />

      <div className="flex items-center gap-3 text-xs text-redup" aria-hidden="true">
        <span className="h-px flex-1 bg-garis" />
        atau
        <span className="h-px flex-1 bg-garis" />
      </div>

      <TombolGoogle siap={googleConfigured()} />
    </LayoutAuth>
  );
}
