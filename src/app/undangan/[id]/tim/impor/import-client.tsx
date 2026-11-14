"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { Ikon } from "@/components/ikon";
import { useInvitationAction, useInvitationId } from "@/components/invitation-context";
import { kartu, kolom, tombolGelap, tombolTerang } from "@/components/ui";
import {
  MAX_TEAM_IMPORT_BYTES,
  MAX_TEAM_IMPORT_ROWS,
  decodeTeamCsvBytes,
  parseTeamCsv,
  parseTeamTable,
  summarizeTeamRows,
  validateTeamImportRows,
  type RawTeamRow,
  type TeamImportContext,
  type ValidatedTeamRow,
} from "@/lib/team/import";
import {
  bacaXlsxTimAction,
  commitTeamImportAction,
  type ImportedInviteItem,
} from "./actions";

const kolomTabel = "px-3.5 py-3";

const LABEL_CHECKIN: Record<ValidatedTeamRow["checkinAccess"], string> = {
  tidak: "Tanpa check-in",
  milik: "Tamu miliknya",
  semua: "Semua tamu",
};

function KeteranganStatus({ row }: { row: ValidatedTeamRow }) {
  if (row.status === "siap") {
    return (
      <span className="font-medium text-hijau">
        Siap{row.resend ? " · undang ulang" : ""}
      </span>
    );
  }
  if (row.status === "duplikat") {
    return (
      <span className="font-medium text-emas-tua">
        Sama dengan {row.duplicateOf}
      </span>
    );
  }
  return (
    <span className="font-medium text-jingga">{row.issues.join("; ")}</span>
  );
}

function TombolSalin({ link }: { link: string }) {
  const [status, setStatus] = useState<"diam" | "tersalin" | "gagal">("diam");
  async function salin() {
    try {
      await navigator.clipboard.writeText(link);
      setStatus("tersalin");
    } catch {
      setStatus("gagal");
    }
    setTimeout(() => setStatus("diam"), 1800);
  }
  return (
    <button type="button" onClick={salin} className={`${tombolTerang} min-h-9 px-3 text-xs`}>
      <Ikon nama={status === "tersalin" ? "ceklis" : "salin"} ukuran={14} />
      {status === "tersalin" ? "Tersalin" : status === "gagal" ? "Gagal" : "Salin tautan"}
    </button>
  );
}

