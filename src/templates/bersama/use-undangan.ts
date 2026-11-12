"use client";

import { useState, useTransition } from "react";
import { submitRsvpAction } from "@/templates/rsvp-actions";
import type { DataUndangan, Palet, RsvpAcara, Vals } from "./jenis";
import { inisialNama } from "./teks";
import { useGulirHalus } from "./use-gulir";

type Pilihan = "ya" | "tidak";
type Jumlah = number;

const PESAN_PRATINJAU = "Mode pratinjau: jawaban tidak disimpan.";

const batasi = (n: number, min: number, max: number) => Math.min(Math.max(n, min), max);

function awalPilihan(data: DataUndangan): Record<string, Pilihan> {
  const hasil: Record<string, Pilihan> = {};
  for (const a of data.acara) {
    const j = data.jawaban[a.id];
    if (j) hasil[a.id] = j.hadir ? "ya" : "tidak";
  }
  return hasil;
}

function awalHari(data: DataUndangan): Record<string, string[]> {
  const hasil: Record<string, string[]> = {};
  for (const a of data.acara) {
    const j = data.jawaban[a.id];
    if (j?.hadir && j.kunjungan.length > 0) hasil[a.id] = j.kunjungan.map((k) => k.date);
  }
  return hasil;
}

function awalJam(data: DataUndangan): Record<string, Record<string, string>> {
  const hasil: Record<string, Record<string, string>> = {};
  for (const a of data.acara) {
    const j = data.jawaban[a.id];
    if (!j?.hadir) continue;
    hasil[a.id] = Object.fromEntries(j.kunjungan.flatMap((k) => (k.time ? [[k.date, k.time]] : [])));
  }
  return hasil;
}

function awalJumlah(data: DataUndangan): Record<string, Jumlah> {
  const hasil: Record<string, Jumlah> = {};
  for (const a of data.acara) {
    const j = data.jawaban[a.id];
    if (j?.hadir) {
      hasil[a.id] = batasi(j.peserta, 1, data.maksPeserta);
    }
  }
  return hasil;
}

