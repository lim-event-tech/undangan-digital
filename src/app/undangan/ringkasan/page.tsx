import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { judulHalaman, kartu, tombolGelap, tombolTerang } from "@/components/ui";
import { TombolUnduh } from "@/components/tombol-unduh";
import { db } from "@/db";
import { formatStamp } from "@/lib/datetime";
import { listGroups } from "@/lib/guests/service";
import {
  getDashboard,
  isGuestStatus,
  type DashboardGuest,
  type GuestStatus,
} from "@/lib/rsvp/dashboard";
import { requireInvitation } from "@/lib/session";
import { isUuid } from "@/lib/uuid";
import { GrafikRingkasan } from "./grafik";

export const metadata: Metadata = { title: "Ringkasan RSVP" };

const MAKS_BARIS = 500;

const STATUS: Record<GuestStatus, { label: string; kelas: string }> = {
  hadir: { label: "Hadir", kelas: "bg-hijau-bg text-hijau" },
  tidak: { label: "Tidak hadir", kelas: "bg-galat-bg text-galat" },
  belum: { label: "Belum menjawab", kelas: "bg-krem-2 text-redup-2" },
};

type Param = string | string[] | undefined;

function satu(value: Param): string | undefined {
  const v = Array.isArray(value) ? value[0] : value;
  return v === "" ? undefined : v;
}

