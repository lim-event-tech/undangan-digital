import type { Metadata } from "next";
import { Halaman, JudulAdmin, Notifikasi } from "@/components/admin-ui";
import { kartu, tombolBahaya, tombolTerang } from "@/components/ui";
import { db } from "@/db";
import { requireAdmin } from "@/lib/admin/guard";
import { can } from "@/lib/admin/roles";
import { formatStamp } from "@/lib/datetime";
import { formatPhone } from "@/lib/phone";
import { getWaConfig } from "@/lib/wa/config-service";
import { getWaManager, type WaStatus } from "@/lib/wa/manager";
import { platformSummary, recentFailures } from "@/lib/wa/queue";
import { listSessionRows } from "@/lib/wa/session-service";
import { keluarkanPenggunaAction, putuskanPenggunaAction } from "./actions";
import { FormPengaturanWa } from "./form-whatsapp";

export const metadata: Metadata = { title: "WhatsApp" };
export const dynamic = "force-dynamic";

const LABEL: Record<WaStatus, string> = {
  mati: "Terputus",
  menyambung: "Menyambung",
  "menunggu-qr": "Menunggu dipindai",
  terhubung: "Terhubung",
  keluar: "Belum ditautkan",
};

function Bagian({
  judul,
  keterangan,
  children,
}: {
  judul: string;
  keterangan?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`${kartu} flex flex-col gap-4 p-5 sm:p-6`}>
      <header>
        <h2 className="m-0 font-judul text-2xl font-medium">{judul}</h2>
        {keterangan ? (
          <p className="mt-1 mb-0 text-sm leading-relaxed text-redup">{keterangan}</p>
        ) : null}
      </header>
      {children}
    </section>
  );
}

export default async function WhatsappAdminPage() {
  const admin = await requireAdmin();

  return (
    <Halaman>
      <JudulAdmin
        bagian="Platform"
        judul="WhatsApp"
        keterangan="Setiap pengguna menautkan nomornya sendiri dari halaman Kirim undangan. Pesan masuk antrean dan dikirim satu per satu dengan jeda, memakai nomor orang yang menekan kirim."
      />
      {can(admin, "pengaturan") ? <Isi /> : (
        <Notifikasi jenis="info">Hanya Super admin yang bisa mengatur WhatsApp.</Notifikasi>
      )}
    </Halaman>
  );
}

async function Isi() {
  const [config, summary, failures, sessions] = await Promise.all([
    getWaConfig(db),
    platformSummary(db),
    recentFailures(db, { limit: 10 }),
    listSessionRows(db),
  ]);
  const hub = getWaManager();

  return (
    <>
      <Notifikasi jenis="info">
        Baileys adalah pustaka tidak resmi yang meniru WhatsApp Web. WhatsApp bisa membatasi atau
        memblokir nomor yang mengirim pesan massal. Sarankan pengguna memakai nomor khusus (bukan
        nomor pribadi), biarkan jeda antar pesan tetap lama, dan jangan jalankan lebih dari satu
        instance aplikasi.
      </Notifikasi>

      <Bagian
        judul="Nomor pengirim pengguna"
        keterangan="Sesi tersimpan di database dan tersambung kembali sendiri setelah aplikasi dinyalakan ulang. Anda bisa memutus atau mengeluarkan perangkat bila diperlukan."
      >
        <dl className="m-0 grid grid-cols-3 gap-3">
          {(
            [
              ["Menunggu", summary.menunggu + summary.mengirim],
              ["Terkirim (24 jam)", summary.terkirim],
              ["Gagal (24 jam)", summary.gagal],
            ] as const
          ).map(([label, nilai]) => (
            <div key={label} className="rounded-[10px] bg-kertas p-3">
              <dt className="text-xs text-redup">{label}</dt>
              <dd className="m-0 mt-0.5 font-judul text-2xl font-medium">{nilai}</dd>
            </div>
          ))}
        </dl>
        {sessions.length === 0 ? (
          <p className="m-0 text-sm text-redup-2">Belum ada pengguna yang menautkan nomor WhatsApp.</p>
        ) : (
          <ul className="m-0 flex list-none flex-col p-0">
            {sessions.map((s) => {
              const snapshot = hub.for(s.userId).snapshot();
              return (
                <li key={s.userId} className="flex flex-wrap items-center justify-between gap-3 border-t border-garis-halus py-3 first:border-t-0">
                  <div className="flex min-w-0 flex-col">
                    <span className="text-sm font-medium">{s.name}</span>
                    <span className="text-[13px] text-redup">{s.email}{s.nomor ? ` · ${formatPhone(s.nomor)}` : ""}</span>
                    <span className="text-[13px] text-redup-2">{LABEL[snapshot.status]}</span>
                  </div>
                  <div className="flex gap-2">
                    <form action={putuskanPenggunaAction}>
                      <input type="hidden" name="userId" value={s.userId} />
                      <button type="submit" className={tombolTerang}>Putuskan</button>
                    </form>
                    <form action={keluarkanPenggunaAction}>
                      <input type="hidden" name="userId" value={s.userId} />
                      <button type="submit" className={tombolBahaya}>Keluarkan perangkat</button>
                    </form>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Bagian>

      <Bagian
        judul="Pengaturan pengiriman"
        keterangan="Jeda antar pesan dan batas harian per nomor melindungi nomor pengirim. Antrean memproses satu pesan sekali jalan untuk tiap nomor, dan nomor yang sudah mencapai batas dilewati sampai kuotanya pulih."
      >
        <FormPengaturanWa config={config} />
      </Bagian>

      <Bagian judul="Gagal terkirim terbaru" keterangan="Sepuluh kegagalan terakhir dari semua pengguna.">
        {failures.length === 0 ? (
          <p className="m-0 text-sm text-redup-2">Belum ada pesan yang gagal.</p>
        ) : (
          <ul className="m-0 flex list-none flex-col p-0">
            {failures.map((f) => (
              <li
                key={f.id}
                className="flex flex-col gap-0.5 border-t border-garis-halus py-3 first:border-t-0"
              >
                <span className="text-sm font-medium">
                  {f.guestName} · {formatPhone(f.phone)}
                </span>
                <span className="text-[13px] text-redup">
                  {f.eventTitle}
                  {f.at ? ` · ${formatStamp(f.at)}` : ""}
                </span>
                <span className="text-[13px] text-galat">{f.error}</span>
              </li>
            ))}
          </ul>
        )}
      </Bagian>
    </>
  );
}
