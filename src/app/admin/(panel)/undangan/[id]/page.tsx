import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Halaman, JudulAdmin, LencanaAkun, LencanaUndangan } from "@/components/admin-ui";
import { TombolUnduh } from "@/components/tombol-unduh";
import { kartu, tombolBahaya, tombolGelap, tombolTerang } from "@/components/ui";
import { db } from "@/db";
import { listAudit } from "@/lib/admin/audit";
import { requireAdmin } from "@/lib/admin/guard";
import { getInvitationAdmin } from "@/lib/admin/queries";
import { can } from "@/lib/admin/roles";
import { dateFromDeadline, formatDate, formatStamp, todayWib } from "@/lib/datetime";
import { formatPhone } from "@/lib/phone";
import { getDashboard, type GuestStatus } from "@/lib/rsvp/dashboard";
import { isUuid } from "@/lib/uuid";
import { TEMPLATES } from "@/templates/registry";
import { mulaiKelolaAction } from "@/app/undangan/kelola-actions";
import { ubahStatusAction } from "./actions";
import { FormBatasAdmin, FormHapus, FormSlugAdmin } from "./form-detail";

const STATUS_TAMU: Record<GuestStatus, string> = {
  hadir: "Hadir",
  tidak: "Tidak hadir",
  belum: "Belum menjawab",
};

export const metadata: Metadata = { title: "Detail undangan" };

