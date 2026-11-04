"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Ikon } from "@/components/ikon";
import { kartu, kolom, tombolGelap, tombolTerang } from "@/components/ui";
import {
  MAX_IMPORT_BYTES,
  MAX_IMPORT_ROWS,
  decodeCsvBytes,
  parseGuestCsv,
  parseGuestTable,
  phoneShownFrom,
  summarizeRows,
  validateImportRows,
  type ImportContext,
  type RawRow,
  type ValidatedRow,
} from "@/lib/guests/import";
import { formatPhone } from "@/lib/phone";
import { bacaXlsxAction, commitImportAction } from "./actions";

const kolomTabel = "px-3.5 py-3";

function KeteranganStatus({ row }: { row: ValidatedRow }) {
  if (row.status === "siap") {
    return (
      <span className="font-medium text-hijau">
        Siap{row.newGroup ? " · grup baru" : ""}
      </span>
    );
  }
  if (row.status === "duplikat") {
    const rujukan = row.duplicateOf?.startsWith("baris ")
      ? row.duplicateOf
      : `"${row.duplicateOf}"`;
    return (
      <span className="font-medium text-emas-tua">Sama dengan {rujukan}</span>
    );
  }
  return (
    <span className="font-medium text-jingga">{row.issues.join("; ")}</span>
  );
}

