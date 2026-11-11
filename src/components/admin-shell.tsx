import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { SidebarNav, type ItemNav } from "@/components/sidebar-nav";
import { TombolKeluar } from "@/components/tombol-keluar";
import { can, type Permission } from "@/lib/admin/roles";

export function AdminShell({
  admin,
  children,
}: {
  admin: { name: string; email: string; roleLabel: string; permissions: Permission[] };
  children: React.ReactNode;
}) {
  const nav: ItemNav[] = [
    { label: "Ringkasan", ikon: "dasbor", href: "/admin", tepat: true },
    { label: "Undangan", ikon: "surat", href: "/admin/undangan" },
    { label: "Akun pengguna", ikon: "tamu", href: "/admin/pengguna" },
    { label: "Template", ikon: "templat", href: "/admin/template" },
    { label: "Pengaturan", ikon: "kunci", href: "/admin/pengaturan" },
    { label: "WhatsApp", ikon: "kirim", href: "/admin/whatsapp" },
    { label: "Surel (SMTP)", ikon: "surat", href: "/admin/surel" },
    { label: "Tim & log audit", ikon: "berkas", href: "/admin/tim" },
    ...(can(admin, "tim") ? [{ label: "Peran & izin", ikon: "kunci" as const, href: "/admin/peran" }] : []),
  ];

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <aside className="flex flex-col gap-4 border-b border-garis bg-white p-4 lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:shrink-0 lg:overflow-y-auto lg:border-r lg:border-b-0">
        <Link href="/admin" aria-label="LingkarIDE Manajemen, admin UndanganDigital" className="flex flex-col items-start gap-2 px-2 text-tinta no-underline">
          <BrandLogo height={36} />
          <span className="text-[11px] tracking-[0.14em] text-redup uppercase">Admin global</span>
        </Link>

        <SidebarNav items={nav} />

        <div className="mt-auto flex flex-col gap-3 border-t border-garis-halus pt-4">
          <div className="flex min-w-0 flex-col px-1">
            <span className="truncate text-sm font-medium">{admin.name}</span>
            <span className="truncate text-xs text-redup">{admin.email}</span>
            <span className="mt-1.5 self-start rounded-full bg-krem px-2 py-0.5 text-xs font-medium text-emas-tua">
              {admin.roleLabel}
            </span>
          </div>
          <TombolKeluar tujuan="/admin/masuk" />
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-5 pt-7 pb-16 sm:px-7">{children}</main>
    </div>
  );
}
