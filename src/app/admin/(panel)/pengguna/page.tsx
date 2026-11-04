import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import {
  Halaman,
  JudulAdmin,
  LencanaAkun,
  LencanaUndangan,
  Penomoran,
  angka,
  bangunQuery,
  satu,
} from "@/components/admin-ui";
import { kartu, tombolBahaya, tombolTerang } from "@/components/ui";
import { db } from "@/db";
import { requireAdmin } from "@/lib/admin/guard";
import { getAccountStats, isAccountStatus, listAccounts } from "@/lib/admin/queries";
import { can } from "@/lib/admin/roles";
import { formatStamp } from "@/lib/datetime";
import { ubahStatusAkunAction } from "./actions";
import { FormAkun } from "./form-akun";

export const metadata: Metadata = { title: "Akun pengguna" };

const KOLOM = "min-h-11 rounded-md border border-garis-input bg-white px-2.5 text-sm font-medium text-tinta";

export default async function PenggunaAdminPage({ searchParams }: PageProps<"/admin/pengguna">) {
  const admin = await requireAdmin();
  const sp = await searchParams;
  const q = satu(sp.q)?.slice(0, 100);
  const metodeParam = satu(sp.metode);
  const method = metodeParam === "google" || metodeParam === "email" ? metodeParam : undefined;
  const statusParam = satu(sp.status);
  const status = isAccountStatus(statusParam) ? statusParam : undefined;
  const page = angka(satu(sp.halaman));

  const [stats, data] = await Promise.all([
    getAccountStats(db),
    listAccounts(db, { q, method, status, page }),
  ]);
  const bolehBlokir = can(admin, "tangguhkan");
  const bolehKelola = can(admin, "kelola-akun");
  const filter = { q, metode: method, status };
  const disaring = Boolean(q || method || status);

  const kartuAngka = [
    { label: "Total akun", nilai: stats.total, ket: `${stats.google} Google · ${stats.email} email` },
    { label: "Aktif 7 hari", nilai: stats.active7, ket: `${stats.total > 0 ? Math.round((stats.active7 / stats.total) * 100) : 0}% dari semua akun` },
    { label: "Diblokir", nilai: stats.blocked, ket: "diblokir oleh admin" },
  ];

  return (
    <Halaman>
      <JudulAdmin
        bagian="Operasional"
        judul="Akun pengguna"
        keterangan="Blokir akun yang melanggar, ubah data akun, atau atur kata sandi baru bila peran Anda mengizinkan. Setiap tindakan tercatat di log audit."
      />

      <dl className="m-0 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {kartuAngka.map((item) => (
          <div key={item.label} className={`${kartu} flex flex-col gap-1 p-4`}>
            <dt className="text-xs text-redup">{item.label}</dt>
            <dd className="m-0 font-judul text-[34px] leading-none font-medium lining-nums">{item.nilai}</dd>
            <dd className="m-0 text-xs text-redup">{item.ket}</dd>
          </div>
        ))}
      </dl>

      <Form
        key={JSON.stringify(filter)}
        action="/admin/pengguna"
        className={`${kartu} flex flex-wrap items-end gap-2.5 p-4`}
      >
        <label className="flex min-w-48 flex-[1_1_220px] flex-col gap-1 text-[13px] font-medium text-redup-2">
          Cari
          <input
            type="search"
            name="q"
            defaultValue={q ?? ""}
            placeholder="Nama atau email"
            className="min-h-11 rounded-md border border-garis-input bg-white px-3 text-sm font-normal text-tinta focus:border-emas-muda focus:ring-3 focus:ring-emas-muda/20 focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-[13px] font-medium text-redup-2">
          Masuk via
          <select name="metode" defaultValue={method ?? ""} className={KOLOM}>
            <option value="">Semua</option>
            <option value="google">Google</option>
            <option value="email">Email</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[13px] font-medium text-redup-2">
          Status
          <select name="status" defaultValue={status ?? ""} className={KOLOM}>
            <option value="">Semua</option>
            <option value="aktif">Aktif</option>
            <option value="diblokir">Diblokir</option>
          </select>
        </label>
        <button type="submit" className={tombolTerang}>
          Terapkan
        </button>
        {disaring ? (
          <Link href="/admin/pengguna" className="inline-flex min-h-11 items-center px-1 text-sm font-medium text-emas">
            Atur ulang
          </Link>
        ) : null}
      </Form>

      <p className="m-0 text-[13px] text-redup" role="status">
        Menampilkan {data.rows.length} dari {data.total} akun
      </p>

      {data.rows.length === 0 ? (
        <div className={`${kartu} p-10 text-center text-sm text-redup-2`}>Tidak ada akun yang cocok.</div>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {data.rows.map((row) => (
            <li key={row.id} className={`${kartu} flex flex-col gap-3 p-4`}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 flex-col gap-0.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{row.name}</span>
                  <LencanaAkun status={row.status} />
                </div>
                <span className="text-sm text-redup">{row.email}</span>
                <span className="text-xs text-redup">
                  Masuk via {row.methods.join(", ") || "—"} · dibuat {formatStamp(row.createdAt)} · terakhir aktif{" "}
                  {row.lastActive ? formatStamp(row.lastActive) : "belum pernah"}
                </span>
                {row.invitationId ? (
                  <span className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                    <Link href={`/admin/undangan/${row.invitationId}`} className="font-medium text-emas">
                      {row.invitationName}
                    </Link>
                    {row.invitationStatus ? <LencanaUndangan status={row.invitationStatus} /> : null}
                  </span>
                ) : (
                  <span className="mt-1 text-xs text-redup">Belum membuat undangan</span>
                )}
              </div>
              {bolehBlokir ? (
                <form action={ubahStatusAkunAction} className="shrink-0">
                  <input type="hidden" name="id" value={row.id} />
                  <input type="hidden" name="status" value={row.status === "aktif" ? "diblokir" : "aktif"} />
                  <button type="submit" className={row.status === "aktif" ? tombolBahaya : tombolTerang}>
                    {row.status === "aktif" ? "Blokir akun" : "Buka blokir"}
                  </button>
                </form>
              ) : null}
              </div>
              {bolehKelola ? <FormAkun id={row.id} nama={row.name} email={row.email} /> : null}
            </li>
          ))}
        </ul>
      )}

      <Penomoran
        halaman={data.page}
        total={data.total}
        ukuran={data.pageSize}
        href={(p) => `/admin/pengguna${bangunQuery({ ...filter, halaman: String(p) })}`}
      />
    </Halaman>
  );
}
