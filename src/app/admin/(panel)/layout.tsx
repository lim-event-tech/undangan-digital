import type { Metadata } from "next";
import { AdminShell } from "@/components/admin-shell";
import { requireAdmin } from "@/lib/admin/guard";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin" } };

export default async function AdminPanelLayout({ children }: LayoutProps<"/admin">) {
  const admin = await requireAdmin();

  return (
    <AdminShell admin={admin}>
      {children}
    </AdminShell>
  );
}