export default async function DetailUndanganAdminPage({ params }: PageProps<"/admin/undangan/[id]">) {
  const admin = await requireAdmin();
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const detail = await getInvitationAdmin(db, id);
  if (!detail) notFound();

  const bolehLihatTamu = can(admin, "lihat-tamu");
  const [riwayat, tamu] = await Promise.all([
    listAudit(db, { target: `/u/${detail.slug}`, limit: 20 }),
    bolehLihatTamu ? getDashboard(db, id, {}) : null,
  ]);
  const bolehUbah = can(admin, "ubah-undangan");
  const bolehTangguhkan = can(admin, "tangguhkan");
  const bolehHapus = can(admin, "hapus");
  const bolehKelola = can(admin, "kelola-undangan");
  const templateLabel = TEMPLATES.find((t) => t.key === detail.templateKey)?.label ?? detail.templateKey;

  const ringkasan: [string, string | number][] = [
    ["Acara", detail.events],
    ["Tamu", detail.guests],
    ["Ditandai terkirim", detail.sent],
    ["Link dibuka", detail.opened],
    ["Tamu menjawab", detail.responded],
    ["Check-in", detail.checkedIn],
    ["Foto", `${detail.photos} / 13`],
  ];

  const pemeriksaan: string[] = [];
  if (detail.status === "terbit" && detail.sent === 0) {
    pemeriksaan.push(`Terbit tetapi belum ada link yang ditandai terkirim (${detail.guests} tamu terimpor).`);
  }
  if (detail.missing.length > 0) {
    pemeriksaan.push(`Isian wajib belum lengkap: ${detail.missing.join(", ")}.`);
  }

  return (
    <Halaman>
      <nav aria-label="Navigasi" className="text-sm text-redup">
        <Link href="/admin/undangan" className="text-emas">
          Undangan
        </Link>{" "}
        / {detail.slug}
      </nav>

      <JudulAdmin
        bagian="Detail undangan"
        judul={`${detail.title}`}
        keterangan={`/${detail.slug} · Template ${templateLabel} · acara ${
          detail.eventDate ? formatDate(detail.eventDate) : "belum bertanggal"
        } · dibuat ${formatStamp(detail.createdAt)}`}
        aksi={<LencanaUndangan status={detail.status} />}
      />

      <dl className="m-0 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {ringkasan.map(([label, nilai]) => (
          <div key={label} className={`${kartu} flex flex-col gap-1 p-3.5`}>
            <dt className="text-xs text-redup">{label}</dt>
            <dd className="m-0 font-judul text-[28px] leading-none font-medium lining-nums">{nilai}</dd>
          </div>
        ))}
      </dl>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <section aria-labelledby="judul-periksa" className={`${kartu} flex flex-col gap-3 p-5`}>
            <h2 id="judul-periksa" className="m-0 font-judul text-2xl font-medium">
              Pemeriksaan
            </h2>
            {pemeriksaan.length === 0 ? (
              <p className="m-0 rounded-lg bg-hijau-bg/60 p-4 text-sm text-hijau">
                Konten lengkap dan tidak ada yang mencurigakan.
              </p>
            ) : (
              <ul className="m-0 flex list-none flex-col gap-2 p-0">
                {pemeriksaan.map((item) => (
                  <li key={item} className="rounded-lg bg-jingga-bg p-3.5 text-sm leading-relaxed text-jingga">
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {tamu ? (
            <section aria-labelledby="judul-tamu" className={`${kartu} flex flex-col gap-3 p-5`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 id="judul-tamu" className="m-0 font-judul text-2xl font-medium">
                  Daftar tamu
                </h2>
                {tamu.guests.length > 0 ? <TombolUnduh href={`/admin/undangan/${detail.id}/tamu`} /> : null}
              </div>
              {tamu.guests.length === 0 ? (
                <p className="m-0 text-sm text-redup">Belum ada tamu.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-150 border-collapse text-sm">
                    <thead>
                      <tr className="bg-kertas text-left text-xs tracking-[0.06em] text-redup-2 uppercase">
                        <th scope="col" className="px-3 py-2.5 font-medium">Nama</th>
                        <th scope="col" className="px-3 py-2.5 font-medium">WhatsApp</th>
                        <th scope="col" className="px-3 py-2.5 font-medium">Grup</th>
                        <th scope="col" className="px-3 py-2.5 font-medium">Status</th>
                        <th scope="col" className="px-3 py-2.5 text-center font-medium">Hadir</th>
                        <th scope="col" className="px-3 py-2.5 font-medium">Terkirim</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tamu.guests.map((g) => (
                        <tr key={g.id} className="border-t border-garis-halus align-top">
                          <td className="px-3 py-2 font-medium">{g.name}</td>
                          <td className="px-3 py-2 whitespace-nowrap">{formatPhone(g.phone)}</td>
                          <td className="px-3 py-2">{g.groupName ?? "—"}</td>
                          <td className="px-3 py-2">{STATUS_TAMU[g.status]}</td>
                          <td className="px-3 py-2 text-center lining-nums">
                            {g.status === "hadir" ? `${g.adults} + ${g.children}` : "—"}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-[13px] text-redup-2">
                            {g.sentAt ? formatStamp(g.sentAt) : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <p className="m-0 text-xs text-redup">
                Data pribadi tamu. Unduhan dicatat di log audit.
              </p>
            </section>
          ) : null}

          <section aria-labelledby="judul-riwayat" className={`${kartu} flex flex-col gap-3 p-5`}>
            <div className="flex items-baseline justify-between gap-3">
              <h2 id="judul-riwayat" className="m-0 font-judul text-2xl font-medium">
                Riwayat tindakan admin
              </h2>
              <Link href="/admin/tim#log" className="text-sm font-medium text-emas">
                Log audit lengkap
              </Link>
            </div>
            {riwayat.length === 0 ? (
              <p className="m-0 text-sm text-redup">Belum ada tindakan admin untuk undangan ini.</p>
            ) : (
              <ul className="m-0 flex list-none flex-col p-0">
                {riwayat.map((entry) => (
                  <li key={entry.id} className="flex flex-col gap-0.5 border-t border-garis-halus py-2.5 first:border-t-0">
                    <span className="text-xs text-redup">
                      {formatStamp(entry.createdAt)} · {entry.actorName}
                    </span>
                    <span className="text-sm font-medium">{entry.action}</span>
                    {entry.detail ? <span className="text-xs text-redup">{entry.detail}</span> : null}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="flex flex-col gap-4">
          <section aria-labelledby="judul-pemilik" className={`${kartu} flex flex-col gap-3 p-5`}>
            <h2 id="judul-pemilik" className="m-0 font-judul text-2xl font-medium">
              Pemilik
            </h2>
            <div className="flex flex-col gap-0.5">
              <span className="font-medium">{detail.ownerName}</span>
              <span className="text-sm text-redup">{detail.ownerEmail}</span>
            </div>
            <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-[13px]">
              <dt className="text-redup">Masuk via</dt>
              <dd className="m-0">{detail.ownerMethods.join(", ") || "—"}</dd>
              <dt className="text-redup">Akun dibuat</dt>
              <dd className="m-0">{formatStamp(detail.ownerCreatedAt)}</dd>
              <dt className="text-redup">Terakhir aktif</dt>
              <dd className="m-0">{detail.ownerLastActive ? formatStamp(detail.ownerLastActive) : "—"}</dd>
              <dt className="text-redup">Status akun</dt>
              <dd className="m-0">
                <LencanaAkun status={detail.ownerStatus} />
              </dd>
            </dl>
            <Link href={`/admin/pengguna?q=${encodeURIComponent(detail.ownerEmail)}`} className="text-sm font-medium text-emas">
              Buka di akun pengguna
            </Link>
          </section>

          {bolehKelola ? (
            <section aria-labelledby="judul-kelola" className={`${kartu} flex flex-col gap-3 p-5`}>
              <h2 id="judul-kelola" className="m-0 font-judul text-2xl font-medium">
                Kelola isi undangan
              </h2>
              <p className="m-0 text-sm leading-relaxed text-redup-2">
                Buka undangan ini seperti pengguna: isi, tamu, RSVP, ucapan, foto, musik, dan pengiriman. Setiap sesi
                kelola tercatat di log audit.
              </p>
              <form action={mulaiKelolaAction}>
                <input type="hidden" name="id" value={detail.id} />
                <button type="submit" className={tombolGelap}>
                  Kelola undangan ini
                </button>
              </form>
            </section>
          ) : null}

          <section aria-labelledby="judul-atur" className={`${kartu} flex flex-col gap-5 p-5`}>
            <h2 id="judul-atur" className="m-0 font-judul text-2xl font-medium">
              Pengaturan undangan
            </h2>
            <FormSlugAdmin id={detail.id} slug={detail.slug} terkunci={detail.slugLocked} boleh={bolehUbah} />
            <FormBatasAdmin id={detail.id} batas={dateFromDeadline(detail.rsvpDeadline)} hariIni={todayWib()} boleh={bolehUbah} />
          </section>

          {bolehTangguhkan || bolehHapus ? (
            <section aria-labelledby="judul-bahaya" className="flex flex-col gap-4 rounded-[10px] border border-galat/40 bg-white p-5">
              <h2 id="judul-bahaya" className="m-0 font-judul text-2xl font-medium text-galat">
                Zona berbahaya
              </h2>
              {bolehTangguhkan ? (
                <form action={ubahStatusAction} className="flex flex-col gap-2">
                  <input type="hidden" name="id" value={detail.id} />
                  <input
                    type="hidden"
                    name="tindakan"
                    value={detail.status === "ditangguhkan" ? "aktifkan" : "tangguhkan"}
                  />
                  <p className="m-0 text-sm leading-relaxed text-redup-2">
                    {detail.status === "ditangguhkan"
                      ? "Undangan sedang ditangguhkan. Mengaktifkan kembali menerbitkannya bila isian lengkap, atau mengembalikannya ke draf."
                      : "Tamu akan melihat “Undangan tidak ditemukan”. Data tetap tersimpan dan bisa diaktifkan lagi."}
                  </p>
                  <div>
                    <button type="submit" className={detail.status === "ditangguhkan" ? tombolTerang : tombolBahaya}>
                      {detail.status === "ditangguhkan" ? "Aktifkan kembali" : "Tangguhkan undangan"}
                    </button>
                  </div>
                </form>
              ) : null}
              {bolehHapus ? (
                <div className="flex flex-col gap-2 border-t border-garis-halus pt-4">
                  <p className="m-0 text-sm leading-relaxed text-redup-2">
                    Menghapus undangan, {detail.guests} tamu, RSVP, ucapan, dan foto. Tidak bisa dibatalkan.
                  </p>
                  <FormHapus id={detail.id} slug={detail.slug} />
                </div>
              ) : null}
            </section>
          ) : null}
        </div>
      </div>
    </Halaman>
  );
}
