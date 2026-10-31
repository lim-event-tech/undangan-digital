import Link from "next/link";
import { Ikon } from "@/components/ikon";
import { SidebarNav, type ItemNav } from "@/components/sidebar-nav";
import { TombolKeluar } from "@/components/tombol-keluar";

const STATUS_UNDANGAN = {
  draf: { label: "Draf", kelas: "bg-krem-2 text-redup-2" },
  terbit: { label: "Terbit", kelas: "bg-hijau-bg text-hijau" },
  ditangguhkan: { label: "Ditangguhkan", kelas: "bg-jingga-bg text-jingga" },
} as const;

const NAV_DENGAN_UNDANGAN: ItemNav[] = [
  { label: "Ringkasan RSVP", ikon: "dasbor" },
  { label: "Isi undangan", ikon: "pena" },
  { label: "Daftar tamu", ikon: "tamu", href: "/undangan/tamu" },
  { label: "Kirim undangan", ikon: "kirim" },
  { label: "Ganti template", ikon: "templat" },
];

export type ShellUser = { name: string; email: string };
export type ShellInvitation = {
  groomName: string;
  brideName: string;
  status: keyof typeof STATUS_UNDANGAN;
};

export function AppShell({
  user,
  invitation,
  children,
}: {
  user: ShellUser;
  invitation: ShellInvitation | null;
  children: React.ReactNode;
}) {
  const status = invitation ? STATUS_UNDANGAN[invitation.status] : null;

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <aside className="flex flex-col gap-4 border-b border-garis bg-white p-4 lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:shrink-0 lg:overflow-y-auto lg:border-r lg:border-b-0">
        <Link
          href="/undangan"
          className="flex items-center gap-2 px-2 text-tinta no-underline"
        >
          <span
            aria-hidden="true"
            className="flex size-8 items-center justify-center rounded-full border border-[#c6a867] bg-white text-emas"
          >
            <Ikon nama="surat" ukuran={16} />
          </span>
          <span className="font-judul text-[21px] font-medium">
            UndanganDigital
          </span>
        </Link>

        {invitation && status ? (
          <div className="flex flex-col gap-0.5 rounded-lg bg-kertas p-3">
            <span className="text-xs text-redup">Undangan</span>
            <span className="font-medium">
              {invitation.groomName} &amp; {invitation.brideName}
            </span>
            <span
              className={`mt-1 self-start rounded-full px-2 py-0.5 text-xs font-medium ${status.kelas}`}
            >
              {status.label}
            </span>
          </div>
        ) : null}

        {invitation ? <SidebarNav items={NAV_DENGAN_UNDANGAN} /> : null}

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-garis-halus pt-4 lg:flex-col lg:items-stretch">
          <div className="flex min-w-0 flex-col px-1">
            <span className="truncate text-sm font-medium">{user.name}</span>
            <span className="truncate text-xs text-redup">{user.email}</span>
          </div>
          <TombolKeluar />
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-5 pt-7 pb-16 sm:px-7">{children}</main>
    </div>
  );
}
