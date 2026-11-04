"use client";

import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";
import type { TemplateKey } from "@/templates/registry";
import { HiasanEvent } from "./hiasan-event";
import type { PropsBagian, RsvpAcara, Vals } from "./jenis";

function Judul({ label, children }: { label: string; children: ReactNode }) {
  return <header className="event-kepala" data-anim="naik"><p className="event-label">{label}</p><h2>{children}</h2><span className="event-pemisah" aria-hidden="true" /></header>;
}

export function buatBagian(tema: TemplateKey) {
  function Sampul({ v, berikut }: PropsBagian) {
    return (
      <section id="sampul" className="sampul-undangan event-sampul">
        <div className="event-bingkai" aria-hidden="true" />
        <div className="sampul-konten">
          <p className="event-label event-edisi">Sebuah undangan untuk Anda</p>
          <HiasanEvent tema={tema} />
          <div className="event-identitas">
            <p className="event-label">Mari hadir dan berbagi momen</p>
            <h1 style={{ "--ukuran-judul": `${v.ukuranJudul}px` } as CSSProperties}>{v.judul}</h1>
            <span className="event-pemisah" aria-hidden="true" />
            {v.tglPanjang ? <p className="event-tanggal">{v.tglPanjang}</p> : null}
            {v.acara[0]?.tempat ? <p className="event-lokasi">{v.acara[0].tempat}</p> : null}
          </div>
          <div className="event-tamu"><p>Kepada Yth.</p><p className="event-nama-tamu">{v.namaTamu}</p><p>Anda diundang untuk hadir bersama kami.</p></div>
        </div>
        <div className="sampul-aksi"><a className="event-tombol" href={`#${berikut}`} onClick={v.bukaUndangan}><span aria-hidden="true">↗</span> Buka undangan</a></div>
      </section>
    );
  }

  function Pembuka({ v, berikut }: PropsBagian) {
    return (
      <section id="mulai" className="event-bagian event-pembuka">
        <HiasanEvent tema={tema} />
        <Judul label="Anda bagian dari momen ini">Sampai jumpa<br />di acara kami.</Judul>
        <p className="event-prosa" data-anim="naik">Kami mengundang Anda untuk hadir dalam <strong>{v.judul}</strong>. Kehadiran Anda akan melengkapi kebersamaan ini.</p>
        {v.tglPanjang ? <p className="event-tanggal" data-anim="naik">{v.tglPanjang}</p> : null}
        <a className="event-tautan" href={`#${berikut}`}>Lihat selengkapnya <span aria-hidden="true">↓</span></a>
      </section>
    );
  }

  function Penutup({ v }: PropsBagian) {
    return (
      <section id="penutup" className="event-bagian event-penutup">
        <HiasanEvent tema={tema} />
        <Judul label="Sampai bertemu">Terima kasih.</Judul>
        <p className="event-prosa" data-anim="naik">{v.penutup}</p>
        <p className="event-nama-penutup" data-anim="naik">{v.judul}</p>
        {v.tglPanjang ? <p className="event-label">{v.tglPanjang}</p> : null}
        <a className="event-tautan" href="#sampul">Kembali ke atas ↑</a>
      </section>
    );
  }

  return { sampul: Sampul, pembuka: Pembuka, salam: Salam, hitung: Hitung, acara: Acara, cerita: Cerita, galeri: Galeri, rsvp: Rsvp, ucapan: Ucapan, amplop: Amplop, penutup: Penutup };
}

function Salam({ v }: PropsBagian) {
  return (
    <section id="salam" className="event-bagian event-salam">
      <p className="event-label" data-anim="naik">Sebuah pertemuan, banyak makna</p>
      {v.kutipan ? <blockquote data-anim="naik">{v.kutipanTampil}</blockquote> : null}
      {v.sambutan ? <p className="event-prosa" data-anim="naik">{v.sambutan}</p> : null}
    </section>
  );
}

