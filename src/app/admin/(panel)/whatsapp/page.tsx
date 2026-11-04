import type { Metadata } from "next";
import QRCode from "qrcode";
import { Halaman, JudulAdmin, Notifikasi } from "@/components/admin-ui";
import { kartu } from "@/components/ui";
import { db } from "@/db";
import { requireAdmin } from "@/lib/admin/guard";
import { can } from "@/lib/admin/roles";
import { formatStamp } from "@/lib/datetime";
import { formatPhone } from "@/lib/phone";
import { getWaConfig } from "@/lib/wa/config-service";
import { getWaManager } from "@/lib/wa/manager";
import { platformSummary, recentFailures } from "@/lib/wa/queue";
import { FormPengaturanWa, FormUji } from "./form-whatsapp";
import { PanelKoneksi } from "./panel-koneksi";

export const metadata: Metadata = { title: "WhatsApp" };
export const dynamic = "force-dynamic";

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
        keterangan="Satu nomor pengirim untuk semua pengguna. Pesan masuk antrean dan dikirim satu per satu dengan jeda."
      />
      {can(admin, "pengaturan") ? <Isi /> : (
        <Notifikasi jenis="info">Hanya Super admin yang bisa mengatur WhatsApp.</Notifikasi>
      )}
    </Halaman>
  );
}

async function Isi() {
  const [config, summary, failures] = await Promise.all([
    getWaConfig(db),
    platformSummary(db),
    recentFailures(db, { limit: 10 }),
  ]);
  const snapshot = getWaManager().snapshot();
  const qrImage = snapshot.qr
    ? await QRCode.toDataURL(snapshot.qr, { margin: 1, width: 280, errorCorrectionLevel: "M" })
    : null;

  return (
    <>
      <Notifikasi jenis="info">
        Baileys adalah pustaka tidak resmi yang meniru WhatsApp Web. WhatsApp bisa membatasi atau
        memblokir nomor yang mengirim pesan massal. Pakai nomor khusus (bukan nomor pribadi),
        biarkan jeda antar pesan tetap lama, dan jangan jalankan lebih dari satu instance aplikasi.
      </Notifikasi>

      <Bagian
        judul="Koneksi"
        keterangan="Tautkan nomor pengirim dengan memindai QR dari menu Perangkat tertaut di WhatsApp. Sesi disimpan di database, jadi tersambung kembali sendiri setelah aplikasi dinyalakan ulang."
      >
        <PanelKoneksi
          awal={{
            status: snapshot.status,
            nomor: snapshot.nomor,
            galat: snapshot.galat,
            sejak: snapshot.sejak,
            qrImage,
            antrean: summary,
          }}
        />
      </Bagian>

      <Bagian
        judul="Pengaturan pengiriman"
        keterangan="Jeda antar pesan dan batas harian per pengguna melindungi nomor pengirim. Antrean memproses satu pesan sekali jalan, dan pengguna yang sudah mencapai batas dilewati sampai kuotanya pulih."
      >
        <FormPengaturanWa config={config} />
      </Bagian>

      <Bagian judul="Uji kirim" keterangan="Kirim satu pesan singkat ke nomor Anda untuk memastikan semuanya berfungsi.">
        <FormUji terhubung={snapshot.status === "terhubung"} />
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
