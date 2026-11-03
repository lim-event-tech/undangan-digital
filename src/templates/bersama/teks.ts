import { formatDate } from "@/lib/datetime";

const SATUAN = [
  "",
  "satu",
  "dua",
  "tiga",
  "empat",
  "lima",
  "enam",
  "tujuh",
  "delapan",
  "sembilan",
  "sepuluh",
  "sebelas",
];

export function angkaKata(n: number): string {
  if (!Number.isInteger(n) || n < 1 || n > 99) return String(n);
  if (n < 12) return SATUAN[n];
  if (n < 20) return `${SATUAN[n - 10]} belas`;
  const puluhan = Math.floor(n / 10);
  const sisa = n % 10;
  return `${SATUAN[puluhan]} puluh${sisa ? ` ${SATUAN[sisa]}` : ""}`;
}

const HARI = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"] as const;
const BULAN = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
] as const;

export function tanggalKata(value: string): string {
  const [tahun, bulan, tanggal] = value.split("-").map(Number);
  const hari = new Date(Date.UTC(tahun, bulan - 1, tanggal)).getUTCDay();
  return `${HARI[hari]}, ${angkaKata(tanggal)} ${BULAN[bulan - 1]} ${tahun}`;
}

export function kotaDari(alamat: string | null): string {
  if (!alamat) return "";
  const bagian = alamat
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (bagian.length < 2) return "";
  return bagian[bagian.length - 1].replace(/\s*\d{5}$/, "").trim();
}

const SAPAAN = /^(ibu|bapak|bpk\.?|kak|kakak|mbak|mas|om|tante|pak|bu|kang|teh|sdr\.?|sdri\.?|saudara|saudari|dr\.?|drs\.?|ir\.?|hj\.?|h\.)\s+/i;

export function inisialNama(nama: string): string {
  let teks = nama.trim();
  for (let i = 0; i < 3 && SAPAAN.test(teks); i++) teks = teks.replace(SAPAAN, "");
  return (teks.charAt(0) || nama.trim().charAt(0)).toUpperCase();
}

export function waktuRelatif(waktu: Date, sekarang: Date): string {
  const detik = Math.max(0, Math.floor((sekarang.getTime() - waktu.getTime()) / 1000));
  if (detik < 60) return "Baru saja";
  const menit = Math.floor(detik / 60);
  if (menit < 60) return `${menit} menit lalu`;
  const jam = Math.floor(menit / 60);
  if (jam < 24) return `${jam} jam lalu`;
  const hari = Math.floor(jam / 24);
  if (hari < 7) return `${hari} hari lalu`;
  const lokal = new Date(waktu.getTime() + 7 * 60 * 60 * 1000);
  return formatDate(lokal.toISOString().slice(0, 10));
}

export function kutipanBerpetik(teks: string): string {
  const bersih = teks.trim();
  if (!bersih) return "";
  if (/^["“'‘]/.test(bersih)) return bersih;
  return `“${bersih}”`;
}
