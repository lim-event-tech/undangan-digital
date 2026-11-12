import type { Metadata } from "next";
import Link from "next/link";
import { Halaman, JudulAdmin, Notifikasi, satu } from "@/components/admin-ui";
import { kartu } from "@/components/ui";
import { db } from "@/db";
import { requireAdmin } from "@/lib/admin/guard";
import { getPlatformStats } from "@/lib/admin/queries";
import { formatShortDay } from "@/lib/datetime";
import { TEMPLATES } from "@/templates/registry";

export const metadata: Metadata = { title: "Ringkasan" };

const RENTANG = [7, 14, 30] as const;

function labelTemplate(key: string): string {
  return TEMPLATES.find((t) => t.key === key)?.label ?? key;
}

function persen(bagian: number, total: number): number {
  return total > 0 ? Math.round((bagian / total) * 100) : 0;
}

export default async function RingkasanAdminPage({ searchParams }: PageProps<"/admin">) {
  await requireAdmin();
  const sp = await searchParams;
  const hariParam = Number(satu(sp.hari));
  const hari = (RENTANG as readonly number[]).includes(hariParam) ? hariParam : 14;
  const stats = await getPlatformStats(db, hari);

  const puncak = Math.max(1, ...stats.daily.map((d) => Math.max(d.opened, d.rsvp)));
  const pertama = stats.funnel[0]?.count ?? 0;

  const kpi = [
    { label: "Akun pengguna", nilai: stats.accounts, catatan: `+${stats.newAccounts} dalam ${hari} hari` },
    { label: "Undangan terbit", nilai: stats.published, catatan: `dari ${stats.invitations} undangan dibuat` },
    { label: "Link tamu dibuka", nilai: stats.opened, catatan: `${hari} hari terakhir` },
    { label: "Tamu menjawab RSVP", nilai: stats.rsvps, catatan: `${hari} hari terakhir` },
  ];

  return (
    <Halaman>
      {sp.galat === "izin" ? (
        <Notifikasi jenis="galat">Peran Anda tidak punya izin untuk tindakan itu.</Notifikasi>
      ) : null}

      <JudulAdmin
        bagian="Ikhtisar"
        judul="Ringkasan platform"
        keterangan="Kesehatan LIM-RSVP dalam satu layar: pertumbuhan, aktivitas tamu, dan corong pengguna."
        aksi={
          <nav aria-label="Rentang waktu" className="flex gap-2">
            {RENTANG.map((r) => (
              <Link
                key={r}
                href={`/admin?hari=${r}`}
                aria-current={r === hari ? "page" : undefined}
                className={`inline-flex min-h-10 items-center rounded-full border px-3.5 text-[13px] font-medium no-underline ${
                  r === hari
                    ? "border-tinta bg-tinta text-white"
                    : "border-garis-input bg-white text-tinta-2 hover:bg-kertas"
                }`}
              >
                {r} hari
              </Link>
            ))}
          </nav>
        }
      />

      <dl className="m-0 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpi.map((item) => (
          <div key={item.label} className={`${kartu} flex flex-col gap-1 p-4`}>
            <dt className="text-xs text-redup">{item.label}</dt>
            <dd className="m-0 font-judul text-[38px] leading-none font-medium lining-nums">
              {item.nilai.toLocaleString("id-ID")}
            </dd>
            <dd className="m-0 text-xs text-redup">{item.catatan}</dd>
          </div>
        ))}
      </dl>

      <div className="grid gap-4 lg:grid-cols-5">
        <section aria-labelledby="judul-aktivitas" className={`${kartu} flex flex-col gap-4 p-5 lg:col-span-3`}>
          <div>
            <h2 id="judul-aktivitas" className="m-0 font-judul text-2xl font-medium">
              Aktivitas tamu
            </h2>
            <p className="mt-1 mb-0 text-xs text-redup">
              <span className="mr-1.5 inline-block size-2 rounded-full bg-emas-muda" aria-hidden="true" />
              Link dibuka
              <span className="mr-1.5 ml-4 inline-block size-2 rounded-full bg-hijau" aria-hidden="true" />
              Tamu menjawab (hari WIB)
            </p>
          </div>
          <div
            role="img"
            aria-label={`Aktivitas tamu ${hari} hari: ${stats.opened} link dibuka, ${stats.rsvps} tamu menjawab`}
            className="flex h-44 items-end gap-0.5 border-b border-garis"
          >
            {stats.daily.map((d) => (
              <div
                key={d.date}
                title={`${formatShortDay(d.date)}: ${d.opened} link dibuka, ${d.rsvp} menjawab`}
                className="flex h-full min-w-[3px] flex-1 items-end gap-px"
              >
                <div
                  className="w-1/2 rounded-t-sm bg-emas-muda"
                  style={{ height: d.opened > 0 ? `${Math.max(3, (d.opened / puncak) * 100)}%` : "0" }}
                />
                <div
                  className="w-1/2 rounded-t-sm bg-hijau"
                  style={{ height: d.rsvp > 0 ? `${Math.max(3, (d.rsvp / puncak) * 100)}%` : "0" }}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-redup lining-nums">
            <span>{formatShortDay(stats.daily[0].date)}</span>
            <span>Puncak {puncak} dalam sehari</span>
            <span>{formatShortDay(stats.daily[stats.daily.length - 1].date)}</span>
          </div>
        </section>

        <section aria-labelledby="judul-corong" className={`${kartu} flex flex-col gap-4 p-5 lg:col-span-2`}>
          <div>
            <h2 id="judul-corong" className="m-0 font-judul text-2xl font-medium">
              Corong pengguna
            </h2>
            <p className="mt-1 mb-0 text-xs text-redup">Dari daftar sampai menerima RSVP pertama</p>
          </div>
          <ol className="m-0 flex list-none flex-col gap-3 p-0">
            {stats.funnel.map((langkah) => (
              <li key={langkah.key} className="flex flex-col gap-1">
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="text-redup-2">{langkah.label}</span>
                  <span className="font-medium lining-nums">
                    {langkah.count}
                    <span className="ml-1.5 text-xs font-normal text-redup">{persen(langkah.count, pertama)}%</span>
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-krem-2">
                  <div
                    className="h-full rounded-full bg-emas-muda"
                    style={{
                      width: `${pertama > 0 ? (langkah.count / pertama) * 100 : 0}%`,
                      minWidth: langkah.count > 0 ? "4px" : undefined,
                    }}
                  />
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <div className="grid gap-4">
        <section aria-labelledby="judul-template" className={`${kartu} flex flex-col gap-3 p-5`}>
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="judul-template" className="m-0 font-judul text-2xl font-medium">
              Template terpakai
            </h2>
            <Link href="/admin/template" className="text-sm font-medium text-emas">
              Kelola
            </Link>
          </div>
          {stats.templates.length === 0 ? (
            <p className="m-0 rounded-lg bg-krem-2/60 p-4 text-sm text-redup-2">Belum ada undangan.</p>
          ) : (
            <ul className="m-0 flex list-none flex-col p-0">
              {stats.templates.map((item) => (
                <li
                  key={item.key}
                  className="flex items-center justify-between border-t border-garis-halus py-2.5 text-sm first:border-t-0"
                >
                  <span>{labelTemplate(item.key)}</span>
                  <span className="font-medium lining-nums">{item.count} undangan</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </Halaman>
  );
}