function Lencana({ status }: { status: GuestStatus }) {
  const item = STATUS[status];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${item.kelas}`}
    >
      {item.label}
    </span>
  );
}

function ringkasJawaban(g: DashboardGuest) {
  return g.answers.map((a) => ({
    key: a.eventId,
    acara: a.eventName,
    teks: a.attending
      ? `Hadir · ${a.adults} dewasa${a.children > 0 ? `, ${a.children} anak` : ""}`
      : "Tidak hadir",
    pesan: a.note,
  }));
}

function Jawaban({ guest }: { guest: DashboardGuest }) {
  const items = ringkasJawaban(guest);
  if (items.length === 0) return <span className="text-redup">—</span>;
  return (
    <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
      {items.map((item) => (
        <li key={item.key} className="flex flex-col text-[13px]">
          <span>
            <span className="font-medium">{item.acara}:</span> {item.teks}
          </span>
          {item.pesan ? (
            <span className="text-xs text-redup-2 italic">“{item.pesan}”</span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export default async function RingkasanPage({ searchParams }: PageProps<"/undangan/ringkasan">) {
  const { invitation } = await requireInvitation();
  const sp = await searchParams;

  const statusParam = satu(sp.status);
  const status = isGuestStatus(statusParam) ? statusParam : undefined;
  const grupParam = satu(sp.grup);
  const acaraParam = satu(sp.acara);
  const groupId = isUuid(grupParam) ? grupParam : undefined;
  const eventId = isUuid(acaraParam) ? acaraParam : undefined;
  const q = satu(sp.q)?.slice(0, 100);

  const [data, groups] = await Promise.all([
    getDashboard(db, invitation.id, { status, groupId, eventId, q }),
    listGroups(db, invitation.id),
  ]);
  const { totals } = data;
  const disaring = Boolean(status || groupId || eventId || q);
  const tampil = data.guests.slice(0, MAKS_BARIS);

  const queryEkspor = new URLSearchParams();
  if (status) queryEkspor.set("status", status);
  if (groupId) queryEkspor.set("grup", groupId);
  if (eventId) queryEkspor.set("acara", eventId);
  if (q) queryEkspor.set("q", q);
  const stringEkspor = queryEkspor.toString();
  const hrefEkspor = `/undangan/ringkasan/ekspor${stringEkspor ? `?${stringEkspor}` : ""}`;

  const kartuAngka: { label: string; nilai: number; kelas?: string }[] = [
    { label: "Diundang", nilai: totals.invited },
    { label: "Hadir", nilai: totals.attending, kelas: "text-hijau" },
    { label: "Tidak hadir", nilai: totals.notAttending, kelas: "text-galat" },
    { label: "Belum menjawab", nilai: totals.pending },
    { label: "Dewasa hadir", nilai: totals.adults },
    { label: "Anak hadir", nilai: totals.children },
  ];

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className={`m-0 ${judulHalaman}`}>Ringkasan RSVP</h1>
          <p className="mt-1 mb-0 text-sm text-redup">
            Jawaban tamu yang masuk lewat link pribadi masing-masing
          </p>
        </div>
        <Link href="/undangan/kirim" className={`${tombolGelap} no-underline`}>
          Kirim undangan
        </Link>
      </div>

      {totals.invited === 0 ? (
        <div className={`${kartu} flex flex-col items-center gap-3 border-dashed p-10 text-center`}>
          <h2 className="m-0 font-judul text-2xl font-medium">Belum ada tamu</h2>
          <p className="m-0 max-w-sm text-sm leading-relaxed text-redup-2">
            Tambahkan tamu atau impor dari Excel atau CSV. Jawaban RSVP mereka akan muncul di sini.
          </p>
          <Link href="/undangan/tamu" className={`${tombolTerang} no-underline`}>
            Ke daftar tamu
          </Link>
        </div>
      ) : (
        <>
          <section aria-label="Ringkasan jawaban">
            <dl className="m-0 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {kartuAngka.map((item) => (
                <div key={item.label} className={`${kartu} flex flex-col gap-1 p-4`}>
                  <dt className="text-xs text-redup">{item.label}</dt>
                  <dd className={`m-0 font-judul text-[34px] leading-none font-medium lining-nums ${item.kelas ?? "text-tinta"}`}>
                    {item.nilai}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-2 mb-0 text-xs text-redup">
              Dewasa dan anak dihitung per tamu dengan jumlah terbanyak di antara acara yang
              dihadirinya, agar tamu yang datang ke dua acara tidak terhitung dua kali.
            </p>
          </section>

          <GrafikRingkasan totals={totals} charts={data.charts} />

          <section aria-labelledby="judul-per-acara" className="flex flex-col gap-3">
            <h2 id="judul-per-acara" className="m-0 font-judul text-2xl font-medium">
              Per acara
            </h2>
            <div className={`${kartu} hidden overflow-x-auto sm:block`}>
              <table className="w-full min-w-150 border-collapse text-sm">
                <thead>
                  <tr className="bg-kertas text-left text-xs tracking-[0.06em] text-redup-2 uppercase">
                    <th scope="col" className="px-3 py-3 font-medium">Acara</th>
                    <th scope="col" className="px-3 py-3 text-center font-medium">Diundang</th>
                    <th scope="col" className="px-3 py-3 text-center font-medium">Hadir</th>
                    <th scope="col" className="px-3 py-3 text-center font-medium">Tidak hadir</th>
                    <th scope="col" className="px-3 py-3 text-center font-medium">Belum</th>
                    <th scope="col" className="px-3 py-3 text-center font-medium">Dewasa</th>
                    <th scope="col" className="px-3 py-3 text-center font-medium">Anak</th>
                  </tr>
                </thead>
                <tbody>
                  {data.events.map((e) => (
                    <tr key={e.eventId} className="border-t border-garis-halus">
                      <th scope="row" className="px-3 py-3 text-left font-medium">{e.name}</th>
                      <td className="px-3 py-3 text-center">{e.invited}</td>
                      <td className="px-3 py-3 text-center font-medium text-hijau">{e.attending}</td>
                      <td className="px-3 py-3 text-center font-medium text-galat">{e.notAttending}</td>
                      <td className="px-3 py-3 text-center">{e.pending}</td>
                      <td className="px-3 py-3 text-center">{e.adults}</td>
                      <td className="px-3 py-3 text-center">{e.children}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="m-0 flex list-none flex-col gap-3 p-0 sm:hidden">
              {data.events.map((e) => (
                <li key={e.eventId} className={`${kartu} flex flex-col gap-3 p-4`}>
                  <span className="font-judul text-xl font-medium">{e.name}</span>
                  <dl className="m-0 grid grid-cols-3 gap-x-3 gap-y-2 text-sm">
                    {[
                      ["Diundang", e.invited],
                      ["Hadir", e.attending],
                      ["Tidak hadir", e.notAttending],
                      ["Belum", e.pending],
                      ["Dewasa", e.adults],
                      ["Anak", e.children],
                    ].map(([label, nilai]) => (
                      <div key={label} className="flex flex-col">
                        <dt className="text-xs text-redup">{label}</dt>
                        <dd className="m-0 font-medium">{nilai}</dd>
                      </div>
                    ))}
                  </dl>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="judul-per-tamu" className="flex flex-col gap-3.5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id="judul-per-tamu" className="m-0 font-judul text-2xl font-medium">
                Per tamu
              </h2>
              <TombolUnduh href={hrefEkspor} keterangan={disaring ? "sesuai saringan" : undefined} />
            </div>
            <Form
              key={`${status ?? ""}|${groupId ?? ""}|${eventId ?? ""}|${q ?? ""}`}
              action="/undangan/ringkasan"
              className="flex flex-wrap items-end gap-2.5"
            >
              <label className="flex min-w-48 flex-[1_1_200px] flex-col gap-1 text-[13px] font-medium text-redup-2">
                Cari nama
                <input
                  type="search"
                  name="q"
                  defaultValue={q ?? ""}
                  placeholder="Nama tamu"
                  className="min-h-11 rounded-md border border-garis-input bg-white px-3 text-sm font-normal text-tinta focus:border-emas-muda focus:ring-3 focus:ring-emas-muda/20 focus:outline-none"
                />
              </label>
              <label className="flex flex-col gap-1 text-[13px] font-medium text-redup-2">
                Status
                <select
                  name="status"
                  defaultValue={status ?? ""}
                  className="min-h-11 rounded-md border border-garis-input bg-white px-2.5 text-sm font-medium text-tinta"
                >
                  <option value="">Semua</option>
                  <option value="hadir">Hadir</option>
                  <option value="tidak">Tidak hadir</option>
                  <option value="belum">Belum menjawab</option>
                </select>
              </label>
              <label className="flex flex-col gap-1 text-[13px] font-medium text-redup-2">
                Grup
                <select
                  name="grup"
                  defaultValue={groupId ?? ""}
                  className="min-h-11 rounded-md border border-garis-input bg-white px-2.5 text-sm font-medium text-tinta"
                >
                  <option value="">Semua</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-[13px] font-medium text-redup-2">
                Acara
                <select
                  name="acara"
                  defaultValue={eventId ?? ""}
                  className="min-h-11 rounded-md border border-garis-input bg-white px-2.5 text-sm font-medium text-tinta"
                >
                  <option value="">Semua</option>
                  {data.events.map((e) => (
                    <option key={e.eventId} value={e.eventId}>
                      {e.name}
                    </option>
                  ))}
                </select>
              </label>
              <button type="submit" className={tombolTerang}>
                Terapkan
              </button>
              {disaring ? (
                <Link
                  href="/undangan/ringkasan"
                  className="inline-flex min-h-11 items-center px-1 text-sm font-medium text-emas"
                >
                  Atur ulang
                </Link>
              ) : null}
            </Form>

            <p className="m-0 text-[13px] text-redup" role="status">
              {data.matched} tamu{disaring ? " cocok dengan saringan" : ""}
            </p>

            {tampil.length === 0 ? (
              <div className={`${kartu} p-8 text-center text-sm text-redup-2`}>
                Tidak ada tamu yang cocok dengan saringan ini.
              </div>
            ) : (
              <>
                <div className={`${kartu} hidden overflow-x-auto md:block`}>
                  <table className="w-full min-w-190 border-collapse text-sm">
                    <thead>
                      <tr className="bg-kertas text-left text-xs tracking-[0.06em] text-redup-2 uppercase">
                        <th scope="col" className="px-3 py-3 font-medium">Nama</th>
                        <th scope="col" className="px-3 py-3 font-medium">Status</th>
                        <th scope="col" className="px-3 py-3 font-medium">Jawaban per acara</th>
                        <th scope="col" className="px-3 py-3 font-medium">Link dibuka</th>
                        <th scope="col" className="px-3 py-3 font-medium">Dijawab</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tampil.map((g) => (
                        <tr key={g.id} className="border-t border-garis-halus align-top">
                          <td className="px-3 py-3">
                            <span className="font-medium">{g.name}</span>
                            {g.groupName ? (
                              <span className="block text-xs text-redup">{g.groupName}</span>
                            ) : null}
                          </td>
                          <td className="px-3 py-3">
                            <Lencana status={g.status} />
                          </td>
                          <td className="px-3 py-3">
                            <Jawaban guest={g} />
                          </td>
                          <td className="px-3 py-3 text-[13px] whitespace-nowrap text-redup-2">
                            {g.openedAt ? formatStamp(g.openedAt) : "Belum"}
                          </td>
                          <td className="px-3 py-3 text-[13px] whitespace-nowrap text-redup-2">
                            {g.respondedAt ? formatStamp(g.respondedAt) : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <ul className="m-0 flex list-none flex-col gap-3 p-0 md:hidden">
                  {tampil.map((g) => (
                    <li key={g.id} className={`${kartu} flex flex-col gap-2.5 p-4`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 flex-col">
                          <span className="font-medium">{g.name}</span>
                          {g.groupName ? (
                            <span className="text-xs text-redup">{g.groupName}</span>
                          ) : null}
                        </div>
                        <Lencana status={g.status} />
                      </div>
                      <Jawaban guest={g} />
                      <span className="text-xs text-redup">
                        {g.openedAt ? `Link dibuka ${formatStamp(g.openedAt)}` : "Link belum dibuka"}
                        {g.respondedAt ? ` · Dijawab ${formatStamp(g.respondedAt)}` : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {data.guests.length > MAKS_BARIS ? (
              <p className="m-0 text-[13px] text-redup">
                Menampilkan {MAKS_BARIS} dari {data.guests.length} tamu. Gunakan saringan untuk
                mempersempit.
              </p>
            ) : null}
          </section>
        </>
      )}
    </div>
  );
}
