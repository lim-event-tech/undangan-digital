import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { judulHalaman, kartu, tombolTerang } from "@/components/ui";
import { db } from "@/db";
import { appBaseUrl, guestLink } from "@/lib/app-url";
import { dateFromDeadline, formatDate, formatStamp } from "@/lib/datetime";
import { countSent } from "@/lib/guests/sending";
import { listGuests } from "@/lib/guests/service";
import { readContent } from "@/lib/invitations/content";
import { getSettings } from "@/lib/platform/service";
import { getDashboard } from "@/lib/rsvp/dashboard";
import { requireInvitationById } from "@/lib/session";
import { DEFAULT_MESSAGE, deadlinePhrase, pickTemplate, renderMessage, whatsappLink } from "@/lib/whatsapp";
import { formatPhone } from "@/lib/phone";
import { countTargets } from "@/lib/wa/blast";
import { estimateMinutes } from "@/lib/wa/config";
import { getWaConfig } from "@/lib/wa/config-service";
import { getWaManager } from "@/lib/wa/manager";
import { invitationSummary, queuedGuestIds, recentFailures } from "@/lib/wa/queue";
import { tandaiBelumTerkirimAction } from "./actions";
import { FormPesan } from "./form-pesan";
import { PanelOtomatis } from "./panel-otomatis";
import { TombolKirim } from "./tombol-kirim";

export const metadata: Metadata = { title: "Kirim undangan" };

const MAKS_BARIS = 500;
const TAMPIL = ["semua", "belum", "terkirim", "pengingat"] as const;
type Tampil = (typeof TAMPIL)[number];

function satu(value: string | string[] | undefined): string | undefined {
  const v = Array.isArray(value) ? value[0] : value;
  return v === "" ? undefined : v;
}

