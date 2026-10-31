import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { Ikon } from "@/components/ikon";
import {
  judulHalaman,
  kartu,
  tombolGelap,
  tombolTerang,
} from "@/components/ui";
import { db } from "@/db";
import {
  countGuests,
  getGuest,
  listEvents,
  listGroups,
  listGuests,
} from "@/lib/guests/service";
import { formatPhone } from "@/lib/phone";
import { requireInvitation } from "@/lib/session";
import { isUuid } from "@/lib/uuid";
import { FormTamu } from "./form-tamu";
import { TombolSalin } from "./tombol-salin";

export const metadata: Metadata = { title: "Daftar tamu" };

const MAKS_BARIS = 500;

const KELAS_ACARA = [
  "bg-hijau-bg text-hijau",
  "bg-krem text-emas-tua",
  "bg-krem-2 text-redup-2",
];

type Param = string | string[] | undefined;

function satu(value: Param): string | undefined {
  const v = Array.isArray(value) ? value[0] : value;
  return v === "" ? undefined : v;
}

function angka(value: Param): number {
  const v = Number(satu(value));
  return Number.isInteger(v) && v >= 0 ? v : 0;
}

function pesanOk(kode: string | undefined, diimpor: number, dilewati: number) {
  if (diimpor > 0) {
    return `${diimpor} tamu berhasil diimpor${dilewati > 0 ? `, ${dilewati} baris dilewati` : ""}.`;
  }
  if (kode === "ditambah") return "Tamu ditambahkan.";
  if (kode === "diubah") return "Perubahan disimpan.";
  if (kode === "dihapus") return "Tamu dihapus.";
  return null;
}