export function useUndangan(data: DataUndangan, palet: Palet): Vals {
  const tamu = data.mode === "tamu";
  const [undanganTerbuka, setUndanganTerbuka] = useState(false);
  const gulirHalus = useGulirHalus();

  const [pilihan, setPilihan] = useState<Record<string, Pilihan>>(() => awalPilihan(data));
  const [jumlah, setJumlah] = useState<Record<string, Jumlah>>(() => awalJumlah(data));
  const [hariDipilih, setHariDipilih] = useState<Record<string, string[]>>(() => awalHari(data));
  const [jamDipilih, setJamDipilih] = useState<Record<string, Record<string, string>>>(() => awalJam(data));
  const [terkirim, setTerkirim] = useState(
    () => data.acara.length > 0 && data.acara.every((a) => data.jawaban[a.id]),
  );
  const [hadirTersimpan, setHadirTersimpan] = useState(() =>
    Object.values(data.jawaban).some((j) => j.hadir),
  );
  const [pesanRsvp, setPesanRsvp] = useState<string | null>(null);
  const [versiQr, setVersiQr] = useState(0);
  const [mengirimRsvp, mulaiRsvp] = useTransition();

  const maks = Math.max(1, data.maksPeserta);
  const tutup = data.rsvpTutup;
  const rsvpAcara: RsvpAcara[] = data.acara.map((a) => {
    const pil = pilihan[a.id];
    const peserta = batasi(jumlah[a.id] ?? 1, 1, maks);
    const atur = (value: number) => setJumlah((lama) => ({ ...lama, [a.id]: value }));
    const y = pil === "ya" ? palet.on : palet.off;
    const t = pil === "tidak" ? palet.on : palet.off;
    const semuaHari = a.hari.map((h) => h.date);
    const terpilih = a.hari.length === 1
      ? semuaHari
      : (hariDipilih[a.id] ?? (a.singleDayOnly && semuaHari.length > 0 ? [semuaHari[0]] : semuaHari));
    const hariPilihan = a.hari.map((h) => ({
      ...h,
      dipilih: terpilih.includes(h.date),
      waktu: jamDipilih[a.id]?.[h.date] ?? h.mulai ?? "",
      pilih: () => setHariDipilih((lama) => {
        if (a.singleDayOnly) {
          return { ...lama, [a.id]: [h.date] };
        }
        const sekarang = lama[a.id] ?? semuaHari;
        return { ...lama, [a.id]: sekarang.includes(h.date) ? sekarang.filter((d) => d !== h.date) : [...sekarang, h.date] };
      }),
      ubahWaktu: (waktu: string) => setJamDipilih((lama) => ({ ...lama, [a.id]: { ...lama[a.id], [h.date]: waktu } })),
    }));
    return {
      ...a, hariPilihan, banyakHari: a.hari.length > 1, singleDayOnly: a.singleDayOnly, ya: pil === "ya", tidak: pil === "tidak", yaBg: y.bg, yaFg: y.fg, yaBd: y.bd,
      tdBg: t.bg, tdFg: t.fg, tdBd: t.bd, tampilJumlah: pil === "ya", maksPeserta: maks, peserta,
      pilihYa: () => setPilihan((lama) => ({ ...lama, [a.id]: "ya" })),
      pilihTidak: () => setPilihan((lama) => ({ ...lama, [a.id]: "tidak" })),
      tambah: () => atur(Math.min(maks, peserta + 1)), kurang: () => atur(Math.max(1, peserta - 1)),
    };
  });
  const lengkap = data.acara.length > 0 && data.acara.every((a) => pilihan[a.id]) && rsvpAcara.every((r) => !r.ya || !r.banyakHari || (r.singleDayOnly ? r.hariPilihan.filter((h) => h.dipilih).length === 1 : r.hariPilihan.some((h) => h.dipilih)));
  const adaYa = rsvpAcara.some((r) => r.ya);
  const ringkasan = rsvpAcara.map((r) => `${r.nama}: ${r.ya ? `${r.peserta} peserta` : "tidak hadir"}`).join(" · ");

  const kirimRsvp = () => {
    if (!lengkap || mengirimRsvp || tutup) return;
    if (!tamu) {
      setTerkirim(true);
      setHadirTersimpan(adaYa);
      setPesanRsvp(PESAN_PRATINJAU);
      return;
    }
    const form = new FormData();
    form.set("token", data.token);
    for (const r of rsvpAcara) {
      form.set(`hadir-${r.id}`, r.ya ? "ya" : "tidak");
      form.set(`peserta-${r.id}`, r.ya ? String(r.peserta) : "0");
      form.set(`pesan-${r.id}`, data.jawaban[r.id]?.pesan ?? "");
      if (!r.ya) continue;
      for (const h of r.hariPilihan.filter((item) => item.dipilih)) {
        form.append(`hari-${r.id}`, h.date);
        if (h.waktu) form.set(`jam-${r.id}-${h.date}`, h.waktu);
      }
    }
    mulaiRsvp(async () => {
      try {
        const hasil = await submitRsvpAction(null, form);
        if (hasil.status === "ok") {
          setTerkirim(true);
          setHadirTersimpan(adaYa);
          setVersiQr((n) => n + 1);
          setPesanRsvp(null);
          return;
        }
        const rinci = hasil.errors ? Object.values(hasil.errors)[0] : undefined;
        setPesanRsvp(rinci ?? hasil.message ?? "Konfirmasi belum terkirim. Coba lagi.");
      } catch {
        setPesanRsvp("Koneksi terputus. Periksa internet Anda lalu coba lagi.");
      }
    });
  };

  return {
    ...data,
    judulBesar: data.judul.toUpperCase(),
    ukuranJudul: data.judul.length > 80 ? 20 : data.judul.length > 50 ? 24 : data.judul.length > 30 ? 30 : 40,
    inisialEvent: inisialNama(data.judul),
    inisialTamu: inisialNama(data.namaTamu),
    keteranganMaks: `Maksimal ${maks} peserta per sesi, termasuk Anda dan pendamping.`,
    teksBatas: tutup
      ? "Batas waktu konfirmasi sudah lewat."
      : data.batasRsvp
        ? `Mohon konfirmasi sebelum ${data.batasRsvp}. Jawaban bisa diubah sampai batas tersebut.`
        : "Mohon konfirmasi kehadiran Anda untuk setiap acara.",
    teksUbah: tutup
      ? "Batas waktu konfirmasi sudah lewat."
      : data.batasRsvp
        ? `Masih bisa diubah sampai ${data.batasRsvp}.`
        : "Jawaban masih bisa diubah.",
    rsvpAcara,
    showForm: !terkirim && !tutup,
    showTerima: terkirim,
    showTutup: !terkirim && tutup,
    bisaUbah: !tutup,
    kirimNonaktif: !lengkap || mengirimRsvp,
    kirimOpacity: lengkap && !mengirimRsvp ? "1" : "0.45",
    kirimRsvp,
    ubahRsvp: () => {
      setTerkirim(false);
      setPesanRsvp(null);
    },
    ringkasan: `Jawaban Anda sudah kami terima. ${ringkasan}`,
    pesanRsvp,
    qrTampil:
      data.qr && terkirim && hadirTersimpan ? `${data.qr}?v=${versiQr}` : null,
    undanganTerbuka,
    bukaUndangan: (event) => {
      event.preventDefault();
      const tujuan = event.currentTarget.hash.slice(1);
      setUndanganTerbuka(true);
      gulirHalus(tujuan, !undanganTerbuka);
    },
  };
}
