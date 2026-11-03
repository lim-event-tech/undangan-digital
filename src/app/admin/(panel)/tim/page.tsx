import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { Halaman, JudulAdmin, bangunQuery, satu } from "@/components/admin-ui";
import { TombolUnduh } from "@/components/tombol-unduh";
import { kartu, tombolTerang } from "@/components/ui";
import { db } from "@/db";
import {
  AUDIT_CATEGORIES,
  AUDIT_CATEGORY_LABEL,
  labelKategori,
  isAuditCategory,
  listAudit,
  listAuditActors,
} from "@/lib/admin/audit";
import { requireAdmin } from "@/lib/admin/guard";
import { listRoles } from "@/lib/admin/role-service";
import { can } from "@/lib/admin/roles";
import { listAdmins } from "@/lib/admin/team";
import { formatStamp } from "@/lib/datetime";
import { ubahPeranAction } from "./actions";
import { FormGantiSandi, FormTambahAdmin, TombolCabut } from "./form-tim";

export const metadata: Metadata = { title: "Tim dan log audit" };

const KOLOM = "min-h-11 rounded-md border border-garis-input bg-white px-2.5 text-sm font-medium text-tinta";

export default async function TimAdminPage({ searchParams }: PageProps<"/admin/tim">) {
  const admin = await requireAdmin();
  const sp = await searchParams;
  const pelaku = satu(sp.pelaku);
  const jenisParam = satu(sp.jenis);
  const jenis = isAuditCategory(jenisParam) ? jenisParam : undefined;
  const hariParam = Number(satu(sp.hari));
  const hari = hariParam === 7 || hariParam === 30 ? hariParam : undefined;

  const [anggota, peran, aktor, log] = await Promise.all([
    listAdmins(db),
    listRoles(db),
    listAuditActors(db),
    listAudit(db, { actorName: pelaku, category: jenis, sinceDays: hari, limit: 200 }),
  ]);
  const kelola = can(admin, "tim");
  const filter = { pelaku, jenis, hari: hari ? String(hari) : undefined };

  return (
    <Halaman>
      <JudulAdmin
        bagian="Platform"
        judul="Tim dan log audit"
        keterangan="Siapa yang punya akses admin dan jejak setiap tindakan. Izin tiap peran diatur di halaman Peran dan izin."
      />

      <section aria-labelledby="judul-tim" className={`${kartu} flex flex-col gap-4 p-5`}>
        <h2 id="judul-tim" className="m-0 font-judul text-2xl font-medium">
          Tim admin
        </h2>
        <ul className="m-0 flex list-none flex-col p-0">
          {anggota.map((member) => {
            const diri = member.id === admin.id;
            return (
              <li
                key={member.id}
                className="flex flex-col gap-3 border-t border-garis-halus py-4 first:border-t-0 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="font-medium">
                    {member.name}
                    {diri ? <span className="ml-1.5 text-xs font-normal text-redup">(Anda)</span> : null}
                  </span>
                  <span className="text-sm text-redup">{member.email}</span>
                  <span className="text-xs text-redup">
                    {member.roleLabel} · masuk dengan {member.methods.join(" dan ") || "Google"} · terakhir aktif{" "}
                    {member.lastActive ? formatStamp(member.lastActive) : "belum pernah"}
                  </span>
                  {kelola ? <FormGantiSandi id={member.id} nama={member.name} /> : null}
                </div>
                {kelola ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <form action={ubahPeranAction} className="flex items-center gap-2">
                      <input type="hidden" name="id" value={member.id} />
                      <label className="sr-only" htmlFor={`peran-${member.id}`}>
                        Peran {member.name}
                      </label>
                      <select id={`peran-${member.id}`} name="peran" defaultValue={member.role} className={KOLOM}>
                        {peran.map((role) => (
                          <option key={role.key} value={role.key}>
                            {role.label}
                          </option>
                        ))}
                      </select>
                      <button type="submit" className={tombolTerang}>
                        Ubah peran
                      </button>
                    </form>
                    {diri ? null : <TombolCabut id={member.id} nama={member.name} />}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      </section>

      {kelola ? (
        <section aria-labelledby="judul-tambah" className={`${kartu} flex flex-col gap-4 p-5`}>
          <div>
            <h2 id="judul-tambah" className="m-0 font-judul text-2xl font-medium">
              Tambah admin
            </h2>
            <p className="mt-1 mb-0 text-sm text-redup">
              Daftarkan email Google admin agar bisa masuk lewat tombol Masuk dengan Google di halaman Masuk admin,
              atau beri kata sandi awal. Belum ada layanan email, jadi tidak ada undangan lewat email.
            </p>
          </div>
          <FormTambahAdmin peran={peran.map((role) => ({ key: role.key, label: role.label }))} />
        </section>
      ) : null}

      <section id="log" aria-labelledby="judul-log" className={`${kartu} flex scroll-mt-6 flex-col gap-4 p-5`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 id="judul-log" className="m-0 font-judul text-2xl font-medium">
              Log audit
            </h2>
            <p className="mt-1 mb-0 text-sm text-redup">
              Tidak bisa diubah atau dihapus, termasuk oleh Super admin.
            </p>
          </div>
          <TombolUnduh href={`/admin/tim/ekspor${bangunQuery(filter)}`} />
        </div>

        <Form key={JSON.stringify(filter)} action="/admin/tim#log" className="flex flex-wrap items-end gap-2.5">
          <label className="flex flex-col gap-1 text-[13px] font-medium text-redup-2">
            Pelaku
            <select name="pelaku" defaultValue={pelaku ?? ""} className={KOLOM}>
              <option value="">Semua pelaku</option>
              {aktor.map((nama) => (
                <option key={nama} value={nama}>
                  {nama}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-[13px] font-medium text-redup-2">
            Jenis tindakan
            <select name="jenis" defaultValue={jenis ?? ""} className={KOLOM}>
              <option value="">Semua tindakan</option>
              {AUDIT_CATEGORIES.map((kategori) => (
                <option key={kategori} value={kategori}>
                  {AUDIT_CATEGORY_LABEL[kategori]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-[13px] font-medium text-redup-2">
            Rentang
            <select name="hari" defaultValue={hari ? String(hari) : ""} className={KOLOM}>
              <option value="7">7 hari</option>
              <option value="30">30 hari</option>
              <option value="">Semua</option>
            </select>
          </label>
          <button type="submit" className={tombolTerang}>
            Terapkan
          </button>
          {pelaku || jenis || hari ? (
            <Link href="/admin/tim#log" className="inline-flex min-h-11 items-center px-1 text-sm font-medium text-emas">
              Atur ulang
            </Link>
          ) : null}
        </Form>

        {log.length === 0 ? (
          <p className="m-0 rounded-lg bg-krem-2/60 p-6 text-center text-sm text-redup-2">
            Belum ada tindakan yang cocok.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-170 border-collapse text-sm">
              <thead>
                <tr className="bg-kertas text-left text-xs tracking-[0.06em] text-redup-2 uppercase">
                  <th scope="col" className="px-3 py-3 font-medium">Waktu</th>
                  <th scope="col" className="px-3 py-3 font-medium">Pelaku</th>
                  <th scope="col" className="px-3 py-3 font-medium">Tindakan</th>
                  <th scope="col" className="px-3 py-3 font-medium">Target</th>
                  <th scope="col" className="px-3 py-3 font-medium">Rincian</th>
                </tr>
              </thead>
              <tbody>
                {log.map((entry) => (
                  <tr key={entry.id} className="border-t border-garis-halus align-top">
                    <td className="px-3 py-2.5 text-[13px] whitespace-nowrap text-redup-2">{formatStamp(entry.createdAt)}</td>
                    <td className="px-3 py-2.5 text-[13px] font-medium">{entry.actorName}</td>
                    <td className="px-3 py-2.5 text-[13px]">
                      {entry.action}
                      <span className="block text-xs text-redup">{labelKategori(entry.category)}</span>
                    </td>
                    <td className="px-3 py-2.5 text-[13px] break-all">{entry.target || "—"}</td>
                    <td className="px-3 py-2.5 text-[13px] text-redup-2">{entry.detail || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="m-0 text-xs text-redup">Menampilkan {log.length} tindakan terbaru yang cocok.</p>
      </section>
    </Halaman>
  );
}
