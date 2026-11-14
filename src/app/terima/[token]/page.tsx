import type { Metadata } from "next";
import Link from "next/link";
import { LayoutAuth } from "@/components/layout-auth";
import { tombolGelap, tombolTerang } from "@/components/ui";
import { db } from "@/db";
import { googleConfigured } from "@/lib/auth-options";
import { getSession } from "@/lib/session";
import { getInvitationAccess, previewInvite, type InviteState } from "@/lib/team/service";
import { TombolLewati } from "./form-terima";
import { TombolManual, TombolTerimaGoogle } from "./masuk-otomatis";

export const metadata: Metadata = { title: "Bergabung ke tim", robots: { index: false, follow: false } };

const PESAN: Record<Exclude<InviteState, "valid">, string> = {
  "tidak-ada": "Tautan undangan tidak ditemukan atau tidak lengkap.",
  kedaluwarsa: "Tautan undangan sudah kedaluwarsa. Minta pemilik undangan mengirim yang baru.",
  dipakai: "Tautan undangan ini sudah dipakai.",
  dicabut: "Tautan undangan ini sudah dibatalkan oleh pemilik undangan.",
};

const PESAN_GALAT: Record<string, string> = {
  "akun-admin": "Akun admin tidak bisa menjadi anggota tim. Keluar, lalu masuk dengan akun pengguna.",
  "email-tidak-sesuai": "Email akun yang digunakan tidak sesuai dengan email yang diundang. Masuk dengan akun Google yang sesuai.",
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

  const akses =
    masuk && session && invite
      ? await getInvitationAccess(db, session.user.id, invite.invitationId)
      : null;

  if (state !== "valid" || !invite) {
    if (akses && invite && state === "dipakai") {
      return (
        <LayoutAuth
          judul="Sudah bergabung"
          deskripsi={`Anda sudah memiliki akses pada undangan "${invite.title}".`}
        >
          <Link
            href={`/undangan/${invite.invitationId}/${akses.role === "anggota" ? "tamu" : "isi"}`}
            className={`${tombolGelap} no-underline`}
          >
            Buka undangan
          </Link>
        </LayoutAuth>
      );
    }
    return (
      <LayoutAuth judul="Undangan tim" deskripsi={PESAN[state === "valid" ? "tidak-ada" : state]}>
        {session ? <TombolLewati /> : <Link href="/masuk" className={`${tombolTerang} no-underline`}>Masuk</Link>}
      </LayoutAuth>
    );
  }

  const deskripsi = `${invite.ownerName} mengundang Anda mengelola daftar undangan untuk "${invite.title}".`;
  const pesanGalat = galat ? (
    <p role="alert" className="m-0 rounded-md bg-galat-bg p-3 text-[13px] font-medium text-galat">{galat}</p>
  ) : null;
  const pakaiGoogle = googleConfigured();

  if (masuk && session) {
    if (akses) {
      return (
        <LayoutAuth judul="Bergabung ke tim" deskripsi={deskripsi}>
          <p className="m-0 text-[13px] text-redup">Anda sudah terdaftar pada undangan ini.</p>
          <Link
            href={`/undangan/${invite.invitationId}/${akses.role === "anggota" ? "tamu" : "isi"}`}
            className={`${tombolGelap} no-underline`}
          >
            Buka undangan
          </Link>
        </LayoutAuth>
      );
    }

    if (session.user.adminRole) {
      return (
        <LayoutAuth judul="Bergabung ke tim" deskripsi={deskripsi}>
          {pesanGalat}
          <p className="m-0 text-[13px] text-redup">
            Anda sedang masuk sebagai akun admin ({session.user.email}). Undangan ini dikirim ke {invite.email}.
          </p>
          {pakaiGoogle ? (
            <TombolTerimaGoogle token={token} gantiAkun />
          ) : (
            <Link href="/admin" className={`${tombolGelap} no-underline`}>Ke panel admin</Link>
          )}
        </LayoutAuth>
      );
    }

    const emailSesuai = session.user.email.trim().toLowerCase() === invite.email.trim().toLowerCase();
    if (!emailSesuai) {
      return (
        <LayoutAuth judul="Bergabung ke tim" deskripsi={deskripsi}>
          {pesanGalat}
          <p className="m-0 rounded-md bg-jingga-bg p-3 text-[13px] text-jingga">
            Anda sedang masuk sebagai <strong>{session.user.email}</strong>. Undangan ini khusus untuk{" "}
            <strong>{invite.email}</strong>.
          </p>
          {pakaiGoogle ? <TombolTerimaGoogle token={token} gantiAkun /> : <TombolManual token={token} />}
        </LayoutAuth>
      );
    }

    return (
      <LayoutAuth judul="Bergabung ke tim" deskripsi={deskripsi}>
        {pesanGalat}
        <p className="m-0 text-[13px] text-redup">
          Masuk sebagai <strong>{session.user.email}</strong>. Klik tombol di bawah untuk bergabung.
        </p>
        <Link href={`/terima/${token}/gabung`} className={`${tombolGelap} min-h-12 justify-center no-underline`}>
          Terima undangan
        </Link>
      </LayoutAuth>
    );
  }

  return (
    <LayoutAuth judul="Bergabung ke tim" deskripsi={deskripsi}>
      {pesanGalat}
      <p className="m-0 text-[13px] text-redup">
        Undangan ini dikirim ke <strong>{invite.email}</strong>. Masuk dengan akun Google yang sesuai untuk menerima.
      </p>
      {pakaiGoogle ? <TombolTerimaGoogle token={token} /> : <TombolManual token={token} />}
    </LayoutAuth>
  );
}
