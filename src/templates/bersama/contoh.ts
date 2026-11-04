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
  const content = readContent({
    kutipan:
      "Pertemuan menjadi awal untuk berbagi inspirasi dan membangun kebersamaan.",
    sambutan:
      "Kami mengundang Bapak, Ibu, dan Saudara untuk hadir pada Gathering Komunitas. Mari bertemu dan berbagi inspirasi bersama.",
    cerita: [
      {
        tahun: "2019",
        judul: "Awal komunitas",
        teks: "Komunitas dimulai dari pertemuan kecil untuk berbagi ide dan pengalaman.",
      },
      {
        tahun: "2022",
        judul: "Tumbuh bersama",
        teks: "Anggota berkolaborasi dalam berbagai kegiatan kreatif dan sosial.",
      },
      {
        tahun: "2026",
        judul: "Gathering tahunan",
        teks: "Kami kembali berkumpul untuk merayakan perjalanan dan merencanakan kegiatan berikutnya.",
      },
    ],
    amplop: [
      { bank: "[Nama bank]", nomor: "[Nomor rekening]", atasNama: "Komunitas Kreatif" },
      { bank: "[Nama bank]", nomor: "[Nomor rekening]", atasNama: "Panitia Acara" },
    ],
  });

  return {
    mode: "contoh",
    slug: "contoh",
    token: "",
    title: "Gathering Komunitas",
    guest: { name: "Nama Tamu", maxAdults: 2, maxChildren: 2 },
    content,
    events: [
      {
        id: "contoh-utama",
        key: "utama",
        name: "Acara utama",
        sortOrder: 0,
        date: "2026-12-12",
        time: "08:00",
        timezone: "WIB",
        venueName: "Aula Graha Puspa",
        address: ALAMAT,
        mapsUrl: PETA,
        response: null,
      },
      {
        id: "contoh-lanjutan",
        key: "lanjutan",
        name: "Sesi lanjutan",
        sortOrder: 1,
        date: "2026-12-12",
        time: "11:00",
        timezone: "WIB",
        venueName: "Aula Graha Puspa",
        address: ALAMAT,
        mapsUrl: PETA,
        response: null,
      },
    ],
    photos: [],
    rsvp: { closed: false, deadline: "2026-12-05" },
    wishes: {
      items: UCAPAN_CONTOH.slice(0, 4),
      page: 1,
      totalPages: Math.ceil(UCAPAN_CONTOH.length / 4),
      total: UCAPAN_CONTOH.length,
      lokal: UCAPAN_CONTOH,
    },
    musicId: null,
    now,
  };
}

export function contohTemplateView(template: TemplateKey, now: number): InvitationView {
  const view = contohView(now);
  if (template === "melati") return view;
  const contoh = {
    keraton: {
      title: "Forum Kolaborasi",
      kutipan: "Gagasan bertemu, pengetahuan bertumbuh, peluang baru terbuka.",
      sambutan: "Kami mengundang Anda untuk bertukar gagasan dalam Forum Kolaborasi. Mari berbagi pengetahuan, mendengar perspektif baru, dan membangun kerja sama yang bermakna.",
      sesi: ["Seminar & diskusi", "Ruang jejaring"],
      tempat: "Auditorium Graha Puspa",
      cerita: [
        { tahun: "Gagasan", judul: "Berangkat dari percakapan", teks: "Ruang ini hadir untuk mempertemukan orang dengan pengalaman dan sudut pandang yang beragam." },
        { tahun: "Kolaborasi", judul: "Membuka kemungkinan", teks: "Melalui diskusi dan pertemuan, kita merangkai gagasan menjadi langkah bersama." },
      ],
    },
    bintang: {
      title: "Malam Apresiasi",
      kutipan: "Setiap kontribusi membawa cahaya bagi perjalanan bersama.",
      sambutan: "Dengan hangat kami mengundang Anda ke Malam Apresiasi. Mari merayakan karya, menghargai kontribusi, dan menikmati kebersamaan dalam sebuah malam yang berkesan.",
      sesi: ["Apresiasi & penghargaan", "Ramah tamah"],
      tempat: "Ruang Serbaguna Graha Puspa",
      cerita: [
        { tahun: "Perjalanan", judul: "Karya yang terus tumbuh", teks: "Banyak gagasan dan kerja bersama yang telah memberi warna pada perjalanan tahun ini." },
        { tahun: "Apresiasi", judul: "Untuk setiap kontribusi", teks: "Malam ini menjadi kesempatan untuk mengucapkan terima kasih kepada semua yang terlibat." },
      ],
    },
    pasundan: {
      title: "Temu Keluarga",
      kutipan: "Ada cerita yang selalu terasa hangat saat dibagikan bersama keluarga.",
      sambutan: "Kami mengundang keluarga dan kerabat untuk berkumpul dalam Temu Keluarga. Mari meluangkan waktu, berbagi cerita, dan mempererat kebersamaan.",
      sesi: ["Kumpul keluarga", "Makan & cerita bersama"],
      tempat: "Pendopo Graha Puspa",
      cerita: [
        { tahun: "Kenangan", judul: "Cerita lintas generasi", teks: "Setiap pertemuan menyimpan kisah dan kenangan yang menghubungkan kita." },
        { tahun: "Pertemuan", judul: "Kembali berkumpul", teks: "Sebuah waktu untuk bertemu kembali dan menciptakan kenangan bersama keluarga." },
      ],
    },
  }[template];
  return {
    ...view,
    title: contoh.title,
    content: readContent({ ...view.content, kutipan: contoh.kutipan, sambutan: contoh.sambutan, cerita: contoh.cerita, amplop: [{ bank: "[Nama bank]", nomor: "[Nomor rekening]", atasNama: "Penyelenggara Acara" }] }),
    events: view.events.map((event, i) => ({ ...event, name: contoh.sesi[i], venueName: contoh.tempat, ...(template === "bintang" ? { time: i === 0 ? "18:30" : "20:00" } : {}) })),
  };
}
