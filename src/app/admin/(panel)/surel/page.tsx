import type { Metadata } from "next";
import { Halaman, JudulAdmin, Notifikasi } from "@/components/admin-ui";
import { kartu } from "@/components/ui";
import { db } from "@/db";
import { requireAdmin } from "@/lib/admin/guard";
import { can } from "@/lib/admin/roles";
import { getSmtpView } from "@/lib/mail/service";
import { FormSurel, FormUjiSurel } from "./form-surel";

export const metadata: Metadata = { title: "Surel (SMTP)" };

export default async function SurelAdminPage() {
  const admin = await requireAdmin();
  const config = await getSmtpView(db);
  const boleh = can(admin, "pengaturan");
  const siap = config.aktif && config.host !== "" && config.dariEmail !== "";

  return (
    <Halaman>
      <JudulAdmin
        bagian="Platform"
        judul="Surel (SMTP)"
        keterangan="Pengiriman surel keluar, dipakai untuk undangan anggota tim. Setiap perubahan tercatat di log audit."
      />
      {boleh ? (
        <>
          <section className={`${kartu} flex flex-col gap-4 p-5`}>
            <FormSurel config={config} />
          </section>
          <section className={`${kartu} flex flex-col gap-4 p-5`}>
            <h2 className="m-0 font-judul text-2xl font-medium">Uji pengiriman</h2>
            <FormUjiSurel tujuan={admin.email} siap={siap} />
          </section>
        </>
      ) : (
        <Notifikasi jenis="info">Hanya Super admin yang bisa mengubah pengaturan surel.</Notifikasi>
      )}
    </Halaman>
  );
}
