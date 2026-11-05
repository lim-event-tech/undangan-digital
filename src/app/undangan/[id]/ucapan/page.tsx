import type { Metadata } from "next";
import Link from "next/link";
import { judulHalaman, kartu, tombolGelap, tombolTerang } from "@/components/ui";
import { TombolUnduh } from "@/components/tombol-unduh";
import { db } from "@/db";
import { formatStamp } from "@/lib/datetime";
import { readContent } from "@/lib/invitations/content";
import { requireInvitationById } from "@/lib/session";
import { countWishesByStatus, listWishes } from "@/lib/wishes/service";
import { isWishStatus, type WishStatus } from "@/lib/wishes/shared";
import { ubahStatusUcapanAction } from "./actions";
import { TombolHapusUcapan } from "./tombol-hapus";

export const metadata: Metadata = { title: "Pesan dan harapan" };

const MAKS_BARIS = 200;

const STATUS: Record<WishStatus, { label: string; kelas: string }> = {
  tampil: { label: "Tampil", kelas: "bg-hijau-bg text-hijau" },
  ditahan: { label: "Ditahan", kelas: "bg-jingga-bg text-jingga" },
  disembunyikan: { label: "Disembunyikan", kelas: "bg-krem-2 text-redup-2" },
};

type Tab = WishStatus | "semua";

function satu(value: string | string[] | undefined): string | undefined {
  const v = Array.isArray(value) ? value[0] : value;
  return v === "" ? undefined : v;
}

function AksiStatus({ invitationId, id, status, label, gelap }: { invitationId: string; id: string; status: WishStatus; label: string; gelap?: boolean }) {
  return (
    <form action={ubahStatusUcapanAction.bind(null, invitationId)}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={status} />
      <button type="submit" className={`${gelap ? tombolGelap : tombolTerang} min-h-10 px-3.5`}>
        {label}
      </button>
    </form>
  );
}

export default async function UcapanPage({ params, searchParams }: PageProps<"/undangan/[id]/ucapan">) {
  const { invitation } = await requireInvitationById((await params).id);
  const sp = await searchParams;
  const param = satu(sp.status);
  const tab: Tab = isWishStatus(param) ? param : "semua";

  const [daftar, jumlah] = await Promise.all([
    listWishes(db, invitation.id, tab === "semua" ? undefined : tab),
    countWishesByStatus(db, invitation.id),
  ]);
  const total = jumlah.tampil + jumlah.ditahan + jumlah.disembunyikan;
  const pengaturan = readContent(invitation.content).ucapan;
  const tampil = daftar.slice(0, MAKS_BARIS);

  const tabs: { key: Tab; label: string; jumlah: number }[] = [
    { key: "semua", label: "Semua", jumlah: total },
    { key: "ditahan", label: "Ditahan", jumlah: jumlah.ditahan },
    { key: "tampil", label: "Tampil", jumlah: jumlah.tampil },
    { key: "disembunyikan", label: "Disembunyikan", jumlah: jumlah.disembunyikan },
  ];

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className={`m-0 ${judulHalaman}`}>Pesan dan harapan</h1>
          <p className="mt-1 mb-0 text-sm text-redup">
            Ucapan yang ditulis tamu di undangan. Anda bisa menyetujui, menyembunyikan, atau
            menghapusnya.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/undangan/${invitation.id}/isi#ucapan`} className={`${tombolTerang} no-underline`}>
            Pengaturan ucapan
          </Link>
          {total > 0 ? (
            <TombolUnduh href={`/undangan/${invitation.id}/ucapan/ekspor`} />
          ) : null}
        </div>
      </div>

      {!pengaturan.tampil ? (
        <div
          role="status"
          className="rounded-[10px] bg-jingga-bg p-4 text-sm leading-relaxed text-jingga"
        >
          Ucapan sedang dimatikan, jadi tamu tidak bisa mengirim ucapan baru. Nyalakan lagi di
          pengaturan ucapan.
        </div>
      ) : pengaturan.tahan ? (
        <div
          role="status"
          className="rounded-[10px] bg-krem p-4 text-sm leading-relaxed text-emas-tua"
        >
          Ucapan baru ditahan sampai Anda menyetujuinya.
        </div>
      ) : null}

      <nav aria-label="Saring status ucapan" className="flex flex-wrap gap-2">
        {tabs.map((item) => (
          <Link
            key={item.key}
            href={item.key === "semua" ? `/undangan/${invitation.id}/ucapan` : `/undangan/${invitation.id}/ucapan?status=${item.key}`}
            aria-current={item.key === tab ? "page" : undefined}
            className={`inline-flex min-h-10 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-medium no-underline ${
              item.key === tab
                ? "border-tinta bg-tinta text-white"
                : "border-garis-input bg-white text-tinta-2 hover:bg-kertas"
            }`}
          >
            {item.label}
            <span className={item.key === tab ? "text-white/80" : "text-redup"}>{item.jumlah}</span>
          </Link>
        ))}
      </nav>

      {tampil.length === 0 ? (
        <div className={`${kartu} border-dashed p-10 text-center text-sm leading-relaxed text-redup-2`}>
          {total === 0
            ? "Belum ada ucapan. Ucapan dari tamu akan muncul di sini."
            : "Tidak ada ucapan dengan status ini."}
        </div>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {tampil.map((item) => (
            <li key={item.id} className={`${kartu} flex flex-col gap-3 p-4 sm:p-5`}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex min-w-0 flex-col">
                  <span className="font-medium">{item.authorName}</span>
                  <span className="text-xs text-redup">{formatStamp(item.createdAt)}</span>
                </div>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${STATUS[item.status].kelas}`}
                >
                  {STATUS[item.status].label}
                </span>
              </div>
              <p className="m-0 text-[15px] leading-relaxed break-words whitespace-pre-wrap text-tinta-2">
                {item.message}
              </p>
              <div className="flex flex-wrap gap-2">
                {item.status === "ditahan" ? (
                  <AksiStatus invitationId={invitation.id} id={item.id} status="tampil" label="Setujui dan tampilkan" gelap />
                ) : null}
                {item.status === "disembunyikan" ? (
                  <AksiStatus invitationId={invitation.id} id={item.id} status="tampil" label="Tampilkan" />
                ) : null}
                {item.status !== "disembunyikan" ? (
                  <AksiStatus invitationId={invitation.id} id={item.id} status="disembunyikan" label="Sembunyikan" />
                ) : null}
                <TombolHapusUcapan id={item.id} pengirim={item.authorName} />
              </div>
            </li>
          ))}
        </ul>
      )}

      {daftar.length > MAKS_BARIS ? (
        <p className="m-0 text-[13px] text-redup">
          Menampilkan {MAKS_BARIS} dari {daftar.length} ucapan. Unduh file untuk melihat semuanya.
        </p>
      ) : null}
    </div>
  );
}
