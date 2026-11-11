import { readContent } from "@/lib/invitations/content";
import type { InvitationView } from "@/templates/types";
import type { TemplateKey } from "@/templates/registry";
const ALAMAT = "Jl. Dago Atas No. 88, Coblong, Bandung";
const PETA = "https://www.google.com/maps/search/?api=1&query=Coblong%2C+Bandung";

export function contohView(now: number): InvitationView {
  return {
    mode: "contoh", token: "", title: "Seminar Kepemimpinan Organisasi",
    guest: { name: "Nama Tamu", maxAttendees: 2 },
    content: readContent({
      identitas: { jenis: "Seminar", deskripsi: "Forum berbagi pengetahuan dan praktik kepemimpinan bagi para profesional dan pengelola organisasi." },
      penyelenggara: { nama: "Forum Nusantara", namaEo: "Ruang Temu" },
      sambutan: "Dengan hormat, kami mengundang Bapak/Ibu untuk menghadiri kegiatan ini. Kami berharap pertemuan ini dapat membuka ruang diskusi dan kerja sama yang bermanfaat.",
      pengisiAcara: [
        { id: "10000000-0000-4000-8000-000000000001", nama: "Maya Pramesti", peran: "Narasumber", instansi: "Forum Nusantara", profil: "Berbagi gagasan tentang kepemimpinan dan pengembangan organisasi." },
        { id: "10000000-0000-4000-8000-000000000002", nama: "Arif Wicaksono", peran: "Moderator", instansi: "Ruang Temu", profil: "Memandu percakapan dan diskusi bersama peserta." },
      ],
      kontak: { nama: "Sekretariat acara", email: "panitia@example.com" },
      penutup: "Terima kasih atas perhatian dan kesediaan Bapak/Ibu untuk hadir. Sampai bertemu pada kegiatan kami.",
    }),
    events: [
      { id: "contoh-utama", key: "utama", name: "Sesi utama", sortOrder: 0, date: "2027-02-20", endDate: null, dayTimes: [], time: "09:00", endTime: "11:00", timezone: "WIB", venueName: "Aula Graha Puspa", address: ALAMAT, mapsUrl: PETA, response: null,
        agenda: [
          { id: "20000000-0000-4000-8000-000000000001", jam: "09:00", judul: "Pembukaan", keterangan: "Sambutan penyelenggara dan pengantar kegiatan." },
          { id: "20000000-0000-4000-8000-000000000002", jam: "09:30", judul: "Paparan utama", keterangan: "Pemaparan narasumber dan diskusi peserta." },
        ],
      },
      { id: "contoh-lanjutan", key: "lanjutan", name: "Diskusi dan jejaring", sortOrder: 1, date: "2027-02-20", endDate: null, dayTimes: [], time: "13:00", endTime: "15:00", timezone: "WIB", venueName: "Aula Graha Puspa", address: ALAMAT, mapsUrl: PETA, response: null, agenda: [] },
    ],
    photos: [], rsvp: { closed: false, deadline: "2027-02-15T09:59:00.000Z" },
    now,
  };
}

export function contohTemplateView(template: TemplateKey, now: number): InvitationView {
  const view = contohView(now);
  const contoh = {
    melati: { title: "Seminar Kepemimpinan Organisasi", jenis: "Seminar", sesi: ["Seminar utama", "Diskusi dan jejaring"], tempat: "Aula Graha Puspa" },
    keraton: { title: "Rapat Kerja Nasional", jenis: "Rapat Kerja", sesi: ["Sidang pembukaan", "Perumusan program kerja"], tempat: "Balai Pertemuan Puspa" },
    bintang: { title: "Malam Apresiasi Mitra", jenis: "Apresiasi", sesi: ["Penyambutan mitra", "Penganugerahan apresiasi"], tempat: "Ballroom Graha Puspa" },
    pasundan: { title: "Forum Kolaborasi Daerah", jenis: "Forum", sesi: ["Forum utama", "Diskusi kolaborasi"], tempat: "Pendopo Graha Puspa" },
  }[template];
  return {
    ...view, title: contoh.title,
    content: readContent({ ...view.content, identitas: { ...view.content.identitas, jenis: contoh.jenis, deskripsi: `Kegiatan ${contoh.title} mempertemukan peserta untuk berbagi gagasan, menyelaraskan tujuan, dan membangun kerja sama.` } }),
    events: view.events.map((event, i) => ({ ...event, name: contoh.sesi[i], venueName: contoh.tempat })),
  };
}