function Hitung({ v }: PropsBagian) {
  const angka = [[v.hari, "Hari"], [v.jam, "Jam"], [v.menit, "Menit"], ...(v.tampilDetik ? [[v.detik, "Detik"]] : [])];
  return (
    <section id="hitung" className="event-bagian event-hitung">
      <Judul label="Menanti hari acara">Waktu untuk bertemu.</Judul>
      <div className="event-hitungan" style={{ gridTemplateColumns: v.kolomHitung }} data-anim="zoom">{angka.map(([n, label]) => <div key={label}><span>{n}</span><p>{label}</p></div>)}</div>
      {v.tglPanjang ? <p className="event-tanggal">{v.tglPanjang}</p> : null}
      {v.kalender ? <a className="event-tombol event-sekunder" href={v.kalender} download>Simpan ke kalender</a> : null}
    </section>
  );
}

function Acara({ v }: PropsBagian) {
  return (
    <section id="acara" className="event-bagian event-acara">
      <Judul label="Waktu & tempat">Catat agendanya.</Judul>
      <div className="event-daftar">{v.acara.map((a, i) => <article className="event-kartu event-agenda" key={a.id} data-anim="naik"><span className="event-nomor" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span><p className="event-label">{a.tgl}</p><h3>{a.nama}</h3>{a.jam ? <p className="event-jam">{a.jam}</p> : null}<div className="event-tempat"><p><strong>{a.tempat || "Lokasi akan diinformasikan"}</strong></p>{a.alamat ? <p>{a.alamat}</p> : null}</div><div className="event-aksi">{a.peta ? <a className="event-tombol event-sekunder" href={a.peta} target="_blank" rel="noopener noreferrer">Lihat lokasi ↗</a> : null}{a.kalender ? <a className="event-tautan" href={a.kalender} target="_blank" rel="noopener noreferrer">Tambah ke kalender</a> : null}</div></article>)}</div>
    </section>
  );
}

function Cerita({ v }: PropsBagian) {
  return (
    <section id="cerita" className="event-bagian event-cerita">
      <Judul label="Cerita di balik acara">Perjalanan & momen.</Judul>
      <div className="event-linimasa">{v.cerita.map((c) => <article key={c.kunci} data-anim="naik"><p className="event-label">{c.tahun}</p><h3>{c.judul}</h3><p className="event-prosa">{c.teks}</p></article>)}</div>
    </section>
  );
}

function Galeri({ v }: PropsBagian) {
  return (
    <section id="galeri" className="event-bagian event-galeri">
      <Judul label="Dalam bingkai">Galeri momen.</Judul>
      <p className="event-prosa">Cerita yang tersimpan dalam gambar. Ketuk foto untuk melihat lebih dekat.</p>
      <div className="event-lajur">{v.lajurGaleri.map((lajur, i) => <div key={i}>{lajur.map((f) => <button type="button" className="event-foto" key={f.id} onClick={f.buka} aria-label={`Buka ${f.label}`} style={{ aspectRatio: f.rasio, background: f.warna }} data-anim="naik">{f.src ? <Image src={f.src} alt={f.label} fill sizes={f.sizes} style={{ objectFit: "contain" }} /> : <span className="event-foto-contoh"><svg viewBox="0 0 100 100" fill="none" aria-hidden="true"><circle cx="66" cy="29" r="12" fill="currentColor" opacity=".35" /><path d="M0 90L33 45L63 79L82 57L100 83V100H0Z" fill="currentColor" opacity=".2" /><path d="M0 100L36 71L61 90L85 79L100 90V100" fill="currentColor" opacity=".2" /></svg><span>{f.label}</span></span>}</button>)}</div>)}</div>
    </section>
  );
}

