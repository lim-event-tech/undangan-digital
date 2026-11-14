import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { judulHalaman, kartu, tombolGelap, tombolTerang } from "@/components/ui";
import { db } from "@/db";
import { listInvitationsForOwner } from "@/lib/invitations/service";
import { listInvitationsForMember } from "@/lib/team/service";
import { getActing, requireUser } from "@/lib/session";
import { templateInfo } from "@/templates/registry";

export const metadata: Metadata = { title: "Semua undangan" };

const STATUS = {
  draf: { label: "Draf", kelas: "bg-krem-2 text-redup-2" },
  terbit: { label: "Terbit", kelas: "bg-hijau-bg text-hijau" },
  ditangguhkan: { label: "Ditangguhkan", kelas: "bg-jingga-bg text-jingga" },
} as const;

export default async function UndanganIndex() {
  const user = await requireUser();
  const acting = await getActing();
  if (acting) redirect(`/undangan/${acting.invitation.id}/isi`);
  const [dimiliki, diikuti] = await Promise.all([listInvitationsForOwner(db, user.id), listInvitationsForMember(db, user.id)]);
  const invitations = [...dimiliki.map((item) => ({ ...item, peran: "pemilik" as const, bersama: false })), ...diikuti.map((item) => ({ ...item, bersama: true }))];
  const tanggal = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeZone: "Asia/Jakarta" });
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className={`m-0 ${judulHalaman}`}>Semua undangan</h1>
          <p className="mt-2 mb-0 text-sm leading-relaxed text-redup">Pilih undangan yang ingin Anda kelola atau buat acara baru.</p>
        </div>
        <Link href="/undangan/baru" className={`${tombolGelap} no-underline`}>Buat undangan</Link>
      </header>
      {invitations.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {invitations.map((item) => {
            const status = STATUS[item.status];
            return (
              <article key={item.id} className={`${kartu} flex min-w-0 flex-col items-start gap-4 p-6`}>
                <div className="flex flex-wrap gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${status.kelas}`}>{status.label}</span>
                  {item.bersama ? <span className="rounded-full bg-krem px-2.5 py-1 text-xs font-medium text-emas-tua">{item.peran === "pemilik" ? "Pemilik tim" : "Anggota tim"}</span> : null}
                </div>
                <h2 className="m-0 font-judul text-[28px] leading-tight font-medium wrap-anywhere">{item.title}</h2>
                <p className="m-0 text-xs leading-relaxed text-redup">Template {templateInfo(item.templateKey).label}<br />Dibuat {tanggal.format(item.createdAt)}</p>
                <Link href={`/undangan/${item.id}/${item.peran === "anggota" ? "tamu" : "isi"}`} className={`${tombolTerang} mt-auto no-underline`} aria-label={`Kelola ${item.title}`}>{item.peran === "anggota" ? "Buka daftar undangan →" : "Kelola undangan →"}</Link>
              </article>
            );
          })}
        </div>
      ) : (
        <div className={`${kartu} flex flex-col items-center gap-3 px-6 py-14 text-center`}>
          <h2 className="m-0 font-judul text-[30px] font-medium">Belum ada undangan</h2>
          <p className="m-0 max-w-md text-sm leading-relaxed text-redup">Mulai dengan memilih template dan mengisi judul acara Anda.</p>
          <Link href="/undangan/baru" className={`${tombolTerang} mt-3 no-underline`}>Buat undangan pertama</Link>
        </div>
      )}
    </div>
  );
}