export function ImportClient({ context }: { context: ImportContext }) {
  const router = useRouter();
  const [namaBerkas, setNamaBerkas] = useState<string | null>(null);
  const [rows, setRows] = useState<RawRow[]>([]);
  const [bisaDiedit, setBisaDiedit] = useState<Set<number>>(new Set());
  const [galatBerkas, setGalatBerkas] = useState<string | null>(null);
  const [galatKirim, setGalatKirim] = useState<string | null>(null);
  const [lewati, setLewati] = useState(false);
  const [memproses, mulai] = useTransition();

  const validated = useMemo(
    () => validateImportRows(rows, context),
    [rows, context],
  );
  const ringkas = summarizeRows(validated);
  const masalah = ringkas.invalid + ringkas.duplicate;
  const bisaImpor =
    ringkas.ready > 0 && (masalah === 0 || lewati) && !memproses;

  async function pilihBerkas(file: File | undefined) {
    if (!file) return;
    setGalatBerkas(null);
    setGalatKirim(null);
    setLewati(false);

    if (file.size > MAX_IMPORT_BYTES) {
      setGalatBerkas(
        `File terlalu besar (maks. ${Math.round(MAX_IMPORT_BYTES / 1_000_000)} MB). Bagi file menjadi beberapa bagian.`,
      );
      return;
    }

    let hasil: ReturnType<typeof parseGuestCsv>;
    if (/.xlsx$/i.test(file.name)) {
      const data = new FormData();
      data.set("file", file);
      const dibaca = await bacaXlsxAction(data);
      hasil = dibaca.ok ? parseGuestTable(dibaca.table) : dibaca;
    } else {
      hasil = parseGuestCsv(decodeCsvBytes(await file.arrayBuffer()));
    }
    if (!hasil.ok) {
      setGalatBerkas(hasil.error);
      setRows([]);
      setNamaBerkas(null);
      return;
    }

    const awal = validateImportRows(hasil.rows, context);
    setBisaDiedit(
      new Set(awal.filter((r) => r.status !== "siap").map((r) => r.row)),
    );
    setRows(hasil.rows);
    setNamaBerkas(file.name);
  }

  function ubahBaris(nomor: number, kolomBaris: "nama" | "whatsapp", nilai: string) {
    setRows((semua) =>
      semua.map((r) => (r.row === nomor ? { ...r, [kolomBaris]: nilai } : r)),
    );
  }

  function ganti() {
    setRows([]);
    setNamaBerkas(null);
    setBisaDiedit(new Set());
    setLewati(false);
    setGalatKirim(null);
  }

  function impor() {
    setGalatKirim(null);
    mulai(async () => {
      const hasil = await commitImportAction(rows, lewati);
      if (hasil.ok) {
        router.push(
          `/undangan/tamu?diimpor=${hasil.imported}&dilewati=${hasil.skipped}`,
        );
      } else {
        setGalatKirim(hasil.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <section className={`${kartu} flex flex-wrap items-center gap-5 p-5`}>
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
                atau tarik file ke sini · maks. {MAX_IMPORT_ROWS} baris
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
            nama, whatsapp, grup, acara, maks_dewasa, maks_anak
          </code>
          <span>
            Acara dipisah titik koma, mis.{" "}
            <code className="rounded bg-krem-2 px-1.5 py-px">utama;lanjutan</code>
            . Acara kosong berarti semua acara. Kosongkan maks untuk memakai
            bawaan.{" "}
            Unduh contoh:{" "}
            <a href="/undangan/tamu/contoh.xlsx" className="text-emas">
              Excel
            </a>{" "}
            atau{" "}
            <a href="/undangan/tamu/contoh.csv" className="text-emas">
              CSV
            </a>
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
              {ringkas.ready} siap diimpor
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
                {ringkas.duplicate} nomor duplikat
              </span>
            ) : null}
          </div>

          <div className={`${kartu} relative overflow-x-auto`}>
            <table className="w-full min-w-205 border-collapse text-sm">
              <thead>
                <tr className="bg-kertas text-left text-xs tracking-[0.06em] text-redup-2 uppercase">
                  <th scope="col" className={`${kolomTabel} font-medium`}>Baris</th>
                  <th scope="col" className={`${kolomTabel} font-medium`}>Nama</th>
                  <th scope="col" className={`${kolomTabel} font-medium`}>WhatsApp</th>
                  <th scope="col" className={`${kolomTabel} font-medium`}>Grup</th>
                  <th scope="col" className={`${kolomTabel} font-medium`}>Acara</th>
                  <th scope="col" className={`${kolomTabel} text-center font-medium`}>Dewasa</th>
                  <th scope="col" className={`${kolomTabel} text-center font-medium`}>Anak</th>
                  <th scope="col" className={`${kolomTabel} font-medium`}>Status</th>
                </tr>
              </thead>
              <tbody>
                {validated.map((r, index) => {
                  const mentah = rows[index];
                  const bisaUbah = bisaDiedit.has(r.row);
                  const asal = phoneShownFrom(r);
                  const latar =
                    r.status === "perlu_diperbaiki"
                      ? "bg-galat-bg"
                      : r.status === "duplikat"
                        ? "bg-biru-bg"
                        : "";
                  const galatNama = r.issues.some((i) => i.startsWith("Nama"));
                  const galatNomor = r.status === "perlu_diperbaiki" && r.phone === null;
                  return (
                    <tr key={r.row} className={`border-t border-garis-halus ${latar}`}>
                      <td className={`${kolomTabel} text-redup`}>{r.row}</td>
                      <td className={`${kolomTabel} font-medium`}>
                        {bisaUbah ? (
                          <input
                            type="text"
                            value={mentah.nama}
                            onChange={(e) => ubahBaris(r.row, "nama", e.target.value)}
                            aria-label={`Nama baris ${r.row}`}
                            aria-invalid={galatNama ? true : undefined}
                            className={`${kolom} min-h-9.5 w-44`}
                          />
                        ) : (
                          r.name
                        )}
                      </td>
                      <td className={kolomTabel}>
                        {bisaUbah ? (
                          <input
                            type="tel"
                            value={mentah.whatsapp}
                            onChange={(e) => ubahBaris(r.row, "whatsapp", e.target.value)}
                            aria-label={`Nomor WhatsApp baris ${r.row}`}
                            aria-invalid={galatNomor ? true : undefined}
                            className={`${kolom} min-h-9.5 w-36`}
                          />
                        ) : (
                          <>
                            <span className="block whitespace-nowrap">
                              {r.phone ? formatPhone(r.phone) : r.phoneInput}
                            </span>
                            {asal ? (
                              <span className="text-xs text-redup">dari {asal}</span>
                            ) : null}
                          </>
                        )}
                      </td>
                      <td className={kolomTabel}>{r.groupName ?? <span className="text-redup">—</span>}</td>
                      <td className={kolomTabel}>{r.eventNames.join(", ")}</td>
                      <td className={`${kolomTabel} text-center`}>
                        {r.maxAdults}
                        {r.adultsFromDefault ? (
                          <span className="text-redup"> (bawaan)</span>
                        ) : null}
                      </td>
                      <td className={`${kolomTabel} text-center`}>
                        {r.maxChildren}
                        {r.childrenFromDefault ? (
                          <span className="text-redup"> (bawaan)</span>
                        ) : null}
                      </td>
                      <td className={kolomTabel}>
                        <KeteranganStatus row={r} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className={`${kartu} flex flex-wrap items-center justify-between gap-3.5 px-4.5 py-4`}>
            {masalah > 0 ? (
              <label className="flex min-h-11 items-center gap-2.5 text-sm">
                <input
                  type="checkbox"
                  checked={lewati}
                  onChange={(e) => setLewati(e.target.checked)}
                  className="size-5 accent-tinta"
                />
                Lewati {masalah} baris bermasalah dan impor sisanya
              </label>
            ) : (
              <span className="text-sm text-redup-2">Semua baris siap diimpor.</span>
            )}
            <div className="flex flex-wrap gap-2.5">
              <Link href="/undangan/tamu" className={`${tombolTerang} min-h-11.5 no-underline`}>
                Batal
              </Link>
              <button
                type="button"
                onClick={impor}
                disabled={!bisaImpor}
                className={`${tombolGelap} min-h-11.5 px-5`}
              >
                {memproses ? "Mengimpor…" : `Impor ${ringkas.ready} tamu`}
              </button>
            </div>
          </div>

          {galatKirim ? (
            <p role="alert" className="m-0 text-sm font-medium text-galat">
              {galatKirim}
            </p>
          ) : null}
          {masalah > 0 ? (
            <p className="-mt-2 mb-0 text-[13px] text-redup">
              Perbaiki baris bermasalah atau centang lewati. Baris bermasalah
              tidak pernah masuk tanpa persetujuan Anda.
            </p>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
