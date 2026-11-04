import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import {
  Halaman,
  JudulAdmin,
  LencanaUndangan,
  Penomoran,
  angka,
  bangunQuery,
  satu,
} from "@/components/admin-ui";
import { kartu, tombolTerang } from "@/components/ui";
import { TombolUnduh } from "@/components/tombol-unduh";
import { db } from "@/db";
import { requireAdmin } from "@/lib/admin/guard";
import { isInvitationSort, listInvitationsAdmin, type InvitationStatus } from "@/lib/admin/queries";
import { formatDate } from "@/lib/datetime";
import { TEMPLATES } from "@/templates/registry";

export const metadata: Metadata = { title: "Undangan" };

const STATUS: { key: InvitationStatus; label: string }[] = [
  { key: "terbit", label: "Terbit" },
  { key: "draf", label: "Draf" },
  { key: "ditangguhkan", label: "Ditangguhkan" },
];

const URUTAN = [
  { key: "terbaru", label: "Terbaru dibuat" },
  { key: "terdekat", label: "Acara terdekat" },
  { key: "tamu", label: "Tamu terbanyak" },
  { key: "respons", label: "Respons terendah" },
] as const;

const KOLOM = "min-h-11 rounded-md border border-garis-input bg-white px-2.5 text-sm font-medium text-tinta";

export default async function UndanganAdminPage({ searchParams }: PageProps<"/admin/undangan">) {
  await requireAdmin();
  const sp = await searchParams;
  const q = satu(sp.q)?.slice(0, 100);
  const statusParam = satu(sp.status);
  const status = STATUS.find((s) => s.key === statusParam)?.key;
  const templateParam = satu(sp.template);
  const template = TEMPLATES.find((t) => t.key === templateParam)?.key;
  const urutParam = satu(sp.urut);
  const sort = isInvitationSort(urutParam) ? urutParam : "terbaru";
  const page = angka(satu(sp.halaman));

  const data = await listInvitationsAdmin(db, { q, status, template, sort, page });
  const filter = { q, status, template, urut: sort === "terbaru" ? undefined : sort };
  const disaring = Boolean(q || status || template);

  return (
    <Halaman>
      <JudulAdmin
        bagian="Operasional"
        judul="Undangan"
        keterangan="Telusuri semua undangan, buka detailnya, atau kelola isinya bila peran Anda mengizinkan."
        aksi={
          <TombolUnduh href={`/admin/undangan/ekspor${bangunQuery(filter)}`} />
        }
      />

      <Form
        key={JSON.stringify(filter)}
        action="/admin/undangan"
        className={`${kartu} flex flex-wrap items-end gap-2.5 p-4`}
      >
        <label className="flex min-w-48 flex-[1_1_220px] flex-col gap-1 text-[13px] font-medium text-redup-2">
          Cari
          <input
            type="search"
            name="q"
            defaultValue={q ?? ""}
            placeholder="Judul event, slug, atau email pemilik"
            className="min-h-11 rounded-md border border-garis-input bg-white px-3 text-sm font-normal text-tinta focus:border-emas-muda focus:ring-3 focus:ring-emas-muda/20 focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-1 text-[13px] font-medium text-redup-2">
          Status
          <select name="status" defaultValue={status ?? ""} className={KOLOM}>
            <option value="">Semua</option>
            {STATUS.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[13px] font-medium text-redup-2">
          Template
          <select name="template" defaultValue={template ?? ""} className={KOLOM}>
            <option value="">Semua</option>
            {TEMPLATES.map((t) => (
              <option key={t.key} value={t.key}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[13px] font-medium text-redup-2">
          Urutkan
          <select name="urut" defaultValue={sort} className={KOLOM}>
            {URUTAN.map((u) => (
              <option key={u.key} value={u.key}>
                {u.label}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className={tombolTerang}>
          Terapkan
        </button>
        {disaring ? (
          <Link href="/admin/undangan" className="inline-flex min-h-11 items-center px-1 text-sm font-medium text-emas">
            Atur ulang
          </Link>
        ) : null}
      </Form>

      <p className="m-0 text-[13px] text-redup" role="status">
        {data.total} undangan{disaring ? " cocok dengan saringan" : ""}
      </p>

      {data.rows.length === 0 ? (
        <div className={`${kartu} p-10 text-center text-sm text-redup-2`}>
          Tidak ada undangan yang cocok dengan pencarian ini.
        </div>
      ) : (
        <>
          <div className={`${kartu} hidden overflow-x-auto md:block`}>
            <table className="w-full min-w-190 border-collapse text-sm">
              <thead>
                <tr className="bg-kertas text-left text-xs tracking-[0.06em] text-redup-2 uppercase">
                  <th scope="col" className="px-3 py-3 font-medium">Undangan</th>
                  <th scope="col" className="px-3 py-3 font-medium">Pemilik</th>
                  <th scope="col" className="px-3 py-3 font-medium">Acara</th>
                  <th scope="col" className="px-3 py-3 font-medium">Tamu dan respons</th>
                  <th scope="col" className="px-3 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row) => (
                  <tr key={row.id} className="border-t border-garis-halus align-top">
                    <td className="px-3 py-3">
                      <Link href={`/admin/undangan/${row.id}`} className="font-medium text-tinta">
                        {row.title}
                      </Link>
                      <span className="block text-xs text-redup">
                        /{row.slug} · {TEMPLATES.find((t) => t.key === row.templateKey)?.label ?? row.templateKey}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-[13px]">
                      {row.ownerName}
                      <span className="block text-xs text-redup">{row.ownerEmail}</span>
                    </td>
                    <td className="px-3 py-3 text-[13px] whitespace-nowrap">
                      {row.eventDate ? formatDate(row.eventDate) : "—"}
                    </td>
                    <td className="px-3 py-3 text-[13px] lining-nums">
                      {row.guests} tamu
                      <span className="block text-xs text-redup">
                        {row.sent} terkirim · {row.opened} dibuka · {row.responded} menjawab
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <LencanaUndangan status={row.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="m-0 flex list-none flex-col gap-3 p-0 md:hidden">
            {data.rows.map((row) => (
              <li key={row.id} className={`${kartu} flex flex-col gap-2 p-4`}>
                <div className="flex items-start justify-between gap-3">
                  <Link href={`/admin/undangan/${row.id}`} className="font-medium text-tinta">
                    {row.title}
                  </Link>
                  <LencanaUndangan status={row.status} />
                </div>
                <span className="text-xs text-redup">
                  /{row.slug} · {row.ownerEmail}
                </span>
                <span className="text-[13px] lining-nums">
                  {row.guests} tamu · {row.sent} terkirim · {row.opened} dibuka · {row.responded} menjawab
                </span>
                <span className="text-xs text-redup">
                  Acara {row.eventDate ? formatDate(row.eventDate) : "belum bertanggal"}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}

      <Penomoran
        halaman={data.page}
        total={data.total}
        ukuran={data.pageSize}
        href={(p) => `/admin/undangan${bangunQuery({ ...filter, halaman: String(p) })}`}
      />
    </Halaman>
  );
}