export function TeamImportClient({ context }: { context: TeamImportContext }) {
  const invitationId = useInvitationId();
  const bacaXlsxAction = useInvitationAction(bacaXlsxTimAction);
  const commitAction = useInvitationAction(commitTeamImportAction);

  const [namaBerkas, setNamaBerkas] = useState<string | null>(null);
  const [rows, setRows] = useState<RawTeamRow[]>([]);
  const [bisaDiedit, setBisaDiedit] = useState<Set<number>>(new Set());
  const [galatBerkas, setGalatBerkas] = useState<string | null>(null);
  const [galatKirim, setGalatKirim] = useState<string | null>(null);
  const [lewati, setLewati] = useState(false);
  const [selesai, setSelesai] = useState<{
    imported: number;
    skipped: number;
    invites: ImportedInviteItem[];
  } | null>(null);
  const [memproses, mulai] = useTransition();

  const sisaKuota = Math.max(
    0,
    context.maxMembers - context.memberEmails.length - context.pendingEmails.length,
  );

  const validated = useMemo(
    () => validateTeamImportRows(rows, context),
    [rows, context],
  );
  const ringkas = summarizeTeamRows(validated);
  const masalah = ringkas.invalid + ringkas.duplicate;
  const bisaImpor =
    ringkas.ready > 0 && (masalah === 0 || lewati) && !memproses;

  async function pilihBerkas(file: File | undefined) {
    if (!file) return;
    setGalatBerkas(null);
    setGalatKirim(null);
    setLewati(false);
    setSelesai(null);

    if (file.size > MAX_TEAM_IMPORT_BYTES) {
      setGalatBerkas(
        `File terlalu besar (maks. ${Math.round(MAX_TEAM_IMPORT_BYTES / 1_000_000)} MB).`,
      );
      return;
    }

    let hasil: ReturnType<typeof parseTeamCsv>;
    if (/.xlsx$/i.test(file.name)) {
      const data = new FormData();
      data.set("file", file);
      const dibaca = await bacaXlsxAction(data);
      hasil = dibaca.ok ? parseTeamTable(dibaca.table) : dibaca;
    } else {
      hasil = parseTeamCsv(decodeTeamCsvBytes(await file.arrayBuffer()));
    }
    if (!hasil.ok) {
      setGalatBerkas(hasil.error);
      setRows([]);
      setNamaBerkas(null);
      return;
    }

    const awal = validateTeamImportRows(hasil.rows, context);
    setBisaDiedit(
      new Set(awal.filter((r) => r.status !== "siap").map((r) => r.row)),
    );
    setRows(hasil.rows);
    setNamaBerkas(file.name);
  }

  function ubahEmail(nomor: number, nilai: string) {
    setRows((semua) =>
      semua.map((r) => (r.row === nomor ? { ...r, email: nilai } : r)),
    );
  }

  function ganti() {
    setRows([]);
    setNamaBerkas(null);
    setBisaDiedit(new Set());
    setLewati(false);
    setGalatKirim(null);
    setSelesai(null);
  }

  function impor() {
    setGalatKirim(null);
    mulai(async () => {
      const hasil = await commitAction(rows, lewati);
      if (hasil.ok) {
        setSelesai({
          imported: hasil.imported,
          skipped: hasil.skipped,
          invites: hasil.invites,
        });
      } else {
        setGalatKirim(hasil.error);
      }
    });
  }

  if (selesai) {
    return (
      <div className="flex flex-col gap-5">
        <section className={`${kartu} flex flex-col gap-4 p-5 sm:p-6`} role="status">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="m-0 font-judul text-2xl font-medium text-hijau">
                {selesai.imported} undangan tim dibuat
              </h2>
              {selesai.skipped > 0 ? (
                <p className="mt-1 mb-0 text-sm text-redup">
                  {selesai.skipped} baris dilewati.
                </p>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={ganti} className={tombolTerang}>
                Impor lagi
              </button>
              <Link href={`/undangan/${invitationId}/tim`} className={`${tombolGelap} no-underline`}>
                Kembali ke Tim
              </Link>
            </div>
          </div>

          <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
            {selesai.invites.map((item) => (
              <li
                key={item.email}
                className="flex flex-col gap-2 rounded-[10px] border border-garis-halus bg-kertas p-3.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-tinta">{item.email}</span>
                    <span className="rounded-full bg-krem px-2 py-0.5 text-xs font-medium text-emas-tua">
                      {item.role === "pemilik" ? "Pemilik" : "Anggota"}
                    </span>
                  </div>
                  <span
                    className={`text-xs font-medium ${
                      item.surel === "terkirim" ? "text-hijau" : "text-emas-tua"
                    }`}
                  >
                    {item.surel === "terkirim"
                      ? "Surel terkirim"
                      : item.surel === "tidak-diatur"
                        ? "Surel belum aktif — kirim tautan sendiri"
                        : `Surel gagal (${item.galatSurel ?? "galat"}) — kirim tautan sendiri`}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <code className="min-w-0 flex-1 overflow-x-auto rounded-md bg-white px-2.5 py-1.5 text-xs text-tinta-2">
                    {item.link}
                  </code>
                  <TombolSalin link={item.link} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <section className={`${kartu} flex flex-wrap items-center justify-between gap-4 p-5`}>
        <div className="flex min-w-64 flex-[1_1_300px] flex-col gap-1">
          <h2 className="m-0 font-judul text-lg font-medium text-tinta">
            1. Unduh template Excel
          </h2>
          <p className="m-0 text-[13px] leading-normal text-redup-2">
            Isi daftar email anggota tim di sheet{" "}
            <strong className="font-medium text-tinta">Daftar tim</strong> sesuai
            panduan kolom, lalu unggah kembali di bawah ini. Sisa kuota saat ini:{" "}
            <strong className="font-medium text-tinta">{sisaKuota}</strong> dari{" "}
            {context.maxMembers} anggota.
          </p>
          <p className="m-0 text-xs text-redup">
            Atau unduh contoh terisi:{" "}
            <a href={`/undangan/${invitationId}/tim/contoh.xlsx`} className="text-emas">
              Excel
            </a>{" "}
            ·{" "}
            <a href={`/undangan/${invitationId}/tim/contoh.csv`} className="text-emas">
              CSV
            </a>
          </p>
        </div>
        <a
          href={`/undangan/${invitationId}/tim/template.xlsx`}
          className={`${tombolGelap} inline-flex items-center gap-2 no-underline`}
        >
          <Ikon nama="unduh" ukuran={18} />
          Unduh Template Excel (.xlsx)
        </a>
      </section>

      <section className={`${kartu} flex flex-wrap items-center gap-5 p-5`}>
        <div className="w-full">
          <h2 className="m-0 font-judul text-lg font-medium text-tinta">
            2. Unggah file yang sudah diisi
          </h2>
        </div>

        {namaBerkas ? (
          <div className="flex min-w-70 flex-[1_1_280px] items-center gap-3.5 rounded-[10px] border-2 border-dashed border-[#c5d0b8] bg-[#f3fbf9] p-4">
            <span
              aria-hidden="true"
              className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-teal text-white"
            >
              <Ikon nama="berkas" ukuran={22} />
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="truncate font-medium">{namaBerkas}</span>
              <span className="text-xs text-hijau">{rows.length} baris terbaca</span>
            </div>
            <button
              type="button"
              onClick={ganti}
              className="min-h-10 rounded-md border border-[#c5d0b8] bg-white px-3 text-[13px] font-medium text-hijau"
            >
              Ganti file
            </button>
          </div>
        ) : (
          <label
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              void pilihBerkas(e.dataTransfer.files[0]);
            }}
            className="flex min-w-70 flex-[1_1_280px] cursor-pointer items-center gap-3.5 rounded-[10px] border-2 border-dashed border-garis-input bg-kertas p-4 focus-within:border-emas-muda hover:border-emas-muda"
          >
            <span
              aria-hidden="true"
              className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-tinta text-white"
            >
              <Ikon nama="unduh" ukuran={22} />
            </span>
            <span className="flex flex-col gap-0.5">
              <span className="font-medium">Pilih file Excel atau CSV</span>
              <span className="text-xs text-redup">
                atau tarik file ke sini · maks. {MAX_TEAM_IMPORT_ROWS} baris
              </span>
            </span>
            <input
              type="file"
              accept=".xlsx,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="sr-only"
              onChange={(e) => {
                void pilihBerkas(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </label>
        )}

        <div className="flex min-w-70 flex-[1_1_280px] flex-col gap-1.5 text-[13px] leading-normal text-redup-2">
          <span className="font-medium text-tinta">Kolom yang dibaca</span>
          <code className="rounded-lg bg-krem-2 px-2.5 py-2 text-xs wrap-anywhere text-tinta-2">
            email, peran, hak_checkin
          </code>
          <span>
            <strong className="font-medium text-tinta">peran</strong>:{" "}
            <code className="rounded bg-krem-2 px-1 py-px">anggota</code> (bawaan) atau{" "}
            <code className="rounded bg-krem-2 px-1 py-px">pemilik</code>.{" "}
            <strong className="font-medium text-tinta">hak_checkin</strong>:{" "}
            <code className="rounded bg-krem-2 px-1 py-px">tidak</code>,{" "}
            <code className="rounded bg-krem-2 px-1 py-px">milik</code> (bawaan), atau{" "}
            <code className="rounded bg-krem-2 px-1 py-px">semua</code>.
          </span>
        </div>
      </section>

      {galatBerkas ? (
        <p
          role="alert"
          className="m-0 rounded-lg bg-galat-bg px-4 py-3 text-sm font-medium text-galat"
        >
          {galatBerkas}
        </p>
      ) : null}

      {rows.length > 0 ? (
        <>
          <div className="flex flex-wrap gap-2.5" aria-live="polite">
            <span className="inline-flex items-center gap-2 rounded-full bg-hijau-bg px-3.5 py-2 text-sm font-medium text-hijau">
              <Ikon nama="ceklis" ukuran={16} tebal={2.4} />
              {ringkas.ready} siap diundang
            </span>
            {ringkas.invalid > 0 ? (
              <span className="inline-flex items-center gap-2 rounded-full bg-jingga-bg px-3.5 py-2 text-sm font-medium text-jingga">
                <Ikon nama="awas" ukuran={16} tebal={2.4} />
                {ringkas.invalid} perlu diperbaiki
              </span>
            ) : null}
            {ringkas.duplicate > 0 ? (
              <span className="inline-flex items-center gap-2 rounded-full bg-krem px-3.5 py-2 text-sm font-medium text-emas-tua">
                <Ikon nama="salin" ukuran={16} tebal={2.4} />
                {ringkas.duplicate} email duplikat
              </span>
            ) : null}
          </div>

          <div className={`${kartu} relative overflow-x-auto`}>
            <table className="w-full min-w-160 border-collapse text-sm">
              <thead>
                <tr className="bg-kertas text-left text-xs tracking-[0.06em] text-redup-2 uppercase">
                  <th scope="col" className={`${kolomTabel} font-medium`}>Baris</th>
                  <th scope="col" className={`${kolomTabel} font-medium`}>Email</th>
                  <th scope="col" className={`${kolomTabel} font-medium`}>Peran</th>
                  <th scope="col" className={`${kolomTabel} font-medium`}>Hak check-in</th>
                  <th scope="col" className={`${kolomTabel} font-medium`}>Status</th>
                </tr>
              </thead>
              <tbody>
                {validated.map((row) => {
                  const edit = bisaDiedit.has(row.row);
                  const raw = rows.find((r) => r.row === row.row);
                  const barisBermasalah =
                    row.status === "perlu_diperbaiki"
                      ? "bg-[#fff8f5]"
                      : row.status === "duplikat"
                        ? "bg-krem/50"
                        : "";
                  return (
                    <tr
                      key={row.row}
                      className={`border-t border-garis-halus ${barisBermasalah}`}
                    >
                      <td className={`${kolomTabel} text-redup tabular-nums`}>
                        {row.row}
                      </td>
                      <td className={kolomTabel}>
                        {edit && raw ? (
                          <input
                            type="email"
                            value={raw.email}
                            aria-label={`Email baris ${row.row}`}
                            onChange={(e) => ubahEmail(row.row, e.target.value)}
                            className={`${kolom} min-h-9 px-2.5 py-1.5 text-sm`}
                          />
                        ) : (
                          row.emailInput || <span className="text-redup">—</span>
                        )}
                      </td>
                      <td className={kolomTabel}>
                        {row.role === "pemilik" ? "Pemilik" : "Anggota"}
                      </td>
                      <td className={kolomTabel}>
                        {LABEL_CHECKIN[row.checkinAccess]}
                      </td>
                      <td className={kolomTabel}>
                        <KeteranganStatus row={row} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className={`${kartu} flex flex-wrap items-center justify-between gap-4 p-5`}>
            <div className="flex flex-col gap-1.5">
              {masalah > 0 ? (
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={lewati}
                    onChange={(e) => setLewati(e.target.checked)}
                    className="size-4 accent-tinta"
                  />
                  <span>
                    Lewati {masalah} baris yang bermasalah (undang hanya {ringkas.ready} baris yang siap)
                  </span>
                </label>
              ) : (
                <span className="text-sm text-hijau">
                  Semua baris siap diundang.
                </span>
              )}
              {galatKirim ? (
                <p role="alert" className="m-0 text-sm font-medium text-galat">
                  {galatKirim}
                </p>
              ) : null}
            </div>

            <div className="flex items-center gap-3">
              <Link
                href={`/undangan/${invitationId}/tim`}
                className={`${tombolTerang} no-underline`}
              >
                Batal
              </Link>
              <button
                type="button"
                onClick={impor}
                disabled={!bisaImpor}
                className={tombolGelap}
              >
                {memproses
                  ? "Mengundang…"
                  : `Undang ${ringkas.ready} anggota`}
              </button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
