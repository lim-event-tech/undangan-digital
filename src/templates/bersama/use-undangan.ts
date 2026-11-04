"use client";

import { useEffect, useRef, useState, useTransition, type RefObject } from "react";
import { remaining } from "@/lib/countdown";
import { WISH_MAX_LENGTH, WISH_PAGE_SIZE, cleanWish } from "@/lib/wishes/shared";
import { submitRsvpAction } from "@/templates/rsvp-actions";
import { kirimUcapanAction, muatUcapanAction } from "@/templates/ucapan-actions";
import type {
  DataUndangan,
  HalamanUcapan,
  Palet,
  RsvpAcara,
  StatusTamu,
  UcapanData,
  Vals,
} from "./jenis";
import { inisialNama, kutipanBerpetik } from "./teks";

type Pilihan = "ya" | "tidak";
type Jumlah = { d: number; a: number };

const PESAN_PRATINJAU = "Mode pratinjau: jawaban tidak disimpan.";
const PESAN_PRATINJAU_UCAPAN = "Mode pratinjau: ucapan tidak disimpan.";

const dua = (n: number) => String(n).padStart(2, "0");
const redup = (b: boolean) => (b ? "0.35" : "1");
const batasi = (n: number, min: number, max: number) => Math.min(Math.max(n, min), max);

function awalPilihan(data: DataUndangan): Record<string, Pilihan> {
  const hasil: Record<string, Pilihan> = {};
  for (const a of data.acara) {
    const j = data.jawaban[a.id];
    if (j) hasil[a.id] = j.hadir ? "ya" : "tidak";
  }
  return hasil;
}

function awalJumlah(data: DataUndangan): Record<string, Jumlah> {
  const hasil: Record<string, Jumlah> = {};
  for (const a of data.acara) {
    const j = data.jawaban[a.id];
    if (j?.hadir) {
      hasil[a.id] = {
        d: batasi(j.dewasa, 1, data.maksDewasa),
        a: batasi(j.anak, 0, data.maksAnak),
      };
    }
  }
  return hasil;
}

function salinTeks(teks: string): Promise<void> {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(teks);
  return new Promise((resolve, reject) => {
    const area = document.createElement("textarea");
    area.value = teks;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const berhasil = document.execCommand("copy");
    area.remove();
    if (berhasil) resolve();
    else reject(new Error("salin gagal"));
  });
}

export function useGerak(akar: RefObject<HTMLElement | null>, aktif = true) {
  useEffect(() => {
    if (!aktif) return;
    const root = document.documentElement;
    let raf = 0;
    const gulir = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const el = document.scrollingElement || root;
        const maks = Math.max(1, el.scrollHeight - window.innerHeight);
        root.style.setProperty("--gulir", String(el.scrollTop));
        root.style.setProperty("--progres", String(Math.min(1, el.scrollTop / maks)));
      });
    };
    window.addEventListener("scroll", gulir, { passive: true });
    gulir();

    const elemen = Array.from(akar.current?.querySelectorAll<HTMLElement>("[data-anim]") ?? []);
    const pewaktu: number[] = [];
    let pengamat: IntersectionObserver | null = null;
    const el = document.scrollingElement || root;
    const bisaGulir = el.scrollHeight > window.innerHeight + 80;
    if (typeof IntersectionObserver === "undefined" || !bisaGulir) {
      elemen.forEach((e, i) => {
        pewaktu.push(window.setTimeout(() => e.classList.add("tampil"), 80 + Math.min(i * 45, 1400)));
      });
    } else {
      const io = new IntersectionObserver(
        (daftar) => {
          for (const x of daftar) {
            if (!x.isIntersecting) continue;
            x.target.classList.add("tampil");
            io.unobserve(x.target);
          }
        },
        { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
      );
      elemen.forEach((e) => io.observe(e));
      pengamat = io;
    }

    return () => {
      window.removeEventListener("scroll", gulir);
      cancelAnimationFrame(raf);
      pengamat?.disconnect();
      pewaktu.forEach((t) => window.clearTimeout(t));
      root.style.removeProperty("--gulir");
      root.style.removeProperty("--progres");
    };
  }, [akar, aktif]);
}

