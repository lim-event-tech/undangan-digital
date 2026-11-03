import type { Metadata } from "next";
import Link from "next/link";
import { Halaman, JudulAdmin } from "@/components/admin-ui";
import { kartu } from "@/components/ui";
import { db } from "@/db";
import { requireAdmin } from "@/lib/admin/guard";
import { listRoles } from "@/lib/admin/role-service";
import { PERMISSION_INFO, PERMISSIONS, SUPER_ROLE } from "@/lib/admin/roles";
import { FormPeran, FormPeranBaru, TombolHapusPeran } from "./form-peran";

export const metadata: Metadata = { title: "Peran dan izin" };

export default async function PeranAdminPage() {
  await requireAdmin("tim");
  const peran = await listRoles(db);

  return (
    <Halaman>
      <JudulAdmin
        bagian="Platform"
        judul="Peran dan izin"
        keterangan="Atur apa yang boleh dilakukan tiap peran, atau buat peran baru. Perubahan berlaku segera. Hanya Super admin yang bisa membuka halaman ini."
      />

      {peran.map((item) => (
        <section
          key={item.key}
          aria-labelledby={`peran-${item.key}`}
          className={`${kartu} flex flex-col gap-4 p-5`}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 id={`peran-${item.key}`} className="m-0 font-judul text-2xl font-medium">
                {item.label}
              </h2>
              <p className="mt-1 mb-0 text-sm text-redup">
                {item.members} anggota tim
                {item.key === SUPER_ROLE ? " · selalu punya semua izin dan tidak bisa diubah" : ""}
              </p>
            </div>
            {item.key !== SUPER_ROLE && item.members === 0 ? (
              <TombolHapusPeran peran={item.key} nama={item.label} />
            ) : null}
            {item.key !== SUPER_ROLE && item.members > 0 ? (
              <p className="m-0 max-w-64 text-sm text-redup">
                Untuk menghapus peran ini, pindahkan {item.members} anggotanya ke peran lain di{" "}
                <Link href="/admin/tim" className="font-medium text-emas">
                  halaman Tim
                </Link>
                .
              </p>
            ) : null}
          </div>
          {item.key === SUPER_ROLE ? (
            <ul className="m-0 grid list-none gap-1.5 p-0 text-sm sm:grid-cols-2">
              {PERMISSIONS.map((izin) => (
                <li key={izin} className="text-redup-2">
                  <span className="mr-1.5 font-medium text-hijau">Boleh</span>
                  {PERMISSION_INFO[izin].label}
                </li>
              ))}
            </ul>
          ) : (
            <FormPeran peran={item.key} label={item.label} izin={item.permissions} anggota={item.members} />
          )}
        </section>
      ))}

      <section aria-labelledby="judul-peran-baru" className={`${kartu} flex flex-col gap-4 p-5`}>
        <div>
          <h2 id="judul-peran-baru" className="m-0 font-judul text-2xl font-medium">
            Tambah peran
          </h2>
          <p className="mt-1 mb-0 text-sm text-redup">
            Peran baru langsung bisa dipilih saat menambah atau mengubah anggota tim.
          </p>
        </div>
        <FormPeranBaru />
      </section>
    </Halaman>
  );
}
