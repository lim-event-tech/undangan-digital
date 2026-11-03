import { buildIcs, calendarSlots, googleCalendarUrl } from "@/lib/calendar";
import { countdownTarget } from "@/lib/countdown";
import { formatDate, formatDots, formatLongDate, formatTime } from "@/lib/datetime";
import type { BagianId } from "@/lib/invitations/content";
import type { InvitationView } from "@/templates/types";
import type { DataUndangan, HalamanUcapan } from "./jenis";
import { RASIO_CONTOH, rasioFoto, susunLajur } from "./pola-galeri";
import { kotaDari, tanggalKata } from "./teks";

export const PENUTUP_BAWAAN =
  "Merupakan kehormatan dan kebahagiaan bagi kami apabila Anda berkenan hadir dan memberikan doa restu.";

const foto = (id: string) => `/foto/${id}`;

export function siapkanData(view: InvitationView): DataUndangan {
  const { content, events, photos } = view;
  const pasangan = `${view.groomName} & ${view.brideName}`;
  const pertama = events.find((e) => e.date) ?? null;
  const tanggal = pertama?.date ?? null;
  const kota = kotaDari(pertama?.address ?? null);
  const dasar = `/${view.slug}/${view.token}`;
  const tamu = view.mode === "tamu";

  const daftarSlot = calendarSlots(
      events.map((e) => ({
        id: e.id,
        name: e.name,
        date: e.date,
        time: e.time,
        timezone: e.timezone,
        venueName: e.venueName,
        address: e.address,
        mapsUrl: e.mapsUrl,
      })),
      pasangan,
    );
  const slots = new Map(daftarSlot.map((slot) => [slot.id, slot]));
  const kalender =
    daftarSlot.length === 0
      ? null
      : tamu
        ? `${dasar}/kalender`
        : `data:text/calendar;charset=utf-8,${encodeURIComponent(
            buildIcs(daftarSlot, { uidDomain: "pratinjau.undangandigital", now: new Date(view.now) }),
          )}`;

  const acara = events.map((e) => {
    const tgl = e.date ? formatLongDate(e.date) : "Tanggal menyusul";
    const slot = slots.get(e.id);
    return {
      id: e.id,
      nama: e.name,
      tgl,
      tglBesar: tgl.toUpperCase(),
      jam: e.time ? formatTime(e.time, e.timezone) : "Waktu menyusul",
      tempat: e.venueName ?? "",
      alamat: e.address ?? "",
      peta: e.mapsUrl,
      kalender: slot ? googleCalendarUrl(slot) : null,
    };
  });

  const jawaban: DataUndangan["jawaban"] = {};
  for (const e of events) {
    if (!e.response) continue;
    jawaban[e.id] = {
      hadir: e.response.attending,
      dewasa: e.response.adults,
      anak: e.response.children,
      pesan: e.response.note,
    };
  }

  const target = content.hitungMundur.aktif ? countdownTarget(events) : null;
  const galeriFoto = photos.filter((p) => p.kind === "galeri");
  const sumberGaleri =
    galeriFoto.length === 0 && view.mode === "contoh"
      ? RASIO_CONTOH.map((rasio, i) => ({ id: `contoh-${i}`, src: "", rasio }))
      : galeriFoto.map((p) => ({ id: p.id, src: foto(p.id), rasio: rasioFoto(p.width, p.height) }));
  const lajurGaleri = susunLajur(sumberGaleri.map((p) => p.rasio));
  const sizes = lajurGaleri.length > 1 ? "(max-width: 430px) 50vw, 215px" : "(max-width: 430px) 100vw, 430px";
  const galeri = sumberGaleri.map((p) => ({
    id: p.id,
    src: p.src,
    rasio: `${p.rasio.lebar} / ${p.rasio.tinggi}`,
    sizes,
  }));
  const rekening = content.amplop.filter((r) => r.nomor.trim());
  const qrisFoto = photos.find((p) => p.kind === "qris");
  const fotoPria = photos.find((p) => p.kind === "pria");
  const fotoWanita = photos.find((p) => p.kind === "wanita");
  const cerita = content.cerita.filter((m) => m.judul.trim() || m.teks.trim());
  const ucapan: DataUndangan["ucapan"] =
    content.ucapan.tampil && view.wishes ? view.wishes : null;

  const tersedia: Record<BagianId, boolean> = {
    sampul: true,
    pembuka: true,
    salam: Boolean(content.kutipan.trim() || content.sambutan.trim()),
    mempelai: true,
    hitung: target !== null,
    acara: events.length > 0,
    cerita: cerita.length > 0,
    galeri: galeri.length > 0,
    rsvp: events.length > 0,
    ucapan: ucapan !== null,
    amplop: rekening.length > 0 || Boolean(qrisFoto),
    penutup: true,
  };
  const sembunyi = new Set<BagianId>(content.susunan.sembunyi);
  const urutan = content.susunan.urutan.filter((id) => tersedia[id] && !sembunyi.has(id));

  return {
    mode: view.mode,
    slug: view.slug,
    token: view.token,
    pria: view.groomName,
    wanita: view.brideName,
    priaLengkap: content.pria.namaLengkap.trim() || view.groomName,
    wanitaLengkap: content.wanita.namaLengkap.trim() || view.brideName,
    priaOrtu: content.pria.orangTua.trim(),
    wanitaOrtu: content.wanita.orangTua.trim(),
    fotoPria: fotoPria ? foto(fotoPria.id) : null,
    fotoWanita: fotoWanita ? foto(fotoWanita.id) : null,
    tglTitik: tanggal ? formatDots(tanggal) : "",
    tglTitikTengah: tanggal ? formatDots(tanggal).replaceAll(" . ", " · ") : "",
    tglPanjang: tanggal ? formatLongDate(tanggal) : "",
    tglBesar: tanggal ? formatLongDate(tanggal).toUpperCase() : "",
    tglKata: tanggal ? tanggalKata(tanggal) : "",
    tglKota: tanggal ? [formatDate(tanggal), kota].filter(Boolean).join(", ") : kota,
    kutipan: content.kutipan.trim(),
    sambutan: content.sambutan.trim(),
    penutup: content.penutup.trim() || PENUTUP_BAWAAN,
    namaTamu: view.guest.name,
    maksDewasa: Math.max(1, view.guest.maxAdults),
    maksAnak: Math.max(0, view.guest.maxChildren),
    acara,
    jawaban,
    rsvpTutup: view.rsvp.closed,
    batasRsvp: view.rsvp.deadline ? formatDate(view.rsvp.deadline) : null,
    hitung: target ? { target: target.getTime(), detik: content.hitungMundur.detik } : null,
    sekarang: view.now,
    kalender,
    cerita,
    galeri,
    lajurGaleri,
    rekening,
    qris: qrisFoto ? foto(qrisFoto.id) : null,
    ucapan,
    musik: content.musik.aktif && view.musicId ? `/musik/${view.musicId}` : null,
    urutan,
    qr: tamu ? `${dasar}/qr` : null,
  };
}

export function halamanKosong(): HalamanUcapan {
  return { items: [], page: 1, totalPages: 1, total: 0 };
}
