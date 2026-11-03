import type { ChangeEvent, CSSProperties, ComponentType } from "react";
import type { BagianId } from "@/lib/invitations/content";

export type StatusTamu = "hadir" | "tidak" | "belum";

export type AcaraData = {
  id: string;
  nama: string;
  tgl: string;
  tglBesar: string;
  jam: string;
  tempat: string;
  alamat: string;
  peta: string | null;
  kalender: string | null;
};

export type JawabanData = { hadir: boolean; dewasa: number; anak: number; pesan: string };

export type UcapanData = {
  id: string;
  nama: string;
  teks: string;
  waktu: string;
  status: StatusTamu;
};

export type HalamanUcapan = {
  items: UcapanData[];
  page: number;
  totalPages: number;
  total: number;
};

export type RekeningData = { bank: string; nomor: string; atasNama: string };

export type MomenData = { tahun: string; judul: string; teks: string };

export type FotoGaleri = { id: string; src: string; rasio: string; sizes: string };

export type DataUndangan = {
  mode: "tamu" | "pratinjau" | "contoh";
  slug: string;
  token: string;
  pria: string;
  wanita: string;
  priaLengkap: string;
  wanitaLengkap: string;
  priaOrtu: string;
  wanitaOrtu: string;
  fotoPria: string | null;
  fotoWanita: string | null;
  tglTitik: string;
  tglTitikTengah: string;
  tglPanjang: string;
  tglBesar: string;
  tglKata: string;
  tglKota: string;
  kutipan: string;
  sambutan: string;
  penutup: string;
  namaTamu: string;
  maksDewasa: number;
  maksAnak: number;
  acara: AcaraData[];
  jawaban: Record<string, JawabanData>;
  rsvpTutup: boolean;
  batasRsvp: string | null;
  hitung: { target: number; detik: boolean } | null;
  sekarang: number;
  kalender: string | null;
  cerita: MomenData[];
  galeri: FotoGaleri[];
  lajurGaleri: number[][];
  rekening: RekeningData[];
  qris: string | null;
  ucapan: (HalamanUcapan & { lokal: UcapanData[] | null }) | null;
  musik: string | null;
  urutan: BagianId[];
  qr: string | null;
};

export type Warna = { bg: string; fg: string; bd: string };

export type Palet = {
  on: Warna;
  off: Warna;
  avatar: string[];
  lencana: Record<StatusTamu, [string, string, string]>;
  galeriWarna: string[];
};

export type Tepi = Record<BagianId, { atas: string; bawah: string }>;

export type RsvpAcara = AcaraData & {
  ya: boolean;
  tidak: boolean;
  yaBg: string;
  yaFg: string;
  yaBd: string;
  tdBg: string;
  tdFg: string;
  tdBd: string;
  tampilJumlah: boolean;
  showAnak: boolean;
  maksD: number;
  maksA: number;
  dewasa: number;
  anak: number;
  dMinOp: string;
  dMaxOp: string;
  aMinOp: string;
  aMaxOp: string;
  pilihYa: () => void;
  pilihTidak: () => void;
  tambahD: () => void;
  kurangD: () => void;
  tambahA: () => void;
  kurangA: () => void;
};

export type UcapanTampil = UcapanData & {
  inisial: string;
  avatar: string;
  badge: string;
  badgeBg: string;
  badgeFg: string;
};

export type GaleriTampil = FotoGaleri & {
  warna: string;
  label: string;
  buka: () => void;
};

export type RekeningTampil = RekeningData & {
  kunci: string;
  label: string;
  salin: () => void;
  arah: "kiri" | "kanan";
  tunda: string;
};

export type MomenTampil = MomenData & { kunci: string; akhir: boolean; tunda: string; tundaGaris: string };

export type Vals = Omit<DataUndangan, "ucapan" | "galeri" | "lajurGaleri" | "cerita" | "rekening" | "hitung"> & {
  priaBesar: string;
  wanitaBesar: string;
  pasangan: string;
  pasanganBesar: string;
  inisialPria: string;
  inisialWanita: string;
  altPria: string;
  altWanita: string;
  kutipanTampil: string;
  inisialTamu: string;
  keteranganMaks: string;
  teksBatas: string;
  teksUbah: string;
  hari: string;
  jam: string;
  menit: string;
  detik: string;
  tampilDetik: boolean;
  kolomHitung: string;
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
  teksUcapan: string;
  sisaKarakter: number;
  maksUcapan: number;
  placeholderUcapan: string;
  ucapanOpacity: string;
  ucapanNonaktif: boolean;
  ketikUcapan: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  kirimUcapan: () => void;
  pesanUcapan: string | null;
  ucapan: UcapanTampil[];
  adaUcapan: boolean;
  jumlahUcapan: number;
  halamanKe: number;
  totalHalaman: number;
  sebelumOp: string;
  berikutOp: string;
  sebelumNonaktif: boolean;
  berikutNonaktif: boolean;
  halSebelum: () => void;
  halBerikut: () => void;
  galeri: GaleriTampil[];
  lajurGaleri: GaleriTampil[][];
  fotoBuka: boolean;
  fotoWarna: string;
  fotoSrc: string;
  fotoLabel: string;
  fotoTutup: () => void;
  fotoSebelum: () => void;
  fotoBerikut: () => void;
  cerita: MomenTampil[];
  rekening: RekeningTampil[];
  label1: string;
  label2: string;
  salin1: () => void;
  salin2: () => void;
  bukaUndangan: () => void;
  adaMusik: boolean;
  toggleMusik: () => void;
  musikMain: boolean;
  musikDiam: boolean;
  musikLabel: string;
};

export type PropsBagian = { v: Vals; atas: string; bawah: string; berikut: string };

export type KomponenBagian = ComponentType<PropsBagian>;

export type ModulTemplate = {
  kunci: string;
  akar: CSSProperties;
  kertas: { className?: string; style: CSSProperties };
  defs: string;
  palet: Palet;
  tepi: Tepi;
  bagian: Record<BagianId, KomponenBagian>;
  Progres: ComponentType<{ v: Vals }>;
  Lightbox: ComponentType<{ v: Vals }>;
  Musik: ComponentType<{ v: Vals }>;
};
