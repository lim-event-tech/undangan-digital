import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LayoutAuth } from "@/components/layout-auth";
import { tombolGelap, tombolTerang } from "@/components/ui";
import { db } from "@/db";
import { googleConfigured } from "@/lib/auth-options";
import { getSession } from "@/lib/session";
import { previewInvite, type InviteState } from "@/lib/team/service";
import { TombolLewati } from "./form-terima";
import { MasukOtomatis, TombolManual } from "./masuk-otomatis";

export const metadata: Metadata = { title: "Bergabung ke tim", robots: { index: false, follow: false } };

const PESAN: Record<Exclude<InviteState, "valid">, string> = {
  "tidak-ada": "Tautan undangan tidak ditemukan atau tidak lengkap.",
  kedaluwarsa: "Tautan undangan sudah kedaluwarsa. Minta pemilik undangan mengirim yang baru.",
  dipakai: "Tautan undangan ini sudah dipakai.",
  dicabut: "Tautan undangan ini sudah dibatalkan oleh pemilik undangan.",
};

const PESAN_GALAT: Record<string, string> = {
  "akun-admin": "Akun admin tidak bisa menjadi anggota tim. Keluar, lalu masuk dengan akun pengguna.",
  gagal: "Undangan gagal diterima. Coba buka tautan dari surel sekali lagi.",
  oauth: "Masuk dengan Google gagal. Coba lagi.",
};

function satu(value: string | string[] | undefined): string | undefined {
  return typeof value === "string" ? value : undefined;
}

export default async function TerimaPage({ params, searchParams }: PageProps<"/terima/[token]">) {
  const [{ token }, sp] = await Promise.all([params, searchParams]);
  const [{ state, invite }, session] = await Promise.all([previewInvite(db, token), getSession()]);
  const kodeGalat = satu(sp.galat);
  const galat = kodeGalat ? PESAN_GALAT[kodeGalat] : undefined;
  const masuk = Boolean(session && session.user.status !== "diblokir");

  if (state !== "valid" || !invite) {
    if (masuk && invite && state === "dipakai" && !galat) redirect(`/terima/${token}/gabung`);
    return (
      <LayoutAuth judul="Undangan tim" deskripsi={PESAN[state === "valid" ? "tidak-ada" : state]}>
        {session ? <TombolLewati /> : <Link href="/masuk" className={`${tombolTerang} no-underline`}>Masuk</Link>}
      </LayoutAuth>
    );
  }

  if (masuk && !galat) redirect(`/terima/${token}/gabung`);

  const deskripsi = `${invite.ownerName} mengundang Anda mengelola daftar undangan untuk "${invite.title}".`;
  const pesanGalat = galat ? (
    <p role="alert" className="m-0 rounded-md bg-galat-bg p-3 text-[13px] font-medium text-galat">{galat}</p>
  ) : null;

  if (masuk) {
    const admin = Boolean(session?.user.adminRole);
    return (
      <LayoutAuth judul="Bergabung ke tim" deskripsi={deskripsi}>
        {pesanGalat}
        <Link href={admin ? "/admin" : "/undangan"} className={`${tombolGelap} no-underline`}>{admin ? "Ke panel admin" : "Lanjut ke undangan saya"}</Link>
      </LayoutAuth>
    );
  }

  return (
    <LayoutAuth judul="Bergabung ke tim" deskripsi={deskripsi}>
      {pesanGalat}
      <p className="m-0 text-[13px] text-redup">Undangan ini dikirim ke {invite.email}.</p>
      {googleConfigured() ? <MasukOtomatis token={token} otomatis={!galat} /> : <TombolManual token={token} />}
    </LayoutAuth>
  );
}
