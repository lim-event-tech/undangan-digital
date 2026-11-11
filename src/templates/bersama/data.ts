import { normalizePhone } from "@/lib/phone";
import { buildIcs, calendarSlots, googleCalendarUrl } from "@/lib/calendar";
import { formatDate, formatDateRange, formatDeadline, formatDayLabel, formatDots, formatLongDate, formatLongDateRange, formatTime } from "@/lib/datetime";
import { dayWindow, eventDays, timeOptions } from "@/lib/events/days";
import type { BagianId } from "@/lib/invitations/content";
import type { InvitationView } from "@/templates/types";
import type { DataUndangan } from "./jenis";
import { kotaDari, tanggalKata } from "./teks";

export const PENUTUP_BAWAAN =
  "Merupakan kehormatan dan kebahagiaan bagi kami apabila Anda berkenan hadir dalam acara ini.";

const foto = (id: string) => `/foto/${id}`;

export function siapkanData(view: InvitationView): DataUndangan {
  const { content, events, photos } = view;
  const pertama = events.find((e) => e.date) ?? null;
  const tanggal = pertama?.date ?? null;
  const kota = kotaDari(pertama?.address ?? null);
  const dasar = `/${view.token}`;
  const tamu = view.mode === "tamu";

  const daftarSlot = calendarSlots(
      events.map((e) => ({
        id: e.id,
        name: e.name,
        date: e.date,
        endDate: e.endDate,
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
    const tgl = e.date ? formatLongDateRange(e.date, e.endDate) : "Tanggal menyusul";
    const hari = eventDays(e).map((date) => {
      const jendela = dayWindow(e, date);
      return {
        date,
        label: formatDayLabel(date),
        jam: jendela.start ? `${jendela.start.replace(":", ".")}${jendela.end ? `–${jendela.end.replace(":", ".")}` : ""} ${e.timezone}` : "",
        mulai: jendela.start,
        opsi: timeOptions(jendela.start, jendela.end),
      };
    });
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
      hari,
    };
  });

  const jawaban: DataUndangan["jawaban"] = {};
  for (const e of events) {
    if (!e.response) continue;
    jawaban[e.id] = {
      hadir: e.response.attending,
      peserta: e.response.attendeeCount,
      pesan: e.response.note,
      kunjungan: e.response.visits,
    };
  }

  const phone = normalizePhone(content.kontak.telepon);
  const kontakWhatsapp = phone.ok ? `https://wa.me/${phone.value.slice(1)}` : null;
  const kontakEmail = content.kontak.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(content.kontak.email) ? `mailto:${encodeURIComponent(content.kontak.email)}` : null;
  const poster = photos.find((p) => p.kind === "cover");
  const logoPenyelenggara = photos.find((p) => p.kind === "logo_penyelenggara");
  const logoEo = photos.find((p) => p.kind === "logo_eo");
  const tersedia: Record<BagianId, boolean> = {
    sampul: true,
    tentang: Boolean(content.identitas.deskripsi.trim()),
    salam: Boolean(content.sambutan.trim()),
    penyelenggara: Boolean(content.penyelenggara.nama.trim() || content.penyelenggara.namaEo.trim() || photos.some((p) => p.kind === "logo_penyelenggara" || p.kind === "logo_eo")),
    agenda: events.some((e) => e.agenda.length > 0),
    pengisi: content.pengisiAcara.length > 0,
    kontak: Boolean(content.kontak.nama.trim() && (kontakWhatsapp || kontakEmail)),
    acara: events.length > 0,
    rsvp: events.length > 0,
    penutup: true,
  };
  const sembunyi = new Set<BagianId>(content.susunan.sembunyi);
  const urutan = content.susunan.urutan.filter((id) => tersedia[id] && !sembunyi.has(id));

  return {
    mode: view.mode,
    token: view.token,
    judul: view.title,
    tglTitik: tanggal ? formatDots(tanggal) : "",
    tglTitikTengah: tanggal ? formatDots(tanggal).replaceAll(" . ", " · ") : "",
    tglPanjang: tanggal ? (pertama?.endDate ? formatDateRange(tanggal, pertama.endDate) : formatLongDate(tanggal)) : "",
    tglBesar: tanggal ? formatLongDateRange(tanggal, pertama?.endDate ?? null).toUpperCase() : "",
    tglKata: tanggal ? tanggalKata(tanggal) : "",
    tglKota: tanggal ? [formatDate(tanggal), kota].filter(Boolean).join(", ") : kota,
    identitas: content.identitas,
    penyelenggara: content.penyelenggara,
    pengisiAcara: content.pengisiAcara.map(item => {
      const p = photos.find(p => p.id === item.fotoId && p.kind === "pengisi_acara");
      return { ...item, foto: p ? { src: foto(p.id), width: p.width || 400, height: p.height || 500 } : null };
    }),
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
    batasRsvp: view.rsvp.deadline ? formatDeadline(new Date(view.rsvp.deadline)) : null,
    kalender,
    poster: poster ? { src: foto(poster.id), width: poster.width || 1080, height: poster.height || 1920 } : null,
    sembunyikanTeksSampul: Boolean(poster) && content.sampul.sembunyikanTeks,
    tampilan: content.tampilan,
    urutan,
    qr: tamu && content.checkin.aktif ? `${dasar}/qr` : null,
  };
}
