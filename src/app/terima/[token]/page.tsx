import type { Metadata } from "next";
import Link from "next/link";
import { LayoutAuth } from "@/components/layout-auth";
import { tombolGelap, tombolTerang } from "@/components/ui";
import { db } from "@/db";
import { getSession } from "@/lib/session";
import { previewInvite, type InviteState } from "@/lib/team/service";
import { FormTerima, TombolLewati } from "./form-terima";

export const metadata: Metadata = { title: "Terima undangan tim", robots: { index: false, follow: false } };

const PESAN: Record<Exclude<InviteState, "valid">, string> = {
  "tidak-ada": "Tautan undangan tidak ditemukan atau tidak lengkap.",
  kedaluwarsa: "Tautan undangan sudah kedaluwarsa. Minta pemilik undangan mengirim yang baru.",
  dipakai: "Tautan undangan ini sudah dipakai.",
  dicabut: "Tautan undangan ini sudah dibatalkan oleh pemilik undangan.",
};

export default async function TerimaPage({ params }: PageProps<"/terima/[token]">) {
  const { token } = await params;
  const [{ state, invite }, session] = await Promise.all([previewInvite(db, token), getSession()]);

  if (state !== "valid" || !invite) {
    return (
      <LayoutAuth judul="Undangan tim" deskripsi={PESAN[state === "valid" ? "tidak-ada" : state]}>
        {session ? <TombolLewati /> : <Link href="/masuk" className={`${tombolTerang} no-underline`}>Masuk</Link>}
      </LayoutAuth>
    );
  }

  const masuk = session && session.user.status !== "diblokir";
  return (
    <LayoutAuth
      judul="Bergabung ke tim"
      deskripsi={`${invite.ownerName} mengundang Anda mengelola daftar undangan untuk "${invite.title}". Anda hanya akan melihat tamu yang Anda tambahkan sendiri.`}
    >
      <p className="m-0 text-[13px] text-redup">Undangan ini dikirim ke {invite.email}.</p>
      {masuk ? (
        <>
          <p className="m-0 text-[13px] text-redup">Anda masuk sebagai {session.user.email}.</p>
          <FormTerima token={token} />
        </>
      ) : (
        <div className="flex flex-wrap gap-3">
          <a href={`/terima/${token}/mulai?ke=masuk`} className={`${tombolGelap} no-underline`}>Masuk untuk menerima</a>
          <a href={`/terima/${token}/mulai?ke=daftar`} className={`${tombolTerang} no-underline`}>Buat akun</a>
        </div>
      )}
    </LayoutAuth>
  );
}
