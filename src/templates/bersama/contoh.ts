import { readContent } from "@/lib/invitations/content";
import type { InvitationView } from "@/templates/types";
import type { TemplateKey } from "@/templates/registry";
import type { UcapanData } from "./jenis";

const UCAPAN_CONTOH: UcapanData[] = [
  {
    id: "contoh-1",
    nama: "Dian Permatasari",
    status: "hadir",
    waktu: "2 jam lalu",
    teks: "Terima kasih sudah mengadakan kegiatan ini. Sampai jumpa di acara!",
  },
  {
    id: "contoh-2",
    nama: "Rizky Ananda",
    status: "hadir",
    waktu: "5 jam lalu",
    teks: "Senang bisa berkumpul dan berbagi pengalaman bersama.",
  },
  {
    id: "contoh-3",
    nama: "Putri Wulandari",
    status: "tidak",
    waktu: "1 hari lalu",
    teks: "Maaf belum bisa hadir. Semoga acaranya berjalan lancar.",
  },
  {
    id: "contoh-4",
    nama: "Fajar Nugroho",
    status: "hadir",
    waktu: "1 hari lalu",
    teks: "Sampai jumpa, saya siap mengikuti kegiatan bersama.",
  },
  {
    id: "contoh-5",
    nama: "Ayu Lestari",
    status: "hadir",
    waktu: "2 hari lalu",
    teks: "Semoga kegiatan ini membawa inspirasi untuk kita semua.",
  },
  {
    id: "contoh-6",
    nama: "Bagas Saputra",
    status: "belum",
    waktu: "3 hari lalu",
    teks: "Semoga persiapan berjalan lancar sampai hari acara.",
  },
];

const ALAMAT = "Jl. Dago Atas No. 88, Coblong, Bandung";
const PETA = "https://www.google.com/maps/search/?api=1&query=Coblong%2C+Bandung";

export function contohView(now: number): InvitationView {
  return {
    mode: "contoh", slug: "contoh", token: "", title: "Seminar Kepemimpinan Organisasi",
    guest: { name: "Nama Tamu", maxAttendees: 2 },
    content: readContent({
      identitas: { jenis: "Seminar", subjudul: "Membangun organisasi yang adaptif dan berdampak", deskripsi: "Forum berbagi pengetahuan dan praktik kepemimpinan bagi para profesional dan pengelola organisasi." },
      penyelenggara: { nama: "[Nama instansi penyelenggara]", namaEo: "[Nama event organizer]" },
      sambutan: "Dengan hormat, kami mengundang Bapak/Ibu untuk menghadiri kegiatan ini. Kami berharap pertemuan ini dapat membuka ruang diskusi dan kerja sama yang bermanfaat.",
      pengisiAcara: [{ id: "10000000-0000-4000-8000-000000000001", nama: "[Nama narasumber]", peran: "Narasumber", instansi: "[Nama instansi]", profil: "Paparan dan diskusi mengenai pengembangan organisasi." }],
      informasiPeserta: { dressCode: "Busana formal atau batik", ketentuan: "Mohon hadir 30 menit sebelum sesi dimulai dan menyiapkan kode undangan.", petunjukLokasi: "Registrasi peserta berada di lobi utama gedung." },
      penutup: "Terima kasih atas perhatian dan kesediaan Bapak/Ibu untuk hadir. Sampai bertemu pada kegiatan kami.",
      ucapan: { tampil: true, tahan: false },
    }),
    events: [
      { id: "contoh-utama", key: "utama", name: "Sesi utama", sortOrder: 0, date: "2027-02-20", time: "09:00", endTime: "11:00", timezone: "WIB", venueName: "Aula Graha Puspa", address: ALAMAT, mapsUrl: PETA, response: null,
        agenda: [
          { id: "20000000-0000-4000-8000-000000000001", jam: "09:00", judul: "Pembukaan", keterangan: "Sambutan penyelenggara dan pengantar kegiatan." },
          { id: "20000000-0000-4000-8000-000000000002", jam: "09:30", judul: "Paparan utama", keterangan: "Pemaparan narasumber dan diskusi peserta." },
        ],
      },
      { id: "contoh-lanjutan", key: "lanjutan", name: "Diskusi dan jejaring", sortOrder: 1, date: "2027-02-20", time: "13:00", endTime: "15:00", timezone: "WIB", venueName: "Aula Graha Puspa", address: ALAMAT, mapsUrl: PETA, response: null, agenda: [] },
    ],
    photos: [], rsvp: { closed: false, deadline: "2027-02-15" },
    wishes: { items: [], page: 1, totalPages: 1, total: UCAPAN_CONTOH.length, lokal: UCAPAN_CONTOH },
    musicId: null, now,
  };
}

export function contohTemplateView(template: TemplateKey, now: number): InvitationView {
  const view = contohView(now);
  const contoh = {
    melati: { title: "Seminar Kepemimpinan Organisasi", jenis: "Seminar", subjudul: "Membangun organisasi yang adaptif dan berdampak", sesi: ["Seminar utama", "Diskusi dan jejaring"], tempat: "Aula Graha Puspa" },
    keraton: { title: "Rapat Kerja Nasional", jenis: "Rapat Kerja", subjudul: "Menyelaraskan arah dan prioritas organisasi", sesi: ["Sidang pembukaan", "Perumusan program kerja"], tempat: "Balai Pertemuan Puspa" },
    bintang: { title: "Malam Apresiasi Mitra", jenis: "Apresiasi", subjudul: "Mengapresiasi kontribusi, memperkuat kemitraan", sesi: ["Penyambutan mitra", "Penganugerahan apresiasi"], tempat: "Ballroom Graha Puspa" },
    pasundan: { title: "Forum Kolaborasi Daerah", jenis: "Forum", subjudul: "Merangkai gagasan untuk kemajuan bersama", sesi: ["Forum utama", "Diskusi kolaborasi"], tempat: "Pendopo Graha Puspa" },
  }[template];
  return {
    ...view, title: contoh.title,
    content: readContent({ ...view.content, identitas: { ...view.content.identitas, jenis: contoh.jenis, subjudul: contoh.subjudul, deskripsi: `Kegiatan ${contoh.title} mempertemukan peserta untuk berbagi gagasan, menyelaraskan tujuan, dan membangun kerja sama.` } }),
    events: view.events.map((event, i) => ({ ...event, name: contoh.sesi[i], venueName: contoh.tempat })),
  };
}
