import type { CSSProperties, ComponentType, MouseEvent } from "react";
import type { IdentitasEvent, Penyelenggara, PengisiAcara, Kontak, BagianId } from "@/lib/invitations/content";
import type { TampilanSettings } from "@/lib/invitations/tampilan";
import type { TemplateKey } from "@/templates/registry";

export type HariData = {
  date: string;
  label: string;
  jam: string;
  mulai: string | null;
  opsi: string[];
};

export type AcaraData = {
  id: string;
  nama: string;
  singleDayOnly: boolean;
  tgl: string;
  tglBesar: string;
  jam: string;
  tempat: string;
  alamat: string;
  peta: string | null;
  kalender: string | null;
  hari: HariData[];
  agenda: { id: string; jam: string; judul: string; keterangan: string }[];
};

export type JawabanData = { hadir: boolean; peserta: number; pesan: string; kunjungan: { date: string; time: string | null }[] };

export type DataUndangan = {
  mode: "tamu" | "pratinjau" | "contoh";
  token: string;
  judul: string;
  tglTitik: string;
  tglTitikTengah: string;
  tglPanjang: string;
  tglBesar: string;
  tglKata: string;
  tglKota: string;
  identitas: IdentitasEvent;
  penyelenggara: Penyelenggara;
  pengisiAcara: (PengisiAcara & { foto: { src: string; width: number; height: number } | null })[];
  kontak: Kontak;
  kontakWhatsapp: string | null;
  kontakEmail: string | null;
  logoPenyelenggara: { src: string; width: number; height: number } | null;
  logoEo: { src: string; width: number; height: number } | null;
  sambutan: string;
  penutup: string;
  namaTamu: string;
  maksPeserta: number;
  acara: AcaraData[];
  jawaban: Record<string, JawabanData>;
  rsvpTutup: boolean;
  batasRsvp: string | null;
  kalender: string | null;
  poster: { src: string; width: number; height: number } | null;
  sembunyikanTeksSampul: boolean;
  tampilan: TampilanSettings;
  urutan: BagianId[];
  qr: string | null;
};

export type Warna = { bg: string; fg: string; bd: string };

export type Palet = {
  on: Warna;
  off: Warna;
};

export type HariPilihan = HariData & {
  dipilih: boolean;
  waktu: string;
  pilih: () => void;
  ubahWaktu: (waktu: string) => void;
};

export type RsvpAcara = AcaraData & {
  hariPilihan: HariPilihan[];
  banyakHari: boolean;
  ya: boolean; tidak: boolean;
  yaBg: string; yaFg: string; yaBd: string;
  tdBg: string; tdFg: string; tdBd: string;
  tampilJumlah: boolean;
  maksPeserta: number;
  peserta: number;
  pilihYa: () => void; pilihTidak: () => void;
  tambah: () => void; kurang: () => void;
};

export type Vals = DataUndangan & {
  judulBesar: string;
  ukuranJudul: number;
  inisialEvent: string;
  inisialTamu: string;
  keteranganMaks: string;
  teksBatas: string;
  teksUbah: string;
  rsvpAcara: RsvpAcara[];
  showForm: boolean;
  showTerima: boolean;
  showTutup: boolean;
  bisaUbah: boolean;
  kirimNonaktif: boolean;
  kirimOpacity: string;
  kirimRsvp: () => void;
  ubahRsvp: () => void;
  ringkasan: string;
  pesanRsvp: string | null;
  qrTampil: string | null;
  undanganTerbuka: boolean;
  bukaUndangan: (event: MouseEvent<HTMLAnchorElement>) => void;
};

export type PropsBagian = { v: Vals; berikut: string; dekorasiId: string };

export type KomponenBagian = ComponentType<PropsBagian>;

export type ModulTemplate = {
  kunci: TemplateKey;
  akar: CSSProperties;
  kertas: { className?: string; style: CSSProperties };
  palet: Palet;
  bagian: Record<BagianId, KomponenBagian>;
  Progres: ComponentType<{ v: Vals }>;
};