export function useUndangan(data: DataUndangan, palet: Palet): Vals {
  const tamu = data.mode === "tamu";
  const [undanganTerbuka, setUndanganTerbuka] = useState(false);

  const [sekarang, setSekarang] = useState(data.sekarang);
  const adaHitung = data.hitung !== null;
  useEffect(() => {
    if (!adaHitung) return;
    const awal = window.setTimeout(() => setSekarang(Date.now()), 0);
    const timer = window.setInterval(() => setSekarang(Date.now()), 1000);
    return () => {
      window.clearTimeout(awal);
      window.clearInterval(timer);
    };
  }, [adaHitung]);

  const [pilihan, setPilihan] = useState<Record<string, Pilihan>>(() => awalPilihan(data));
  const [jumlah, setJumlah] = useState<Record<string, Jumlah>>(() => awalJumlah(data));
  const [terkirim, setTerkirim] = useState(
    () => data.acara.length > 0 && data.acara.every((a) => data.jawaban[a.id]),
  );
  const [hadirTersimpan, setHadirTersimpan] = useState(() =>
    Object.values(data.jawaban).some((j) => j.hadir),
  );
  const [pesanRsvp, setPesanRsvp] = useState<string | null>(null);
  const [versiQr, setVersiQr] = useState(0);
  const [mengirimRsvp, mulaiRsvp] = useTransition();

  const maksD = Math.max(1, data.maksDewasa);
  const maksA = Math.max(0, data.maksAnak);
  const tutup = data.rsvpTutup;

  const rsvpAcara: RsvpAcara[] = data.acara.map((a) => {
    const pil = pilihan[a.id];
    const j = jumlah[a.id] ?? { d: 1, a: 0 };
    const dw = batasi(j.d, 1, maksD);
    const an = batasi(j.a, 0, maksA);
    const atur = (nd: number, na: number) =>
      setJumlah((lama) => ({ ...lama, [a.id]: { d: nd, a: na } }));
    const y = pil === "ya" ? palet.on : palet.off;
    const t = pil === "tidak" ? palet.on : palet.off;
    return {
      ...a,
      ya: pil === "ya",
      tidak: pil === "tidak",
      yaBg: y.bg,
      yaFg: y.fg,
      yaBd: y.bd,
      tdBg: t.bg,
      tdFg: t.fg,
      tdBd: t.bd,
      tampilJumlah: pil === "ya",
      showAnak: maksA > 0,
      maksD,
      maksA,
      dewasa: dw,
      anak: an,
      dMinOp: redup(dw <= 1),
      dMaxOp: redup(dw >= maksD),
      aMinOp: redup(an <= 0),
      aMaxOp: redup(an >= maksA),
      pilihYa: () => setPilihan((lama) => ({ ...lama, [a.id]: "ya" })),
      pilihTidak: () => setPilihan((lama) => ({ ...lama, [a.id]: "tidak" })),
      tambahD: () => atur(Math.min(maksD, dw + 1), an),
      kurangD: () => atur(Math.max(1, dw - 1), an),
      tambahA: () => atur(dw, Math.min(maksA, an + 1)),
      kurangA: () => atur(dw, Math.max(0, an - 1)),
    };
  });
  const lengkap = data.acara.length > 0 && data.acara.every((a) => pilihan[a.id]);
  const adaYa = rsvpAcara.some((r) => r.ya);
  const ringkasan = rsvpAcara
    .map(
      (r) =>
        `${r.nama}: ${r.ya ? `${r.dewasa} dewasa${r.anak ? `, ${r.anak} anak` : ""}` : "tidak hadir"}`,
    )
    .join(" · ");

  const kirimRsvp = () => {
    if (!lengkap || mengirimRsvp || tutup) return;
    if (!tamu) {
      setTerkirim(true);
      setHadirTersimpan(adaYa);
      setPesanRsvp(PESAN_PRATINJAU);
      return;
    }
    const form = new FormData();
    form.set("slug", data.slug);
    form.set("token", data.token);
    for (const r of rsvpAcara) {
      form.set(`hadir-${r.id}`, r.ya ? "ya" : "tidak");
      form.set(`dewasa-${r.id}`, r.ya ? String(r.dewasa) : "0");
      form.set(`anak-${r.id}`, r.ya ? String(r.anak) : "0");
      form.set(`pesan-${r.id}`, data.jawaban[r.id]?.pesan ?? "");
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

  const [halaman, setHalaman] = useState<HalamanUcapan>(
    () => data.ucapan ?? { items: [], page: 1, totalPages: 1, total: 0 },
  );
  const [lokal, setLokal] = useState<UcapanData[] | null>(() => data.ucapan?.lokal ?? null);
  const [teks, setTeks] = useState("");
  const [pesanUcapan, setPesanUcapan] = useState<string | null>(null);
  const [memuatUcapan, mulaiUcapan] = useTransition();

  const tampilanHalaman: HalamanUcapan = lokal
    ? {
        items: lokal.slice((halaman.page - 1) * WISH_PAGE_SIZE, halaman.page * WISH_PAGE_SIZE),
        page: halaman.page,
        totalPages: Math.max(1, Math.ceil(lokal.length / WISH_PAGE_SIZE)),
        total: lokal.length,
      }
    : halaman;
  const halamanKe = Math.min(tampilanHalaman.page, tampilanHalaman.totalPages);
  const statusTamu: StatusTamu = hadirTersimpan ? "hadir" : terkirim ? "tidak" : "belum";

  const keHalaman = (tujuan: number) => {
    if (tujuan < 1 || tujuan > tampilanHalaman.totalPages || memuatUcapan) return;
    if (lokal) {
      setHalaman((lama) => ({ ...lama, page: tujuan }));
      return;
    }
    mulaiUcapan(async () => {
      try {
        const hasil = await muatUcapanAction({ slug: data.slug, token: data.token, halaman: tujuan });
        if (hasil) setHalaman(hasil);
      } catch {
        setPesanUcapan("Ucapan belum bisa dimuat. Coba lagi.");
      }
    });
  };

  const kirimUcapan = () => {
    const pesan = cleanWish(teks);
    if (!pesan || memuatUcapan) return;
    if (!tamu) {
      const baru: UcapanData = {
        id: `lokal-${Date.now()}`,
        nama: data.namaTamu,
        teks: pesan,
        waktu: "Baru saja",
        status: statusTamu,
      };
      setLokal((lama) => [baru, ...(lama ?? [])]);
      setHalaman((lama) => ({ ...lama, page: 1 }));
      setTeks("");
      setPesanUcapan(PESAN_PRATINJAU_UCAPAN);
      return;
    }
    mulaiUcapan(async () => {
      try {
        const hasil = await kirimUcapanAction({ slug: data.slug, token: data.token, pesan });
        if (!hasil.ok) {
          setPesanUcapan(hasil.pesan);
          return;
        }
        setTeks("");
        if (hasil.status === "ditahan") {
          setPesanUcapan("Terima kasih. Ucapan Anda akan tampil setelah disetujui pengelola.");
          return;
        }
        if (hasil.halaman) setHalaman(hasil.halaman);
        setPesanUcapan("Terima kasih, ucapan Anda sudah terkirim.");
      } catch {
        setPesanUcapan("Koneksi terputus. Periksa internet Anda lalu coba lagi.");
      }
    });
  };

  const ucapan = tampilanHalaman.items.map((u, i) => {
    const [badge, badgeBg, badgeFg] = palet.lencana[u.status];
    return {
      ...u,
      inisial: inisialNama(u.nama),
      avatar: palet.avatar[((halamanKe - 1) * WISH_PAGE_SIZE + i) % palet.avatar.length],
      badge,
      badgeBg,
      badgeFg,
    };
  });

  const [foto, setFoto] = useState(-1);
  const galeri = data.galeri.map((g, i) => ({
    ...g,
    warna: palet.galeriWarna[i % palet.galeriWarna.length],
    label: `foto ${i + 1}`,
    buka: () => setFoto(i),
  }));
  const lajurGaleri = data.lajurGaleri.map((lajur) => lajur.map((i) => galeri[i]).filter(Boolean));
  const jumlahFoto = galeri.length;
  const fotoTerbuka = foto >= 0 && foto < jumlahFoto;
  const asalFoto = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!fotoTerbuka) return;
    asalFoto.current = document.activeElement as HTMLElement | null;
    document.querySelector<HTMLElement>("[data-tutup-foto]")?.focus();
    const tombol = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFoto(-1);
      else if (e.key === "ArrowLeft") setFoto((f) => (f + jumlahFoto - 1) % jumlahFoto);
      else if (e.key === "ArrowRight") setFoto((f) => (f + 1) % jumlahFoto);
    };
    window.addEventListener("keydown", tombol);
    return () => {
      window.removeEventListener("keydown", tombol);
      asalFoto.current?.focus();
    };
  }, [fotoTerbuka, jumlahFoto]);

  const [tersalin, setTersalin] = useState<Record<number, boolean>>({});
  const salin = (i: number, nomor: string) => {
    salinTeks(nomor.replace(/\s+/g, ""))
      .then(() => {
        setTersalin((lama) => ({ ...lama, [i]: true }));
        window.setTimeout(() => setTersalin((lama) => ({ ...lama, [i]: false })), 2500);
      })
      .catch(() => undefined);
  };
  const rekening = data.rekening.map((r, i) => ({
    ...r,
    kunci: `rekening-${i}`,
    label: tersalin[i] ? "TERSALIN" : "SALIN NOMOR",
    salin: () => salin(i, r.nomor),
    arah: i % 2 === 0 ? ("kiri" as const) : ("kanan" as const),
    tunda: `${(0.2 + i * 0.1).toFixed(1)}s`,
  }));

  const audio = useRef<HTMLAudioElement | null>(null);
  const [musikMain, setMusikMain] = useState(false);
  const adaMusik = data.musik !== null;
  useEffect(() => {
    if (!adaMusik) return;
    const sembunyi = () => {
      if (document.hidden) audio.current?.pause();
    };
    document.addEventListener("visibilitychange", sembunyi);
    return () => {
      document.removeEventListener("visibilitychange", sembunyi);
      audio.current?.pause();
    };
  }, [adaMusik]);
  const putar = () => {
    if (!data.musik) return;
    if (!audio.current) {
      const el = new Audio(data.musik);
      el.loop = true;
      el.addEventListener("play", () => setMusikMain(true));
      el.addEventListener("pause", () => setMusikMain(false));
      audio.current = el;
    }
    audio.current.play().catch(() => setMusikMain(false));
  };
  const toggleMusik = () => {
    if (musikMain) audio.current?.pause();
    else putar();
  };

  let hari = "00";
  let jam = "00";
  let menit = "00";
  let detik = "00";
  if (data.hitung) {
    const sisa = remaining(new Date(data.hitung.target), new Date(sekarang));
    hari = dua(sisa.days);
    jam = dua(sisa.hours);
    menit = dua(sisa.minutes);
    detik = dua(sisa.seconds);
  }
  const tampilDetik = data.hitung?.detik ?? true;

  const kutipanTampil = kutipanBerpetik(data.kutipan);
  const sisaKarakter = WISH_MAX_LENGTH - teks.length;
  const bisaKirimUcapan = teks.trim().length > 0 && !memuatUcapan;

  return {
    ...data,
    judulBesar: data.judul.toUpperCase(),
    ukuranJudul: data.judul.length > 80 ? 20 : data.judul.length > 50 ? 24 : data.judul.length > 30 ? 30 : 40,
    inisialEvent: inisialNama(data.judul),
    kutipanTampil,
    inisialTamu: inisialNama(data.namaTamu),
    keteranganMaks:
      maksA > 0
        ? `Jumlah undangan: ${maksD} dewasa dan ${maksA} anak per acara`
        : `Jumlah undangan: ${maksD} orang dewasa per acara`,
    teksBatas: tutup
      ? "Batas waktu konfirmasi sudah lewat."
      : data.batasRsvp
        ? `Mohon konfirmasi sebelum ${data.batasRsvp}. Jawaban bisa diubah sampai tanggal tersebut.`
        : "Mohon konfirmasi kehadiran Anda untuk setiap acara.",
    teksUbah: tutup
      ? "Batas waktu konfirmasi sudah lewat."
      : data.batasRsvp
        ? `Masih bisa diubah sampai ${data.batasRsvp}.`
        : "Jawaban masih bisa diubah.",
    hari,
    jam,
    menit,
    detik,
    tampilDetik,
    kolomHitung: tampilDetik ? "repeat(4, minmax(0, 1fr))" : "repeat(3, minmax(0, 1fr))",
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
    teksUcapan: teks,
    sisaKarakter,
    maksUcapan: WISH_MAX_LENGTH,
    placeholderUcapan: `Tulis ucapan untuk ${data.judul}`,
    ucapanOpacity: bisaKirimUcapan ? "1" : "0.45",
    ucapanNonaktif: !bisaKirimUcapan,
    ketikUcapan: (e) => {
      setTeks(e.target.value.slice(0, WISH_MAX_LENGTH));
      setPesanUcapan(null);
    },
    kirimUcapan,
    pesanUcapan,
    ucapan,
    adaUcapan: ucapan.length > 0,
    jumlahUcapan: tampilanHalaman.total,
    halamanKe,
    totalHalaman: tampilanHalaman.totalPages,
    sebelumOp: redup(halamanKe <= 1),
    berikutOp: redup(halamanKe >= tampilanHalaman.totalPages),
    sebelumNonaktif: halamanKe <= 1 || memuatUcapan,
    berikutNonaktif: halamanKe >= tampilanHalaman.totalPages || memuatUcapan,
    halSebelum: () => keHalaman(halamanKe - 1),
    halBerikut: () => keHalaman(halamanKe + 1),
    galeri,
    lajurGaleri,
    fotoBuka: fotoTerbuka,
    fotoWarna: galeri[Math.max(0, foto)]?.warna ?? "",
    fotoSrc: galeri[Math.max(0, foto)]?.src ?? "",
    fotoLabel: `Foto ${foto + 1} dari ${jumlahFoto}`,
    fotoTutup: () => setFoto(-1),
    fotoSebelum: () => setFoto((f) => (f + jumlahFoto - 1) % jumlahFoto),
    fotoBerikut: () => setFoto((f) => (f + 1) % jumlahFoto),
    cerita: data.cerita.map((m, i) => ({
      ...m,
      kunci: `momen-${i}`,
      akhir: i === data.cerita.length - 1,
      tunda: `${(i * 0.12).toFixed(2)}s`,
      tundaGaris: `${(0.3 + i * 0.12).toFixed(2)}s`,
    })),
    rekening,
    label1: rekening[0]?.label ?? "SALIN NOMOR",
    label2: rekening[1]?.label ?? "SALIN NOMOR",
    salin1: () => rekening[0]?.salin(),
    salin2: () => rekening[1]?.salin(),
    undanganTerbuka,
    bukaUndangan: (event) => {
      event.preventDefault();
      const tujuan = event.currentTarget.hash.slice(1);
      setUndanganTerbuka(true);
      if (adaMusik && !musikMain) putar();
      requestAnimationFrame(() => {
        document.getElementById(tujuan)?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    },
    adaMusik,
    toggleMusik,
    musikMain,
    musikDiam: !musikMain,
    musikLabel: musikMain ? "Jeda musik" : "Putar musik",
  };
}
