import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { judulHalaman, kartu, tombolGelap, tombolTerang } from "@/components/ui";
import { db } from "@/db";
import { appBaseUrl } from "@/lib/app-url";
import { checkinCounts, getOrCreateCheckinKey, listCheckinGuests } from "@/lib/checkin/service";
import { formatStamp } from "@/lib/datetime";
import { readContent } from "@/lib/invitations/content";
import { requireInvitationById } from "@/lib/session";
import { TombolSalin } from "../tamu/tombol-salin";
import { batalkanMasukAction, gantiKunciAction, masukkanTamuAction } from "./actions";

export const metadata: Metadata = { title: "Check-in" };

const MAKS_BARIS = 300;

function satu(value: string | string[] | undefined): string | undefined {
  const v = Array.isArray(value) ? value[0] : value;
  return v === "" ? undefined : v;
}

export default async function CheckinPage({ params, searchParams }: PageProps<"/undangan/[id]/checkin">) {
  const { invitation } = await requireInvitationById((await params).id);
  const sp = await searchParams;
  const q = satu(sp.q)?.slice(0, 100);
  const semua = satu(sp.tampil) === "semua";

  if (!readContent(invitation.content).checkin.aktif) {
    return (
      <div className="mx-auto flex max-w-4xl flex-col gap-5">
        <h1 className={`m-0 ${judulHalaman}`}>Check-in tamu</h1>
        <section className={`${kartu} flex flex-col items-start gap-3 p-5`}>
          <p className="m-0 text-sm leading-relaxed text-redup">
            Check-in dengan kode QR sedang nonaktif. Tamu yang konfirmasi hadir tidak mendapat kode QR dan link
            petugas tidak berlaku. Aktifkan di bagian Check-in di lokasi pada halaman Isi undangan bila Anda
            membutuhkannya.
          </p>
          <Link href={`/undangan/${invitation.id}/isi#checkin`} className={`${tombolGelap} no-underline`}>
            Buka pengaturan
          </Link>
        </section>
      </div>
    );
  }

  const [key, counts, guests] = await Promise.all([
    getOrCreateCheckinKey(db, invitation.id),
    checkinCounts(db, invitation.id),
    listCheckinGuests(db, invitation.id, { q, onlyAttending: !semua, limit: MAKS_BARIS }),
  ]);
  const usherPath = `/petugas/${invitation.slug}/${key}`;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-5">
      <div>
        <h1 className={`m-0 ${judulHalaman}`}>Check-in tamu</h1>
        <p className="mt-1 mb-0 text-sm text-redup">
          Tamu yang konfirmasi hadir mendapat kode QR. Petugas penerima tamu memindainya di hari acara.
        </p>
      </div>

      <dl className="m-0 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[
          ["Konfirmasi hadir", counts.confirmed],
          ["Sudah masuk", counts.inside],
          ["Orang di dalam", counts.insidePeople],
        ].map(([label, nilai]) => (
          <div key={label} className={`${kartu} flex flex-col gap-1 p-4`}>
            <dt className="text-xs text-redup">{label}</dt>
            <dd className="m-0 font-judul text-[34px] leading-none font-medium lining-nums">{nilai}</dd>
          </div>
        ))}
      </dl>

      <section aria-labelledby="judul-petugas" className={`${kartu} flex flex-col gap-3 p-5`}>
        <div>
          <h2 id="judul-petugas" className="m-0 font-judul text-2xl font-medium">
            Halaman petugas
          </h2>
          <p className="mt-1 mb-0 text-sm leading-relaxed text-redup">
            Bagikan link ini ke penerima tamu. Mereka tidak perlu masuk akun. Siapa pun yang memegang link bisa
            memindai dan memasukkan tamu, jadi jangan disebar luas.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <code className="min-w-0 flex-1 overflow-x-auto rounded-md bg-kertas px-3 py-2.5 text-sm text-tinta-2">
            {appBaseUrl()}
            {usherPath}
          </code>
          <TombolSalin path={usherPath} nama="halaman petugas" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a href={usherPath} target="_blank" rel="noopener noreferrer" className={`${tombolGelap} no-underline`}>
            Buka halaman petugas
          </a>
          <form action={gantiKunciAction.bind(null, invitation.id)}>
            <button type="submit" className={tombolTerang}>
              Buat link baru
            </button>
          </form>
        </div>
        <p className="m-0 text-xs text-redup">
          “Buat link baru” mematikan link petugas yang lama, misalnya bila link tersebar ke orang yang tidak
          seharusnya.
        </p>
      </section>

      <section aria-labelledby="judul-daftar-checkin" className={`${kartu} flex flex-col gap-4 p-5`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="judul-daftar-checkin" className="m-0 font-judul text-2xl font-medium">
            Daftar tamu
          </h2>
          <Form action={`/undangan/${invitation.id}/checkin`} className="flex gap-2">
            {semua ? <input type="hidden" name="tampil" value="semua" /> : null}
            <label className="sr-only" htmlFor="cari-checkin">
              Cari tamu
            </label>
            <input
              id="cari-checkin"
              type="search"
              name="q"
              defaultValue={q ?? ""}
              placeholder="Cari nama"
              className="min-h-11 w-48 rounded-md border border-garis-input bg-white px-3 text-sm focus:border-emas-muda focus:ring-3 focus:ring-emas-muda/20 focus:outline-none"
            />
            <button type="submit" className={tombolTerang}>
              Cari
            </button>
          </Form>
        </div>

        <nav aria-label="Saring tamu" className="flex gap-2">
          {[
            { href: `/undangan/${invitation.id}/checkin${q ? `?q=${encodeURIComponent(q)}` : ""}`, label: "Konfirmasi hadir", aktif: !semua },
            {
              href: `/undangan/${invitation.id}/checkin?tampil=semua${q ? `&q=${encodeURIComponent(q)}` : ""}`,
              label: "Semua tamu",
              aktif: semua,
            },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              aria-current={item.aktif ? "page" : undefined}
              className={`inline-flex min-h-10 items-center rounded-full border px-3.5 text-[13px] font-medium no-underline ${
                item.aktif
                  ? "border-tinta bg-tinta text-white"
                  : "border-garis-input bg-white text-tinta-2 hover:bg-kertas"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {guests.length === 0 ? (
          <p className="m-0 rounded-lg bg-krem-2/60 p-6 text-center text-sm text-redup-2">
            {semua || q
              ? "Tidak ada tamu yang cocok."
              : "Belum ada tamu yang konfirmasi hadir. Kode QR muncul setelah tamu menjawab hadir."}
          </p>
        ) : (
          <ul className="m-0 flex list-none flex-col p-0">
            {guests.map((g) => (
              <li
                key={g.id}
                className="flex flex-wrap items-center justify-between gap-3 border-t border-garis-halus py-3 first:border-t-0"
              >
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="truncate font-medium">{g.name}</span>
                  <span className="text-xs text-redup">
                    {g.attending
                      ? `Hadir · ${g.adults} dewasa${g.children > 0 ? `, ${g.children} anak` : ""}`
                      : "Belum konfirmasi hadir"}
                    {g.groupName ? ` · ${g.groupName}` : ""}
                  </span>
                  {g.checkedInAt ? (
                    <span className="text-xs font-medium text-hijau">Sudah masuk {formatStamp(g.checkedInAt)}</span>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {g.attending ? (
                    <a
                      href={`/${invitation.slug}/${g.token}/qr`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${tombolTerang} min-h-10 px-3.5 no-underline`}
                    >
                      Lihat QR
                    </a>
                  ) : null}
                  <form action={(g.checkedInAt ? batalkanMasukAction : masukkanTamuAction).bind(null, invitation.id)}>
                    <input type="hidden" name="id" value={g.id} />
                    <button type="submit" className={`${g.checkedInAt ? tombolTerang : tombolGelap} min-h-10 px-3.5`}>
                      {g.checkedInAt ? "Batalkan" : "Masukkan"}
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
