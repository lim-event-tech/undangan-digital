"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { BrandLogo } from "@/components/brand-logo";
import { SidebarNav, type ItemNav } from "@/components/sidebar-nav";
import { TombolKeluar } from "@/components/tombol-keluar";
import { akhiriKelolaAction } from "@/app/undangan/kelola-actions";

const STATUS_UNDANGAN = {
  draf: { label: "Draf", kelas: "bg-krem-2 text-redup-2" },
  terbit: { label: "Terbit", kelas: "bg-hijau-bg text-hijau" },
  ditangguhkan: { label: "Ditangguhkan", kelas: "bg-jingga-bg text-jingga" },
} as const;

function invitationNav(id: string, peran: "pemilik" | "anggota", templateKey?: string): ItemNav[] {
  const base = `/undangan/${id}`;
  const pratinjauHref = `/pratinjau/${templateKey || "bersama"}?undangan=${id}`;
  if (peran === "anggota") {
    return [
      { label: "Daftar undangan", ikon: "tamu", href: `${base}/tamu` },
      { label: "Kirim undangan", ikon: "kirim", href: `${base}/kirim` },
      { label: "Narahubung saya", ikon: "surat", href: `${base}/kontak` },
      { label: "Check-in", ikon: "ceklis", href: `${base}/checkin` },
      { label: "Pratinjau undangan", ikon: "mata", href: pratinjauHref, targetBlank: true },
    ];
  }
  return [
    { label: "Ringkasan RSVP", ikon: "dasbor", href: `${base}/ringkasan` },
    { label: "Isi undangan", ikon: "pena", href: `${base}/isi` },
    { label: "Daftar undangan", ikon: "tamu", href: `${base}/tamu` },
    { label: "Kirim undangan", ikon: "kirim", href: `${base}/kirim` },
    { label: "Check-in", ikon: "ceklis", href: `${base}/checkin` },
    { label: "Tim", ikon: "tautan", href: `${base}/tim` },
    { label: "Ganti template", ikon: "templat", href: `${base}/template` },
    { label: "Pratinjau undangan", ikon: "mata", href: pratinjauHref, targetBlank: true },
  ];
}

export type ShellUser = { name: string; email: string };
export type ShellInvitation = {
  id: string;
  title: string;
  status: keyof typeof STATUS_UNDANGAN;
  peran: "pemilik" | "anggota";
  templateKey?: string;
};

export function AppShell({
  user,
  invitations,
  pengumuman,
  kelola,
  children,
}: {
  user: ShellUser;
  invitations: ShellInvitation[];
  pengumuman?: { teks: string; jenis: string } | null;
  kelola?: { admin: string } | null;
  children: React.ReactNode;
}) {
  const { id } = useParams();
  const invitation = invitations.find((item) => item.id === (typeof id === "string" ? id.toLowerCase() : null)) ?? null;
  const status = invitation ? STATUS_UNDANGAN[invitation.status] : null;

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <aside className="flex flex-col gap-4 border-b border-garis bg-white p-4 lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:shrink-0 lg:overflow-y-auto lg:border-r lg:border-b-0">
        <Link
          href="/undangan"
          aria-label="LIM-RSVP, daftar undangan"
          className="flex items-center gap-2 px-2 text-tinta no-underline"
        >
          <BrandLogo height={36} />
        </Link>

        {invitation && status ? (
          <div className="flex flex-col gap-0.5 rounded-lg bg-kertas p-3">
            <span className="text-xs text-redup">{invitation.peran === "anggota" ? "Undangan (anggota tim)" : "Undangan"}</span>
            <span className="font-medium wrap-anywhere">
              {invitation.title}
            </span>
            <span
              className={`mt-1 self-start rounded-full px-2 py-0.5 text-xs font-medium ${status.kelas}`}
            >
              {status.label}
            </span>
          </div>
        ) : null}

        <SidebarNav items={[
          ...(!kelola ? [
            { label: "Semua undangan", ikon: "surat" as const, href: "/undangan", tepat: true },
            { label: "Buat undangan", ikon: "pena" as const, href: "/undangan/baru" },
          ] : []),
          ...(invitation ? invitationNav(invitation.id, invitation.peran, invitation.templateKey) : []),
          ...(!kelola ? [{ label: "Pengaturan akun", ikon: "kunci" as const, href: "/undangan/akun" }] : []),
        ]} />

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-garis-halus pt-4 lg:flex-col lg:items-stretch">
          <div className="flex min-w-0 flex-col px-1">
            <span className="truncate text-sm font-medium">{user.name}</span>
            <span className="truncate text-xs text-redup">{user.email}</span>
          </div>
          <TombolKeluar />
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-5 pt-7 pb-16 sm:px-7">
        {kelola ? (
          <div
            role="status"
            className="mx-auto mb-5 flex max-w-5xl flex-wrap items-center justify-between gap-3 rounded-[10px] border border-emas-muda bg-krem p-4 text-sm leading-relaxed text-emas-tua"
          >
            <span>
              Anda ({kelola.admin}) sedang mengelola undangan ini sebagai admin. Semua perubahan atas nama pemilik
              undangan.
            </span>
            <form action={akhiriKelolaAction}>
              <button
                type="submit"
                className="inline-flex min-h-10 items-center rounded-md border border-garis-input bg-white px-3.5 text-sm font-medium text-tinta"
              >
                Selesai mengelola
              </button>
            </form>
          </div>
        ) : null}
        {pengumuman ? (
          <div
            role="status"
            className="mx-auto mb-5 flex max-w-5xl flex-col gap-0.5 rounded-[10px] bg-krem p-4 text-sm leading-relaxed text-emas-tua"
          >
            <span className="text-xs font-medium tracking-[0.12em] uppercase">{pengumuman.jenis}</span>
            <span className="whitespace-pre-line">{pengumuman.teks}</span>
          </div>
        ) : null}
        {children}
      </main>
    </div>
  );
}