export default async function TamuPage({
  searchParams,
}: PageProps<"/undangan/tamu">) {
  const { invitation } = await requireInvitation();
  const sp = await searchParams;

  const q = satu(sp.q)?.slice(0, 100);
  const grupParam = satu(sp.grup);
  const acaraParam = satu(sp.acara);
  const grupId = isUuid(grupParam) ? grupParam : undefined;
  const acaraId = isUuid(acaraParam) ? acaraParam : undefined;
  const ubahParam = satu(sp.ubah);
  const banner = pesanOk(satu(sp.ok), angka(sp.diimpor), angka(sp.dilewati));

  const [events, groups, total, rows, editing] = await Promise.all([
    listEvents(db, invitation.id),
    listGroups(db, invitation.id),
    countGuests(db, invitation.id),
    listGuests(db, invitation.id, { q, groupId: grupId, eventId: acaraId }),
    isUuid(ubahParam) ? getGuest(db, invitation.id, ubahParam) : null,
  ]);

  const eventsById = new Map(events.map((e, index) => [e.id, { ...e, index }]));
  const tampil = rows.slice(0, MAKS_BARIS);
  const disaring = Boolean(q || grupId || acaraId);

  function href(ubah?: string) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (grupId) params.set("grup", grupId);
    if (acaraId) params.set("acara", acaraId);
    if (ubah) params.set("ubah", ubah);
    const query = params.toString();
    return `/undangan/tamu${query ? `?${query}` : ""}`;
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3.5">
        <div>
          <h1 className={`m-0 ${judulHalaman}`}>Daftar tamu</h1>
          <p className="mt-1 mb-0 text-sm text-redup">
            {total} tamu · tiap tamu punya link pribadi sendiri
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Link href="/undangan/tamu/impor" className={`${tombolTerang} no-underline`}>
            <Ikon nama="unduh" ukuran={16} />
            Impor CSV
          </Link>
          <Link href="/undangan/tamu#tambah" className={`${tombolGelap} no-underline`}>
            + Tambah tamu
          </Link>
        </div>
      </div>

      {banner ? (
        <p
          role="status"
          className="m-0 flex items-center gap-2 rounded-lg bg-hijau-bg px-4 py-3 text-sm font-medium text-hijau"
        >
          <Ikon nama="ceklis" ukuran={16} tebal={2.2} />
          {banner}
        </p>
      ) : null}

      <div className="flex flex-wrap items-start gap-6">
        <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-3.5">
          <Form
            key={`${q ?? ""}|${grupId ?? ""}|${acaraId ?? ""}`}
            action="/undangan/tamu"
            className="flex flex-wrap items-end gap-2.5"
          >
            <label className="flex min-h-11 min-w-55 flex-[1_1_220px] items-center gap-2 rounded-lg border border-garis-input bg-white px-3 focus-within:border-emas-muda focus-within:ring-3 focus-within:ring-emas-muda/20">
              <Ikon nama="cari" className="text-redup" />
              <span className="sr-only">Cari tamu</span>
              <input
                type="search"
                name="q"
                defaultValue={q ?? ""}
                placeholder="Cari nama atau nomor"
                className="min-w-0 flex-1 border-0 bg-transparent text-sm focus:outline-none"
              />
            </label>
            <label className="flex items-center gap-2 text-[13px] font-medium text-redup-2">
              Grup
              <select
                name="grup"
                defaultValue={grupId ?? ""}
                className="min-h-11 rounded-lg border border-garis-input bg-white px-2.5 text-sm font-medium text-tinta"
              >
                <option value="">Semua</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 text-[13px] font-medium text-redup-2">
              Acara
              <select
                name="acara"
                defaultValue={acaraId ?? ""}
                className="min-h-11 rounded-lg border border-garis-input bg-white px-2.5 text-sm font-medium text-tinta"
              >
                <option value="">Semua</option>
                {events.map((e) => (
                  <option key={e.id} value={e.id}>
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
                href="/undangan/tamu"
                className="inline-flex min-h-11 items-center px-1 text-sm font-medium text-emas"
              >
                Atur ulang
              </Link>
            ) : null}
          </Form>

          {total === 0 ? (
            <div className={`${kartu} flex flex-col items-center gap-3 border-dashed p-10 text-center`}>
              <h2 className="m-0 font-judul text-2xl font-medium">Belum ada tamu</h2>
              <p className="m-0 max-w-sm text-sm leading-relaxed text-redup-2">
                Tambahkan tamu satu per satu lewat form di samping, atau impor
                banyak sekaligus dari file CSV.
              </p>
              <Link href="/undangan/tamu/impor" className={`${tombolTerang} no-underline`}>
                Impor dari CSV
              </Link>
            </div>
          ) : rows.length === 0 ? (
            <div className={`${kartu} p-8 text-center text-sm text-redup-2`}>
              Tidak ada tamu yang cocok dengan pencarian ini.
            </div>
          ) : (
            <div className={`${kartu} relative overflow-x-auto`}>
              <table className="w-full min-w-160 border-collapse text-sm">
                <thead>
                  <tr className="bg-kertas text-left text-xs tracking-[0.06em] text-redup-2 uppercase">
                    <th scope="col" className="px-2.5 py-3 font-medium">Nama</th>
                    <th scope="col" className="px-2.5 py-3 font-medium">WhatsApp</th>
                    <th scope="col" className="px-2.5 py-3 font-medium">Grup</th>
                    <th scope="col" className="px-2.5 py-3 font-medium">Acara</th>
                    <th scope="col" className="px-2.5 py-3 text-center font-medium">Maks. dewasa</th>
                    <th scope="col" className="px-2.5 py-3 text-center font-medium">Maks. anak</th>
                    <th scope="col" className="px-2.5 py-3 font-medium">
                      <span className="sr-only">Aksi</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tampil.map((g) => (
                    <tr
                      key={g.id}
                      className={`border-t border-garis-halus ${
                        editing?.id === g.id ? "bg-krem/50" : ""
                      }`}
                    >
                      <td className="px-2.5 py-3 font-medium">{g.name}</td>
                      <td className="px-2.5 py-3 whitespace-nowrap text-tinta-2">
                        {formatPhone(g.phone)}
                      </td>
                      <td className="px-2.5 py-3">
                        {g.groupName ? (
                          <span className="rounded-full bg-krem-2 px-2.5 py-0.5 text-xs font-medium whitespace-nowrap">
                            {g.groupName}
                          </span>
                        ) : (
                          <span className="text-redup">—</span>
                        )}
                      </td>
                      <td className="px-2.5 py-3">
                        <div className="flex flex-wrap gap-1">
                          {g.eventIds
                            .map((id) => eventsById.get(id))
                            .filter((e) => e !== undefined)
                            .sort((a, b) => a.index - b.index)
                            .map((e) => (
                              <span
                                key={e.id}
                                className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                                  KELAS_ACARA[Math.min(e.index, KELAS_ACARA.length - 1)]
                                }`}
                              >
                                {e.name}
                              </span>
                            ))}
                        </div>
                      </td>
                      <td className="px-2.5 py-3 text-center font-medium">{g.maxAdults}</td>
                      <td className="px-2.5 py-3 text-center font-medium">{g.maxChildren}</td>
                      <td className="px-2.5 py-1.5 whitespace-nowrap">
                        <div className="flex gap-1.5">
                          <TombolSalin
                            path={`/u/${invitation.slug}/${g.token}`}
                            nama={g.name}
                          />
                          <Link
                            href={`${href(g.id)}#tambah`}
                            aria-label={`Ubah ${g.name}`}
                            className="inline-flex size-10 items-center justify-center rounded-md border border-garis bg-white text-redup-2 transition-colors hover:bg-kertas focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emas-muda"
                          >
                            <Ikon nama="pena" ukuran={16} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {rows.length > MAKS_BARIS ? (
            <p className="m-0 text-[13px] text-redup">
              Menampilkan {MAKS_BARIS} dari {rows.length} tamu. Gunakan pencarian
              atau saringan untuk mempersempit.
            </p>
          ) : null}
        </div>

        <div className="min-w-0 flex-[1_1_300px]">
          <FormTamu
            key={editing?.id ?? "baru"}
            events={events.map((e) => ({ id: e.id, name: e.name }))}
            groups={groups.map((g) => g.name)}
            defaults={{
              maxAdults: invitation.defaultMaxAdults,
              maxChildren: invitation.defaultMaxChildren,
            }}
            guest={
              editing
                ? {
                    id: editing.id,
                    name: editing.name,
                    phone: editing.phone,
                    groupName: editing.groupName,
                    eventIds: editing.eventIds,
                    maxAdults: editing.maxAdults,
                    maxChildren: editing.maxChildren,
                  }
                : null
            }
            batalHref={href()}
          />
        </div>
      </div>
    </div>
  );
}
