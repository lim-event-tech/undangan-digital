import { kartu } from "@/components/ui";
import { formatShortDay } from "@/lib/datetime";
import type { DashboardCharts, DashboardTotals } from "@/lib/rsvp/dashboard";

function persen(bagian: number, total: number): number {
  return total > 0 ? Math.round((bagian / total) * 100) : 0;
}

function KartuGrafik({
  id,
  judul,
  keterangan,
  children,
}: {
  id: string;
  judul: string;
  keterangan?: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={id} className={`${kartu} flex flex-col gap-4 p-5`}>
      <div>
        <h3 id={id} className="m-0 font-judul text-xl font-medium">
          {judul}
        </h3>
        {keterangan ? <p className="mt-1 mb-0 text-xs text-redup">{keterangan}</p> : null}
      </div>
      {children}
    </section>
  );
}

const SEGMEN = [
  { key: "hadir", label: "Hadir", warna: "bg-hijau" },
  { key: "tidak", label: "Tidak hadir", warna: "bg-galat" },
  { key: "belum", label: "Belum menjawab", warna: "bg-garis-input" },
] as const;

function StatusJawaban({ totals }: { totals: DashboardTotals }) {
  const nilai = {
    hadir: totals.attending,
    tidak: totals.notAttending,
    belum: totals.pending,
  };
  const ringkas = SEGMEN.map((s) => `${s.label} ${nilai[s.key]}`).join(", ");
  return (
    <KartuGrafik id="grafik-status" judul="Status jawaban" keterangan="Seluruh tamu yang diundang">
      <div
        role="img"
        aria-label={`Status jawaban dari ${totals.invited} tamu: ${ringkas}`}
        className="flex h-5 w-full overflow-hidden rounded-full bg-krem-2"
      >
        {SEGMEN.map((s) =>
          nilai[s.key] > 0 ? (
            <div
              key={s.key}
              className={s.warna}
              style={{ width: `${(nilai[s.key] / totals.invited) * 100}%` }}
            />
          ) : null,
        )}
      </div>
      <ul className="m-0 flex list-none flex-wrap gap-x-5 gap-y-2 p-0 text-sm">
        {SEGMEN.map((s) => (
          <li key={s.key} className="flex items-center gap-2">
            <span aria-hidden="true" className={`size-2.5 rounded-full ${s.warna}`} />
            <span className="text-redup-2">{s.label}</span>
            <span className="font-medium lining-nums">
              {nilai[s.key]} ({persen(nilai[s.key], totals.invited)}%)
            </span>
          </li>
        ))}
      </ul>
    </KartuGrafik>
  );
}

function Corong({ langkah }: { langkah: DashboardCharts["funnel"] }) {
  const dasar = langkah[0]?.count ?? 0;
  return (
    <KartuGrafik
      id="grafik-corong"
      judul="Dari link sampai kursi"
      keterangan="Berapa tamu yang sampai di tiap tahap"
    >
      <ol className="m-0 flex list-none flex-col gap-3 p-0">
        {langkah.map((item, index) => {
          const sebelumnya = index > 0 ? langkah[index - 1].count : null;
          const lebar = dasar > 0 ? (item.count / dasar) * 100 : 0;
          return (
            <li key={item.key} className="flex flex-col gap-1">
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="text-redup-2">{item.label}</span>
                <span className="font-medium lining-nums">
                  {item.count}
                  <span className="ml-1.5 text-xs font-normal text-redup">
                    {persen(item.count, dasar)}%
                    {sebelumnya !== null && sebelumnya > item.count
                      ? ` · turun ${sebelumnya - item.count}`
                      : ""}
                  </span>
                </span>
              </div>
              <div
                role="img"
                aria-label={`${item.label}: ${item.count} dari ${dasar} tamu`}
                className="h-3 w-full overflow-hidden rounded-full bg-krem-2"
              >
                <div
                  className="h-full rounded-full bg-emas-muda"
                  style={{ width: `${lebar}%`, minWidth: item.count > 0 ? "4px" : undefined }}
                />
              </div>
            </li>
          );
        })}
      </ol>
      <p className="m-0 text-xs leading-relaxed text-redup">
        “Terkirim” dihitung dari tombol di halaman Kirim undangan. “Sudah membuka link” dihitung
        saat tamu pertama kali membuka undangan yang sudah terbit.
      </p>
    </KartuGrafik>
  );
}

