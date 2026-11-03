import type { Metadata } from "next";
import { Halaman, JudulAdmin, Notifikasi } from "@/components/admin-ui";
import { db } from "@/db";
import { requireAdmin } from "@/lib/admin/guard";
import { can } from "@/lib/admin/roles";
import { getSettings } from "@/lib/platform/service";
import { FormPengaturan } from "./form-pengaturan";

export const metadata: Metadata = { title: "Pengaturan" };

export default async function PengaturanAdminPage() {
  const admin = await requireAdmin();
  const pengaturan = await getSettings(db);

  return (
    <Halaman>
      <JudulAdmin
        bagian="Platform"
        judul="Pengaturan platform"
        keterangan="Berlaku untuk semua pasangan dan tamu. Setiap perubahan tercatat di log audit."
      />
      {can(admin, "pengaturan") ? (
        <FormPengaturan pengaturan={pengaturan} />
      ) : (
        <Notifikasi jenis="info">Hanya Super admin yang bisa mengubah pengaturan platform.</Notifikasi>
      )}
    </Halaman>
  );
}
