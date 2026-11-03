import { readContent } from "@/lib/invitations/content";
import type { InvitationView } from "@/templates/types";
import type { UcapanData } from "./jenis";

const UCAPAN_CONTOH: UcapanData[] = [
  {
    id: "contoh-1",
    nama: "Dian Permatasari",
    status: "hadir",
    waktu: "2 jam lalu",
    teks: "Selamat menempuh hidup baru, Raka dan Nadia! Semoga menjadi keluarga yang hangat dan penuh tawa.",
  },
  {
    id: "contoh-2",
    nama: "Rizky Ananda",
    status: "hadir",
    waktu: "5 jam lalu",
    teks: "Bahagia sekali mendengar kabar ini. Langgeng sampai kakek nenek ya!",
  },
  {
    id: "contoh-3",
    nama: "Putri Wulandari",
    status: "tidak",
    waktu: "1 hari lalu",
    teks: "Maaf belum bisa hadir. Doa terbaik untuk kalian berdua.",
  },
  {
    id: "contoh-4",
    nama: "Fajar Nugroho",
    status: "hadir",
    waktu: "1 hari lalu",
    teks: "Akhirnya! Selamat ya, sampai jumpa di hari bahagia.",
  },
  {
    id: "contoh-5",
    nama: "Ayu Lestari",
    status: "hadir",
    waktu: "2 hari lalu",
    teks: "Semoga selalu saling menguatkan dan bahagia selamanya.",
  },
  {
    id: "contoh-6",
    nama: "Bagas Saputra",
    status: "belum",
    waktu: "3 hari lalu",
    teks: "Selamat untuk kalian! Semoga lancar sampai hari H.",
  },
];

const ALAMAT = "Jl. Dago Atas No. 88, Coblong, Bandung";
const PETA = "https://www.google.com/maps/search/?api=1&query=Coblong%2C+Bandung";

export function contohView(now: number): InvitationView {
  const content = readContent({
    kutipan:
      "Dua hati yang dipertemukan dengan sederhana, kini memilih melangkah bersama untuk seterusnya.",
    sambutan:
      "Dengan penuh sukacita, kami mengundang Bapak, Ibu, dan Saudara untuk hadir dan memberikan doa restu di hari pernikahan kami.",
    pria: {
      namaLengkap: "Raka Pratama Putra",
      orangTua: "Putra pertama dari\nBapak Hendra Pratama & Ibu Dewi Lestari",
    },
    wanita: {
      namaLengkap: "Nadia Kirana Sari",
      orangTua: "Putri kedua dari\nBapak Bambang Sutrisno & Ibu Rina Marlina",
    },
    cerita: [
      {
        tahun: "2019",
        judul: "Pertama bertemu",
        teks: "Berawal dari satu kelompok tugas kampus yang kemudian berlanjut menjadi obrolan panjang setiap sore.",
      },
      {
        tahun: "2022",
        judul: "Saling mengenal keluarga",
        teks: "Setelah tiga tahun bersama, kami memberanikan diri memperkenalkan satu sama lain kepada keluarga.",
      },
      {
        tahun: "2026",
        judul: "Lamaran",
        teks: "Di hadapan kedua keluarga, kami sepakat melangkah ke jenjang pernikahan.",
      },
    ],
    amplop: [
      { bank: "[Nama bank]", nomor: "[Nomor rekening]", atasNama: "Raka Pratama Putra" },
      { bank: "[Nama bank]", nomor: "[Nomor rekening]", atasNama: "Nadia Kirana Sari" },
    ],
  });

  return {
    mode: "contoh",
    slug: "contoh",
    token: "",
    groomName: "Raka",
    brideName: "Nadia",
    guest: { name: "Nama Tamu", maxAdults: 2, maxChildren: 2 },
    content,
    events: [
      {
        id: "contoh-akad",
        key: "akad",
        name: "Akad Nikah",
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
        id: "contoh-resepsi",
        key: "resepsi",
        name: "Resepsi",
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
