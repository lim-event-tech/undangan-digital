import { normalizePhone } from "@/lib/phone";
import { buildIcs, calendarSlots, googleCalendarUrl } from "@/lib/calendar";
import { countdownTarget } from "@/lib/countdown";
import { formatDate, formatDots, formatLongDate, formatTime } from "@/lib/datetime";
import type { BagianId } from "@/lib/invitations/content";
import type { InvitationView } from "@/templates/types";
import type { DataUndangan, HalamanUcapan } from "./jenis";
import { rasioFoto, susunLajur } from "./pola-galeri";
import { FOTO_CONTOH } from "./aset-contoh";
import { DEFAULT_TEMPLATE, type TemplateKey } from "@/templates/registry";
import { kotaDari, tanggalKata } from "./teks";

export const PENUTUP_BAWAAN =
  "Merupakan kehormatan dan kebahagiaan bagi kami apabila Anda berkenan hadir dalam acara ini.";

const foto = (id: string) => `/foto/${id}`;

export function siapkanData(view: InvitationView, template: TemplateKey = DEFAULT_TEMPLATE): DataUndangan {
  const { content, events, photos } = view;
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
        endTime: e.endTime,
        timezone: e.timezone,
        venueName: e.venueName,
        address: e.address,
        mapsUrl: e.mapsUrl,
      })),
      view.title,
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
      jam: e.time ? `${e.time.slice(0, 5)}${e.endTime ? `–${e.endTime.slice(0, 5)}` : ""} ${e.timezone}` : "Waktu menyusul",
      agenda: e.agenda.map((item) => ({ ...item, jam: formatTime(item.jam, e.timezone) })),
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
      peserta: e.response.attendeeCount,
      pesan: e.response.note,
    };
  }

  const target = content.hitungMundur.aktif ? countdownTarget(events) : null;
  const galeriFoto = photos.filter((p) => p.kind === "galeri");
  const sumberGaleri =
    galeriFoto.length === 0 && view.mode === "contoh"
      ? [FOTO_CONTOH[template], ...Object.entries(FOTO_CONTOH).filter(([key]) => key !== template).map(([, value]) => value)].map((p, i) => ({ id: `contoh-${i}`, src: p.src, rasio: rasioFoto(p.width, p.height) }))
      : galeriFoto.map((p) => ({ id: p.id, src: foto(p.id), rasio: rasioFoto(p.width, p.height) }));
  const lajurGaleri = susunLajur(sumberGaleri.map((p) => p.rasio));
  const sizes = lajurGaleri.length > 1 ? "(max-width: 430px) 50vw, 215px" : "(max-width: 430px) 100vw, 430px";
  const galeri = sumberGaleri.map((p) => ({
    id: p.id,
    src: p.src,
    rasio: `${p.rasio.lebar} / ${p.rasio.tinggi}`,
    sizes,
  }));
  const ucapan: DataUndangan["ucapan"] =
    content.ucapan.tampil && view.wishes ? view.wishes : null;

  const phone = normalizePhone(content.kontak.telepon);
  const kontakWhatsapp = phone.ok ? `https://wa.me/${phone.value.slice(1)}` : null;
  const kontakEmail = content.kontak.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(content.kontak.email) ? `mailto:${encodeURIComponent(content.kontak.email)}` : null;
  const logoPenyelenggara = photos.find((p) => p.kind === "logo_penyelenggara");
  const logoEo = photos.find((p) => p.kind === "logo_eo");
  const tersedia: Record<BagianId, boolean> = {
    sampul: true,
    pembuka: true,
    tentang: Boolean(content.identitas.deskripsi.trim()),
    salam: Boolean(content.sambutan.trim()),
    penyelenggara: Boolean(content.penyelenggara.nama.trim() || content.penyelenggara.namaEo.trim() || photos.some((p) => p.kind === "logo_penyelenggara" || p.kind === "logo_eo")),
    agenda: events.some((e) => e.agenda.length > 0),
    pengisi: content.pengisiAcara.length > 0,
    informasi: Object.values(content.informasiPeserta).some((value) => value.trim()),
    kontak: Boolean(content.kontak.nama.trim() && (kontakWhatsapp || kontakEmail)),
    hitung: target !== null,
    acara: events.length > 0,
    galeri: galeri.length > 0,
    rsvp: events.length > 0,
    ucapan: ucapan !== null,
    penutup: true,
  };
  const sembunyi = new Set<BagianId>(content.susunan.sembunyi);
  const urutan = content.susunan.urutan.filter((id) => tersedia[id] && !sembunyi.has(id));

  return {
    mode: view.mode,
    slug: view.slug,
    token: view.token,
    judul: view.title,
    tglTitik: tanggal ? formatDots(tanggal) : "",
    tglTitikTengah: tanggal ? formatDots(tanggal).replaceAll(" . ", " · ") : "",
    tglPanjang: tanggal ? formatLongDate(tanggal) : "",
    tglBesar: tanggal ? formatLongDate(tanggal).toUpperCase() : "",
    tglKata: tanggal ? tanggalKata(tanggal) : "",
    tglKota: tanggal ? [formatDate(tanggal), kota].filter(Boolean).join(", ") : kota,
    identitas: content.identitas,
    penyelenggara: content.penyelenggara,
    pengisiAcara: content.pengisiAcara,
    informasiPeserta: content.informasiPeserta,
    kontak: content.kontak,
    kontakWhatsapp,
    kontakEmail,
    logoPenyelenggara: logoPenyelenggara ? { src: foto(logoPenyelenggara.id), width: logoPenyelenggara.width || 180, height: logoPenyelenggara.height || 100 } : null,
    logoEo: logoEo ? { src: foto(logoEo.id), width: logoEo.width || 180, height: logoEo.height || 100 } : null,
    sambutan: content.sambutan.trim(),
    penutup: content.penutup.trim() || PENUTUP_BAWAAN,
    namaTamu: view.guest.name,
    maksPeserta: Math.max(1, view.guest.maxAttendees),
    acara,
    jawaban,
    rsvpTutup: view.rsvp.closed,
    batasRsvp: view.rsvp.deadline ? formatDate(view.rsvp.deadline) : null,
    hitung: target ? { target: target.getTime(), detik: content.hitungMundur.detik } : null,
    sekarang: view.now,
    kalender,
    galeri,
    lajurGaleri,
    ucapan,
    musik: content.musik.aktif && view.musicId ? `/musik/${view.musicId}` : null,
    urutan,
    qr: tamu && content.checkin.aktif ? `${dasar}/qr` : null,
  };
}

export function halamanKosong(): HalamanUcapan {
  return { items: [], page: 1, totalPages: 1, total: 0 };
}