export default async function KirimPage({ params, searchParams }: PageProps<"/undangan/[id]/kirim">) {
  const { invitation } = await requireInvitationById((await params).id);
  const sp = await searchParams;
  const q = satu(sp.q)?.slice(0, 100);
  const tampilParam = satu(sp.tampil);
  const tampil: Tampil = (TAMPIL as readonly string[]).includes(tampilParam ?? "")
    ? (tampilParam as Tampil)
    : "semua";

  const content = readContent(invitation.content);
  const pengingat = tampil === "pengingat";
  const pesanBawaan = (await getSettings(db)).pesanWaBawaan || DEFAULT_MESSAGE;
  const template = pickTemplate(tampil === "pengingat" ? "pengingat" : "undangan", content, pesanBawaan);
  const eventTitle = `${invitation.title}`;
  const deadlineText = invitation.rsvpDeadline
    ? formatDate(dateFromDeadline(invitation.rsvpDeadline))
    : null;
  const phrase = deadlinePhrase(deadlineText);

  const jenisAntrean = pengingat ? "pengingat" : "undangan";
  const [all, counts, dashboard, waConfig, ringkasan, kegagalan, antre, targetOtomatis] = await Promise.all([
    listGuests(db, invitation.id, { q }),
    countSent(db, invitation.id),
    getDashboard(db, invitation.id),
    getWaConfig(db),
    invitationSummary(db, invitation.id),
    recentFailures(db, { invitationId: invitation.id, limit: 5 }),
    queuedGuestIds(db, invitation.id, jenisAntrean),
    countTargets(db, invitation.id, jenisAntrean),
  ]);
  const waSnapshot = getWaManager().snapshot();
  const alasanOtomatis = !waConfig.aktif
    ? "Kirim otomatis belum diaktifkan oleh admin. Untuk sementara kirim lewat tombol WhatsApp di daftar tamu."
    : waSnapshot.status !== "terhubung"
      ? "WhatsApp pengirim sedang tidak terhubung. Hubungi admin, atau kirim lewat tombol WhatsApp di daftar tamu."
      : invitation.status !== "terbit"
        ? "Terbitkan undangan dulu sebelum mengirim."
        : null;
  const detail = new Map(dashboard.guests.map((g) => [g.id, g]));
  const belumMenjawab = (id: string) => detail.get(id)?.status === "belum";
  const rows = all.filter((g) => {
    if (tampil === "belum") return !g.sentAt;
    if (tampil === "terkirim") return Boolean(g.sentAt);
    if (tampil === "pengingat") return belumMenjawab(g.id);
    return true;
  });
  const shown = rows.slice(0, MAKS_BARIS);

  const firstGuest = rows[0] ?? all[0];
  const sample = {
    nama: firstGuest?.name ?? "Bapak Hendra",
    link: guestLink(invitation.slug, firstGuest?.token ?? "kode-tamu"),
    batas_rsvp: phrase,
    event: eventTitle,
  };

  function href(next: Tampil) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (next !== "semua") params.set("tampil", next);
    const query = params.toString();
    return `/undangan/${invitation.id}/kirim${query ? `?${query}` : ""}`;
  }

  const tabs: { key: Tampil; label: string; jumlah: number }[] = [
    { key: "semua", label: "Semua", jumlah: counts.total },
    { key: "belum", label: "Belum terkirim", jumlah: counts.total - counts.sent },
    { key: "terkirim", label: "Sudah terkirim", jumlah: counts.sent },
    { key: "pengingat", label: "Belum menjawab", jumlah: dashboard.totals.pending },
  ];

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-5">
      <div>
        <h1 className={`m-0 ${judulHalaman}`}>Kirim undangan</h1>
        <p className="mt-1 mb-0 text-sm text-redup">
          {counts.sent} dari {counts.total} tamu sudah dikirimi · kirim otomatis lewat antrean, atau
          buka WhatsApp dan tekan kirim sendiri
        </p>
      </div>

      {invitation.status !== "terbit" ? (
        <div
          role="status"
          className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] bg-jingga-bg p-4 text-sm leading-relaxed text-jingga"
        >
          <span>
            {invitation.status === "draf"
              ? "Undangan belum terbit, jadi tamu yang membuka link akan melihat “Undangan tidak ditemukan”. Terbitkan dulu sebelum mengirim."
              : "Undangan ini sedang ditangguhkan, jadi link tamu tidak bisa dibuka."}
          </span>
          {invitation.status === "draf" ? (
            <Link href={`/undangan/${invitation.id}/isi`} className="font-medium text-jingga underline">
              Buka Isi undangan
            </Link>
          ) : null}
        </div>
      ) : null}

      {pengingat ? (
        <FormPesan key={`pesan-pengingat-${invitation.id}`} jenis="pengingat" saved={content.pesanPengingat} sample={sample} />
      ) : (
        <FormPesan key={`pesan-undangan-${invitation.id}`} saved={content.pesanWa} sample={sample} bawaan={pesanBawaan} />
      )}

      <PanelOtomatis
        key={`antrean-${invitation.id}-${jenisAntrean}`}
        jenis={jenisAntrean}
        tersedia={alasanOtomatis === null}
        alasan={alasanOtomatis}
        target={targetOtomatis}
        estimasiMenit={estimateMinutes(targetOtomatis, waConfig)}
        jedaMin={Math.max(waConfig.jedaMin, 10)}
        batasHarian={waConfig.batasHarian}
        ringkasan={ringkasan}
        kegagalan={kegagalan.map((k) => ({ id: k.id, nama: k.guestName, error: k.error }))}
      />

      <section aria-labelledby="judul-daftar-kirim" className={`${kartu} flex flex-col gap-4 p-5 sm:p-6`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="judul-daftar-kirim" className="m-0 font-judul text-2xl font-medium">
            {pengingat ? "Ingatkan tamu yang belum menjawab" : "Kirim ke tamu"}
          </h2>
          <Form action={`/undangan/${invitation.id}/kirim`} className="flex gap-2">
            {tampil !== "semua" ? <input type="hidden" name="tampil" value={tampil} /> : null}
            <label className="sr-only" htmlFor="cari-kirim">
              Cari tamu
            </label>
            <input
              id="cari-kirim"
              type="search"
              name="q"
              defaultValue={q ?? ""}
              placeholder="Cari nama atau nomor"
              className="min-h-11 w-56 rounded-md border border-garis-input bg-white px-3 text-sm focus:border-emas-muda focus:ring-3 focus:ring-emas-muda/20 focus:outline-none"
            />
            <button type="submit" className={tombolTerang}>
              Cari
            </button>
          </Form>
        </div>

        <nav aria-label="Saring status kirim" className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <Link
              key={tab.key}
              href={href(tab.key)}
              aria-current={tab.key === tampil ? "page" : undefined}
              className={`inline-flex min-h-10 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-medium no-underline ${
                tab.key === tampil
                  ? "border-tinta bg-tinta text-white"
                  : "border-garis-input bg-white text-tinta-2 hover:bg-kertas"
              }`}
            >
              {tab.label}
              <span className={tab.key === tampil ? "text-white/80" : "text-redup"}>{tab.jumlah}</span>
            </Link>
          ))}
        </nav>

        {counts.total === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-garis-input p-8 text-center">
            <p className="m-0 text-sm text-redup-2">Belum ada tamu untuk dikirimi undangan.</p>
            <Link href={`/undangan/${invitation.id}/tamu`} className={`${tombolTerang} no-underline`}>
              Tambah tamu
            </Link>
          </div>
        ) : shown.length === 0 ? (
          <p className="m-0 rounded-lg bg-krem-2/60 p-6 text-center text-sm text-redup-2">
            {pengingat && !q ? "Semua tamu sudah menjawab. Tidak ada yang perlu diingatkan." : "Tidak ada tamu yang cocok."}
          </p>
        ) : (
          <ul className="m-0 flex list-none flex-col p-0">
            {shown.map((g) => {
              const message = renderMessage(template, {
                nama: g.name,
                link: guestLink(invitation.slug, g.token),
                batas_rsvp: phrase,
                event: eventTitle,
              });
              return (
                <li
                  key={g.id}
                  className="flex flex-wrap items-center justify-between gap-3 border-t border-garis-halus py-3 first:border-t-0"
                >
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="truncate font-medium">{g.name}</span>
                    <span className="text-[13px] text-redup">
                      {formatPhone(g.phone)}
                      {g.groupName ? ` · ${g.groupName}` : ""}
                    </span>
                    {antre.has(g.id) ? (
                      <span className="text-xs font-medium text-emas-tua">Dalam antrean WhatsApp</span>
                    ) : pengingat ? (
                      <span className="text-xs font-medium text-redup">
                        {detail.get(g.id)?.remindedAt
                          ? `Diingatkan ${formatStamp(detail.get(g.id)!.remindedAt!)}`
                          : "Belum diingatkan"}
                        {g.sentAt ? "" : " · undangan belum dikirim"}
                      </span>
                    ) : g.sentAt ? (
                      <div className="flex items-center gap-2 text-xs font-medium text-hijau">
                        Terkirim {formatStamp(g.sentAt)}
                        <form action={tandaiBelumTerkirimAction.bind(null, invitation.id)} className="inline">
                          <input type="hidden" name="id" value={g.id} />
                          <button
                            type="submit"
                            className="min-h-6 cursor-pointer border-0 bg-transparent p-0 text-xs font-medium text-redup underline hover:text-tinta"
                          >
                            Tandai belum
                          </button>
                        </form>
                      </div>
                    ) : (
                      <span className="text-xs font-medium text-redup">Belum dikirim</span>
                    )}
                  </div>
                  <TombolKirim
                    guestId={g.id}
                    nama={g.name}
                    href={whatsappLink(g.phone, message)}
                    terkirim={pengingat ? Boolean(detail.get(g.id)?.remindedAt) : Boolean(g.sentAt)}
                    pengingat={pengingat}
                  />
                </li>
              );
            })}
          </ul>
        )}

        {rows.length > MAKS_BARIS ? (
          <p className="m-0 text-[13px] text-redup">
            Menampilkan {MAKS_BARIS} dari {rows.length} tamu. Gunakan pencarian untuk mempersempit.
          </p>
        ) : null}
        <p className="m-0 text-xs text-redup">
          Link tamu memakai alamat {appBaseUrl()}.
        </p>
      </section>
    </div>
  );
}