function Jumlah({ acara, anak = false }: { acara: RsvpAcara; anak?: boolean }) {
  const nilai = anak ? acara.anak : acara.dewasa;
  const maks = anak ? acara.maksA : acara.maksD;
  const label = anak ? "anak" : "dewasa";
  return <div className="event-jumlah"><span>{anak ? "Anak" : "Dewasa"}<small>Maks. {maks}</small></span><div><button type="button" aria-label={`Kurangi ${label} untuk ${acara.nama}`} disabled={nilai <= (anak ? 0 : 1)} onClick={anak ? acara.kurangA : acara.kurangD}>−</button><output aria-label={`Jumlah ${label} untuk ${acara.nama}`}>{nilai}</output><button type="button" aria-label={`Tambah ${label} untuk ${acara.nama}`} disabled={nilai >= maks} onClick={anak ? acara.tambahA : acara.tambahD}>+</button></div></div>;
}

function Rsvp({ v }: PropsBagian) {
  return (
    <section id="rsvp" className="event-bagian event-rsvp">
      <Judul label="Konfirmasi kehadiran">Apakah Anda<br />akan hadir?</Judul>
      <p className="event-prosa">{v.teksBatas}</p>
      <div className="event-kartu event-form" data-anim="naik">
        <p className="event-untuk">Undangan untuk <strong>{v.namaTamu}</strong></p>
        {v.showForm ? <form onSubmit={(e) => { e.preventDefault(); v.kirimRsvp(); }}><p className="event-catatan">{v.keteranganMaks}</p>{v.rsvpAcara.map((a) => <fieldset key={a.id}><legend>{a.nama}</legend><p className="event-catatan">{[a.tgl, a.jam].filter(Boolean).join(" · ")}</p><div className="event-pilihan"><button type="button" aria-pressed={a.ya} onClick={a.pilihYa}>Hadir</button><button type="button" aria-pressed={a.tidak} onClick={a.pilihTidak}>Tidak hadir</button></div>{a.tampilJumlah ? <div className="event-penghitung"><Jumlah acara={a} />{a.showAnak ? <Jumlah acara={a} anak /> : null}</div> : null}</fieldset>)}<button type="submit" className="event-tombol" disabled={v.kirimNonaktif}>Kirim konfirmasi</button></form> : null}
        {v.showTerima ? <div className="event-terima"><span className="event-centang" aria-hidden="true">✓</span><h3>Konfirmasi diterima.</h3><p className="event-prosa">{v.ringkasan}</p>{v.qrTampil ? <div className="event-qr"><Image src={v.qrTampil} alt="Kode QR check-in" width={180} height={180} unoptimized /><p>Tunjukkan kode ini kepada petugas saat tiba.</p></div> : null}<p className="event-catatan">{v.teksUbah}</p>{v.bisaUbah ? <button type="button" className="event-tombol event-sekunder" onClick={v.ubahRsvp}>Ubah jawaban</button> : null}</div> : null}
        {v.showTutup ? <div className="event-terima"><h3>Konfirmasi sudah ditutup.</h3><p className="event-prosa">Batas waktu konfirmasi telah berakhir. Terima kasih atas perhatian Anda.</p></div> : null}
        {v.pesanRsvp ? <p className="event-pesan" role="status">{v.pesanRsvp}</p> : null}
      </div>
    </section>
  );
}

function Ucapan({ v }: PropsBagian) {
  return (
    <section id="ucapan" className="event-bagian event-ucapan">
      <Judul label="Dari para tamu">Pesan & harapan.</Judul>
      <form className="event-kartu event-form" data-anim="naik" onSubmit={(e) => { e.preventDefault(); v.kirimUcapan(); }}><label htmlFor="pesan-tamu">Tulis pesan Anda</label><textarea id="pesan-tamu" rows={4} value={v.teksUcapan} onChange={v.ketikUcapan} maxLength={v.maksUcapan} placeholder={v.placeholderUcapan} /><p className="event-catatan event-karakter">{v.sisaKarakter} karakter tersisa</p><button type="submit" className="event-tombol" disabled={v.ucapanNonaktif}>Kirim pesan</button>{v.pesanUcapan ? <p className="event-pesan" role="status">{v.pesanUcapan}</p> : null}</form>
      <p className="event-label event-total">{v.jumlahUcapan} pesan</p>
      <div className="event-daftar">{v.adaUcapan ? v.ucapan.map((u) => <article className="event-pesan-tamu" key={u.id}><span className="event-avatar" style={{ background: u.avatar }} aria-hidden="true">{u.inisial}</span><div><h3>{u.nama}</h3><span className="event-lencana" style={{ background: u.badgeBg, color: u.badgeFg }}>{u.badge}</span><p className="event-prosa">{u.teks}</p><time className="event-catatan">{u.waktu}</time></div></article>) : <p className="event-prosa">Belum ada pesan. Jadilah yang pertama menyapa.</p>}</div>
      {v.totalHalaman > 1 ? <nav className="event-halaman" aria-label="Halaman pesan"><button type="button" disabled={v.sebelumNonaktif} onClick={v.halSebelum} aria-label="Pesan sebelumnya">←</button><span>{v.halamanKe} / {v.totalHalaman}</span><button type="button" disabled={v.berikutNonaktif} onClick={v.halBerikut} aria-label="Pesan berikutnya">→</button></nav> : null}
    </section>
  );
}

