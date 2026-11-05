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
          <p className="event-label event-edisi">Undangan event</p>
          <HiasanEvent tema={tema} />
          <div className="event-identitas">
            <p className="event-label">Undangan resmi</p>
            <h1 style={{ "--ukuran-judul": `${v.ukuranJudul}px` } as CSSProperties}>{v.judul}</h1>
            {v.identitas.subjudul ? <p className="event-subjudul">{v.identitas.subjudul}</p> : null}
            <span className="event-pemisah" aria-hidden="true" />
            {v.tglPanjang ? <p className="event-tanggal">{v.tglPanjang}</p> : null}
            {v.acara[0]?.tempat ? <p className="event-lokasi">{v.acara[0].tempat}</p> : null}
          </div>
          <div className="event-tamu"><p>Kepada Yth.</p><p className="event-nama-tamu">{v.namaTamu}</p><p>Mohon kesediaan Anda untuk hadir.</p></div>
        </div>
        <div className="sampul-aksi"><a className="event-tombol" href={`#${berikut}`} onClick={v.bukaUndangan}><span aria-hidden="true">↗</span> Buka undangan</a></div>
      </section>
    );
  }

  function Pembuka({ v, berikut }: PropsBagian) {
    return (
      <section id="mulai" className="event-bagian event-pembuka">
        <HiasanEvent tema={tema} />
        <Judul label="Undangan resmi">{v.penyelenggara.nama || "Kami mengundang Anda"}</Judul>
        <p className="event-prosa" data-anim="naik">Kami mengundang Anda untuk hadir dalam <strong>{v.judul}</strong>. Informasi kegiatan dan konfirmasi kehadiran tersedia pada undangan ini.</p>
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

  return { sampul: Sampul, pembuka: Pembuka, salam: Salam, hitung: Hitung, acara: Acara, tentang: Tentang, penyelenggara: Penyelenggara, agenda: Agenda, pengisi: Pengisi, informasi: Informasi, kontak: Kontak, galeri: Galeri, rsvp: Rsvp, ucapan: Ucapan, penutup: Penutup };
}

function Salam({ v }: PropsBagian) {
  return (
    <section id="salam" className="event-bagian event-salam">
      <Judul label="Undangan">Sambutan.</Judul>
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

function Tentang({ v }: PropsBagian) {
  return <section id="tentang" className="event-bagian"><Judul label={v.identitas.jenis || "Tentang kegiatan"}>Tentang event.</Judul>{v.identitas.subjudul ? <h3 className="event-subjudul" data-anim="naik">{v.identitas.subjudul}</h3> : null}{v.identitas.deskripsi ? <p className="event-prosa" data-anim="naik">{v.identitas.deskripsi}</p> : null}</section>;
}

function Penyelenggara({ v }: PropsBagian) {
  const parties = [{ label: "Diselenggarakan oleh", nama: v.penyelenggara.nama, logo: v.logoPenyelenggara }, { label: "Dikelola oleh", nama: v.penyelenggara.namaEo, logo: v.logoEo }];
  return <section id="penyelenggara" className="event-bagian"><Judul label="Penyelenggara & EO">Pelaksana kegiatan.</Judul><div className="event-daftar">{parties.filter((p) => p.nama || p.logo).map((p) => <article className="event-kartu event-organisasi" key={p.label} data-anim="naik"><p className="event-label">{p.label}</p>{p.logo ? <Image src={p.logo.src} alt={`Logo ${p.nama || p.label.toLowerCase()}`} width={p.logo.width} height={p.logo.height} unoptimized className="event-logo" /> : null}{p.nama ? <h3>{p.nama}</h3> : null}</article>)}</div></section>;
}

function Agenda({ v }: PropsBagian) {
  return <section id="agenda" className="event-bagian"><Judul label="Susunan kegiatan">Agenda.</Judul>{v.acara.filter((a) => a.agenda.length).map((a) => <div key={a.id} className="event-agenda-sesi"><h3>{a.nama}</h3><p className="event-catatan">{a.tgl}</p><ol className="event-rundown">{a.agenda.map((item) => <li key={item.id} data-anim="naik"><time>{item.jam}</time><div><h4>{item.judul}</h4>{item.keterangan ? <p className="event-prosa">{item.keterangan}</p> : null}</div></li>)}</ol></div>)}</section>;
}

function Pengisi({ v }: PropsBagian) {
  return <section id="pengisi" className="event-bagian"><Judul label="Narasumber & pengisi acara">Bersama para pengisi acara.</Judul><div className="event-daftar">{v.pengisiAcara.map((item) => <article className="event-kartu" key={item.id} data-anim="naik">{item.peran ? <p className="event-label">{item.peran}</p> : null}<h3>{item.nama}</h3>{item.instansi ? <p className="event-catatan">{item.instansi}</p> : null}{item.profil ? <p className="event-prosa">{item.profil}</p> : null}</article>)}</div></section>;
}

function Informasi({ v }: PropsBagian) {
  const rows = [["Dress code", v.informasiPeserta.dressCode], ["Ketentuan kehadiran", v.informasiPeserta.ketentuan], ["Petunjuk lokasi", v.informasiPeserta.petunjukLokasi]];
  return <section id="informasi" className="event-bagian"><Judul label="Sebelum hadir">Informasi peserta.</Judul><div className="event-daftar">{rows.filter(([, value]) => value).map(([label, value]) => <article className="event-kartu" key={label} data-anim="naik"><h3>{label}</h3><p className="event-prosa">{value}</p></article>)}</div></section>;
}

function Kontak({ v }: PropsBagian) {
  return <section id="kontak" className="event-bagian"><Judul label="Hubungi panitia">Narahubung.</Judul><article className="event-kartu" data-anim="naik"><h3>{v.kontak.nama}</h3><div className="event-aksi">{v.kontakWhatsapp ? <a className="event-tombol event-sekunder" href={v.kontakWhatsapp} target="_blank" rel="noopener noreferrer">WhatsApp panitia</a> : null}{v.kontakEmail ? <a className="event-tautan" href={v.kontakEmail}>{v.kontak.email}</a> : null}</div></article></section>;
}

function Galeri({ v }: PropsBagian) {
  return (
    <section id="galeri" className="event-bagian event-galeri">
      <Judul label="Dalam bingkai">Galeri event.</Judul>
      <p className="event-prosa">Dokumentasi dan informasi kegiatan dalam gambar. Ketuk foto untuk melihat lebih dekat.</p>
      <div className="event-lajur">{v.lajurGaleri.map((lajur, i) => <div key={i}>{lajur.map((f) => <button type="button" className="event-foto" key={f.id} onClick={f.buka} aria-label={`Buka ${f.label}`} style={{ aspectRatio: f.rasio, background: f.warna }} data-anim="naik">{f.src ? <Image src={f.src} alt={f.label} fill sizes={f.sizes} style={{ objectFit: "contain" }} /> : <span className="event-foto-contoh"><svg viewBox="0 0 100 100" fill="none" aria-hidden="true"><circle cx="66" cy="29" r="12" fill="currentColor" opacity=".35" /><path d="M0 90L33 45L63 79L82 57L100 83V100H0Z" fill="currentColor" opacity=".2" /><path d="M0 100L36 71L61 90L85 79L100 90V100" fill="currentColor" opacity=".2" /></svg><span>{f.label}</span></span>}</button>)}</div>)}</div>
    </section>
  );
}

function Jumlah({ acara }: { acara: RsvpAcara }) {
  return <div className="event-jumlah"><span>Peserta<small>Maks. {acara.maksPeserta}</small></span><div><button type="button" aria-label={`Kurangi peserta untuk ${acara.nama}`} disabled={acara.peserta <= 1} onClick={acara.kurang}>-</button><output aria-label={`Jumlah peserta untuk ${acara.nama}`}>{acara.peserta}</output><button type="button" aria-label={`Tambah peserta untuk ${acara.nama}`} disabled={acara.peserta >= acara.maksPeserta} onClick={acara.tambah}>+</button></div></div>;
}

function Rsvp({ v }: PropsBagian) {
  return (
    <section id="rsvp" className="event-bagian event-rsvp">
      <Judul label="Konfirmasi kehadiran">Apakah Anda<br />akan hadir?</Judul>
      <p className="event-prosa">{v.teksBatas}</p>
      <div className="event-kartu event-form" data-anim="naik">
        <p className="event-untuk">Undangan untuk <strong>{v.namaTamu}</strong></p>
        {v.showForm ? <form onSubmit={(e) => { e.preventDefault(); v.kirimRsvp(); }}><p className="event-catatan">{v.keteranganMaks}</p>{v.rsvpAcara.map((a) => <fieldset key={a.id}><legend>{a.nama}</legend><p className="event-catatan">{[a.tgl, a.jam].filter(Boolean).join(" · ")}</p><div className="event-pilihan"><button type="button" aria-pressed={a.ya} onClick={a.pilihYa}>Hadir</button><button type="button" aria-pressed={a.tidak} onClick={a.pilihTidak}>Tidak hadir</button></div>{a.tampilJumlah ? <div className="event-penghitung"><Jumlah acara={a} /></div> : null}</fieldset>)}<button type="submit" className="event-tombol" disabled={v.kirimNonaktif}>Kirim konfirmasi</button></form> : null}
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
      <Judul label="Dari para tamu">Pesan tamu.</Judul>
      <form className="event-kartu event-form" data-anim="naik" onSubmit={(e) => { e.preventDefault(); v.kirimUcapan(); }}><label htmlFor="pesan-tamu">Tulis pesan Anda</label><textarea id="pesan-tamu" rows={4} value={v.teksUcapan} onChange={v.ketikUcapan} maxLength={v.maksUcapan} placeholder={v.placeholderUcapan} /><p className="event-catatan event-karakter">{v.sisaKarakter} karakter tersisa</p><button type="submit" className="event-tombol" disabled={v.ucapanNonaktif}>Kirim pesan</button>{v.pesanUcapan ? <p className="event-pesan" role="status">{v.pesanUcapan}</p> : null}</form>
      <p className="event-label event-total">{v.jumlahUcapan} pesan</p>
      <div className="event-daftar">{v.adaUcapan ? v.ucapan.map((u) => <article className="event-pesan-tamu" key={u.id}><span className="event-avatar" style={{ background: u.avatar }} aria-hidden="true">{u.inisial}</span><div><h3>{u.nama}</h3><span className="event-lencana" style={{ background: u.badgeBg, color: u.badgeFg }}>{u.badge}</span><p className="event-prosa">{u.teks}</p><time className="event-catatan">{u.waktu}</time></div></article>) : <p className="event-prosa">Belum ada pesan. Jadilah yang pertama menyapa.</p>}</div>
      {v.totalHalaman > 1 ? <nav className="event-halaman" aria-label="Halaman pesan"><button type="button" disabled={v.sebelumNonaktif} onClick={v.halSebelum} aria-label="Pesan sebelumnya">←</button><span>{v.halamanKe} / {v.totalHalaman}</span><button type="button" disabled={v.berikutNonaktif} onClick={v.halBerikut} aria-label="Pesan berikutnya">→</button></nav> : null}
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