function PerHari({ harian }: { harian: DashboardCharts["daily"] }) {
  const puncak = harian.reduce((max, titik) => Math.max(max, titik.count), 0);
  const total = harian.reduce((sum, titik) => sum + titik.count, 0);
  const pertama = harian[0];
  const terakhir = harian[harian.length - 1];
  return (
    <KartuGrafik
      id="grafik-harian"
      judul="Jawaban per hari"
      keterangan="Jumlah tamu menurut hari jawaban terakhirnya (WIB)"
    >
      {harian.length === 0 ? (
        <p className="m-0 rounded-lg bg-krem-2/60 p-5 text-center text-sm text-redup-2">
          Belum ada tamu yang menjawab.
        </p>
      ) : (
        <>
          <div
            role="img"
            aria-label={`Jawaban per hari dari ${formatShortDay(pertama.date)} sampai ${formatShortDay(terakhir.date)}: ${total} tamu, terbanyak ${puncak} dalam sehari`}
            className="flex h-36 items-end gap-0.5 border-b border-garis"
          >
            {harian.map((titik) => (
              <div
                key={titik.date}
                title={`${formatShortDay(titik.date)}: ${titik.count} tamu`}
                className="flex h-full min-w-[3px] flex-1 items-end"
              >
                <div
                  className="w-full rounded-t-sm bg-emas-muda"
                  style={{
                    height: titik.count > 0 ? `${Math.max(4, (titik.count / puncak) * 100)}%` : "0",
                  }}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between gap-2 text-xs text-redup lining-nums">
            <span>{formatShortDay(pertama.date)}</span>
            <span>Terbanyak {puncak} tamu dalam sehari</span>
            <span>{formatShortDay(terakhir.date)}</span>
          </div>
        </>
      )}
    </KartuGrafik>
  );
}

function PerGrup({ grup }: { grup: DashboardCharts["groups"] }) {
  return (
    <KartuGrafik
      id="grafik-grup"
      judul="Rincian per grup"
      keterangan="Status jawaban tamu di tiap grup"
    >
      <ul className="m-0 flex list-none flex-col gap-3.5 p-0">
        {grup.map((g) => (
          <li key={g.groupId ?? "tanpa-grup"} className="flex flex-col gap-1.5">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
              <span className="font-medium">{g.name}</span>
              <span className="text-xs text-redup lining-nums">
                {g.total} tamu · hadir {g.hadir} · tidak {g.tidak} · belum {g.belum}
                {g.hadir > 0
                  ? ` · ${g.adults} dewasa${g.children > 0 ? `, ${g.children} anak` : ""}`
                  : ""}
              </span>
            </div>
            <div
              role="img"
              aria-label={`${g.name}: hadir ${g.hadir}, tidak hadir ${g.tidak}, belum menjawab ${g.belum}`}
              className="flex h-3 w-full overflow-hidden rounded-full bg-krem-2"
            >
              {SEGMEN.map((s) =>
                g[s.key] > 0 ? (
                  <div
                    key={s.key}
                    className={s.warna}
                    style={{ width: `${(g[s.key] / g.total) * 100}%` }}
                  />
                ) : null,
              )}
            </div>
          </li>
        ))}
      </ul>
    </KartuGrafik>
  );
}

export function GrafikRingkasan({
  totals,
  charts,
}: {
  totals: DashboardTotals;
  charts: DashboardCharts;
}) {
  return (
    <section aria-labelledby="judul-grafik" className="flex flex-col gap-3">
      <h2 id="judul-grafik" className="m-0 font-judul text-2xl font-medium">
        Gambaran jawaban
      </h2>
      <div className="grid gap-4 lg:grid-cols-2">
        <StatusJawaban totals={totals} />
        <Corong langkah={charts.funnel} />
        <PerHari harian={charts.daily} />
        <PerGrup grup={charts.groups} />
      </div>
    </section>
  );
}