function Amplop({ v }: PropsBagian) {
  return (
    <section id="amplop" className="event-bagian event-rekening">
      <Judul label="Informasi tambahan">Informasi rekening.</Judul>
      <p className="event-prosa">Berikut informasi rekening yang disediakan oleh penyelenggara acara.</p>
      <div className="event-daftar">{v.rekening.map((r) => <article key={r.kunci} className="event-kartu event-bank" data-anim="naik"><p className="event-label">{r.bank}</p><p className="event-nomor-rekening">{r.nomor}</p><p>{r.atasNama}</p><button type="button" className="event-tombol event-sekunder" onClick={r.salin} aria-label={`${r.label.toLowerCase()} ${r.bank} ${r.atasNama}`}>{r.label === "TERSALIN" ? "Tersalin ✓" : "Salin nomor"}</button></article>)}</div>
      {v.qris ? <div className="event-kartu event-qr" data-anim="naik"><p className="event-label">QRIS penyelenggara</p><Image src={v.qris} alt="QRIS penyelenggara acara" width={240} height={300} unoptimized style={{ width: "100%", height: "auto", maxWidth: 240 }} /></div> : null}
    </section>
  );
}

export function Progres() {
  return <div className="event-progres" aria-hidden="true"><span /></div>;
}

export function Lightbox({ v }: { v: Vals }) {
  return v.fotoBuka ? <div className="event-lightbox" role="dialog" aria-modal="true" aria-label={v.fotoLabel} onClick={v.fotoTutup} onKeyDown={(e) => { if (e.key !== "Tab") return; const tombol = Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>("button")); const pertama = tombol[0]; const terakhir = tombol[tombol.length - 1]; if (e.shiftKey && document.activeElement === pertama) { e.preventDefault(); terakhir?.focus(); } else if (!e.shiftKey && document.activeElement === terakhir) { e.preventDefault(); pertama?.focus(); } }}><button type="button" className="event-tutup-foto" data-tutup-foto onClick={v.fotoTutup} aria-label="Tutup foto">×</button><div className="event-foto-besar" onClick={(e) => e.stopPropagation()}>{v.fotoSrc ? <Image src={v.fotoSrc} alt={v.fotoLabel} fill sizes="100vw" style={{ objectFit: "contain" }} /> : <div style={{ background: v.fotoWarna }}><p>Pratinjau galeri</p></div>}</div><div className="event-navigasi-foto" onClick={(e) => e.stopPropagation()}><button type="button" onClick={v.fotoSebelum} aria-label="Foto sebelumnya">←</button><p aria-live="polite">{v.fotoLabel}</p><button type="button" onClick={v.fotoBerikut} aria-label="Foto berikutnya">→</button></div></div> : null;
}

export function Musik({ v }: { v: Vals }) {
  return v.adaMusik ? <button type="button" className="event-musik" onClick={v.toggleMusik} aria-label={v.musikLabel} aria-pressed={v.musikMain}><span className={v.musikMain ? "event-berputar" : ""} aria-hidden="true">♫</span></button> : null;
}
