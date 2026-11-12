"use client";

import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";
import type { TemplateKey } from "@/templates/registry";
import { HiasanEvent, OrnamenEvent } from "./ornamen";
import { warnaTerang } from "@/lib/invitations/tampilan";
import { DekorasiEvent } from "./dekorasi";
import { Sambungan, gayaPanggung } from "./panggung";
import type { PropsBagian, RsvpAcara } from "./jenis";

function Judul({ children }: { children: ReactNode }) {
  return <header className="event-kepala" data-anim="naik"><h2>{children}</h2><span className="event-pemisah" aria-hidden="true" /></header>;
}

export function buatBagian(tema: TemplateKey) {
  function Sampul({ v, berikut, dekorasiId }: PropsBagian) {
    const hiasan = v.tampilan.hiasan;
    const poster = v.poster;
    return (
      <section id="sampul" className="sampul-undangan event-sampul" data-poster={poster ? (v.sembunyikanTeksSampul ? "polos" : "teks") : undefined} style={gayaPanggung(tema, "sampul", v.urutan[1], v.tampilan.warna, v.tampilan.warna ? warnaTerang(v.tampilan.warna.kertas) : false)}>
        {hiasan && !poster ? <OrnamenEvent tema={tema} /> : null}
        {hiasan && !poster ? <DekorasiEvent id={dekorasiId} bagian="sampul" /> : null}
        {hiasan ? <div className="event-bingkai" aria-hidden="true" /> : null}
        {poster ? <div className="event-poster"><Image src={poster.src} alt={`Poster ${v.judul}`} width={poster.width} height={poster.height} sizes="(max-width: 430px) 100vw, 430px" priority className="event-poster-gambar" /></div> : null}
        {v.sembunyikanTeksSampul ? <h1 className="event-sr">{v.judul}</h1> : (
          <div className="sampul-konten">
            {hiasan ? <div className="event-meterai" aria-hidden="true"><HiasanEvent tema={tema} /></div> : null}
            <div className="event-identitas">
              {v.identitas.jenis && !v.judul.toLowerCase().includes(v.identitas.jenis.toLowerCase()) ? <p className="event-jenis">{v.identitas.jenis}</p> : null}
              <h1 style={{ "--ukuran-judul": `${v.ukuranJudul}px` } as CSSProperties}>{v.judul}</h1>
            </div>
            <div className="event-detail-sampul">{v.tglPanjang ? <p className="event-tanggal">{v.tglPanjang}</p> : null}{v.acara[0]?.tempat ? <p className="event-lokasi">{v.acara[0].tempat}</p> : null}</div>
            <div className="event-tamu"><p>Kepada Yth.</p><p className="event-nama-tamu">{v.namaTamu}</p></div>
          </div>
        )}
        <div className="sampul-aksi"><a className="event-tombol" href={`#${berikut}`} onClick={v.bukaUndangan} aria-expanded={v.undanganTerbuka} aria-controls={berikut}>Buka undangan <span aria-hidden="true">↗</span></a><span className="event-petunjuk-buka">{v.mode === "tamu" ? "Informasi acara & konfirmasi kehadiran" : "Pratinjau tampilan · Jawaban tidak disimpan"}</span></div>
        {hiasan && !poster ? <Sambungan tema={tema} variasi={0} bagian="sampul" /> : null}
      </section>
    );
  }

  function Sambutan(props: PropsBagian) {
    return <Salam {...props} tema={tema} />;
  }

  function Penutup({ v }: PropsBagian) {
    return (
      <section id="penutup" className="event-bagian event-penutup">
        {v.tampilan.hiasan ? <HiasanEvent tema={tema} /> : null}
        <Judul>Terima kasih</Judul>
        <p className="event-prosa" data-anim="naik">{v.penutup}</p>
        <p className="event-nama-penutup" data-anim="naik">{v.judul}</p>
        <a className="event-tautan" href="#sampul">Kembali ke atas ↑</a>
      </section>
    );
  }

  return { sampul: Sampul, salam: Sambutan, acara: Acara, tentang: Tentang, penyelenggara: Penyelenggara, agenda: Agenda, pengisi: Pengisi, kontak: Kontak, rsvp: Rsvp, penutup: Penutup };
}

function Salam({ v, tema }: PropsBagian & { tema: TemplateKey }) {
  return (
    <section id="salam" className="event-bagian event-salam">
      <div className="event-surat" data-anim="surat">
        {v.tampilan.hiasan ? <span className="event-tanda-surat" aria-hidden="true">{tema === "melati" || tema === "pasundan" || tema === "bintang" ? <HiasanEvent tema={tema} /> : "❧"}</span> : null}
        <Judul>{v.namaTamu ? `Dear ${v.namaTamu}` : "Dear Tamu Undangan"}</Judul>
        {v.sambutan ? <p className="event-prosa">{v.sambutan}</p> : null}
        {v.penyelenggara.nama ? <p className="event-penanda-surat">{v.penyelenggara.nama}</p> : null}
      </div>
    </section>
  );
}


function Acara({ v }: PropsBagian) {
  return (
    <section id="acara" className="event-bagian event-acara">
      <Judul>Jadwal &amp; lokasi</Judul>
      <div className="event-daftar">{v.acara.map((a, i) => <article className="event-kartu event-agenda" key={a.id} data-anim="naik"><div className="event-sesi-kepala"><span className="event-nomor">{String(i + 1).padStart(2, "0")}</span></div><h3>{a.nama}</h3><div className="event-waktu"><p>{a.tgl}</p>{a.jam ? <p className="event-jam">{a.jam}</p> : null}</div><div className="event-tempat"><p><strong>{a.tempat || "Lokasi akan diinformasikan"}</strong></p>{a.alamat ? <p>{a.alamat}</p> : null}</div><div className="event-aksi">{a.peta ? <a className="event-tombol event-sekunder" href={a.peta} target="_blank" rel="noopener noreferrer">Buka Google Maps <span aria-hidden="true">↗</span></a> : null}{a.kalender ? <a className="event-tautan" href={a.kalender} target="_blank" rel="noopener noreferrer">Tambah ke kalender</a> : null}</div></article>)}</div>
    </section>
  );
}

function Tentang({ v }: PropsBagian) {
  return <section id="tentang" className="event-bagian event-tentang"><Judul>Tentang acara</Judul><p className="event-prosa event-deskripsi" data-anim="naik">{v.identitas.deskripsi}</p></section>;
}

function Penyelenggara({ v }: PropsBagian) {
  const parties = [{ label: "Diselenggarakan oleh", nama: v.penyelenggara.nama, logo: v.logoPenyelenggara }, { label: "Dikelola oleh", nama: v.penyelenggara.namaEo, logo: v.logoEo }];
  return <section id="penyelenggara" className="event-bagian event-penyelenggara"><Judul>Penyelenggara</Judul><div className="event-mitra">{parties.filter((p) => p.nama || p.logo).map((p) => <article className="event-organisasi" key={p.label} data-anim="naik">{p.logo ? <div className="event-logo-bidang"><Image src={p.logo.src} alt={`Logo ${p.nama || p.label.toLowerCase()}`} width={p.logo.width} height={p.logo.height} unoptimized className="event-logo" /></div> : null}{p.nama ? <h3>{p.nama}</h3> : null}</article>)}</div></section>;
}

function Agenda({ v }: PropsBagian) {
  return <section id="agenda" className="event-bagian event-susunan"><Judul>Agenda acara</Judul>{v.acara.filter((a) => a.agenda.length).map((a) => <div key={a.id} className="event-agenda-sesi"><h3>{a.nama}</h3><p className="event-catatan">{a.tgl}</p><ol className="event-rundown">{a.agenda.map((item) => <li key={item.id} data-anim="naik"><time>{item.jam}</time><div><h4>{item.judul}</h4>{item.keterangan ? <p className="event-prosa">{item.keterangan}</p> : null}</div></li>)}</ol></div>)}</section>;
}

function Pengisi({ v }: PropsBagian) {
  return <section id="pengisi" className="event-bagian event-pengisi"><Judul>Pengisi acara</Judul><div className="event-daftar">{v.pengisiAcara.map((item) => <article className="event-profil" key={item.id} data-anim="naik"><div className="event-profil-visual">{item.foto ? <Image src={item.foto.src} alt={item.nama} width={item.foto.width} height={item.foto.height} className="event-profil-foto" /> : <span className="event-profil-inisial" aria-hidden="true">{item.nama.trim().split(/\s+/).slice(0, 2).map(kata => kata[0]).join("")}</span>}</div><h3>{item.nama}</h3>{item.peran || item.instansi ? <p className="event-instansi">{[item.peran, item.instansi].filter(Boolean).join(" \u00b7 ")}</p> : null}{item.profil ? <p className="event-prosa">{item.profil}</p> : null}</article>)}</div></section>;
}


function Kontak({ v }: PropsBagian) {
  return <section id="kontak" className="event-bagian event-kontak"><Judul>Narahubung</Judul><article className="event-kontak-isi" data-anim="naik"><h3>{v.kontak.nama}</h3><div className="event-aksi">{v.kontakWhatsapp ? <a className="event-tombol" href={v.kontakWhatsapp} target="_blank" rel="noopener noreferrer">WhatsApp Narahubung <span aria-hidden="true">↗</span></a> : null}{v.kontakEmail ? <a className="event-tautan" href={v.kontakEmail}>{v.kontak.email}</a> : null}</div></article></section>;
}


function HariHadir({ acara }: { acara: RsvpAcara }) {
  if (!acara.ya || acara.hariPilihan.length === 0) return null;
  const banyak = acara.banyakHari;
  const single = acara.singleDayOnly;
  return (
    <div className="event-hari" role="group" aria-label={`Hari dan jam kehadiran untuk ${acara.nama}`}>
      <p className="event-catatan">
        {banyak
          ? single
            ? "Pilih 1 hari kedatangan Anda dan perkiraan jam datang."
            : "Pilih hari yang akan Anda hadiri dan perkiraan jam datang."
          : "Pilih perkiraan jam datang."}
      </p>
      {acara.hariPilihan.map((h) => (
        <div className="event-hari-baris" key={h.date} data-dipilih={h.dipilih}>
          {banyak ? (
            <label className="event-hari-centang">
              <input
                type={single ? "radio" : "checkbox"}
                name={`hari-${acara.id}`}
                checked={h.dipilih}
                onChange={h.pilih}
              />
              <span>{h.label}</span>
            </label>
          ) : null}
          {h.opsi.length > 0 ? (
            <label className="event-hari-jam"><span>{banyak ? "Jam datang" : "Perkiraan jam datang"}{h.jam ? <small>Acara {h.jam}</small> : null}</span>
              <select value={h.waktu} disabled={!h.dipilih} onChange={(e) => h.ubahWaktu(e.target.value)} aria-label={`Jam datang ${h.label}`}>
                {h.opsi.map((opsi) => <option key={opsi} value={opsi}>{opsi.replace(":", ".")}</option>)}
              </select>
            </label>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function Jumlah({ acara }: { acara: RsvpAcara }) {
  return <div className="event-jumlah"><span>Peserta<small>Maks. {acara.maksPeserta}</small></span><div><button type="button" aria-label={`Kurangi peserta untuk ${acara.nama}`} disabled={acara.peserta <= 1} onClick={acara.kurang}>-</button><output aria-label={`Jumlah peserta untuk ${acara.nama}`}>{acara.peserta}</output><button type="button" aria-label={`Tambah peserta untuk ${acara.nama}`} disabled={acara.peserta >= acara.maksPeserta} onClick={acara.tambah}>+</button></div></div>;
}

function Rsvp({ v }: PropsBagian) {
  return (
    <section id="rsvp" className="event-bagian event-rsvp">
      <Judul>Konfirmasi kehadiran</Judul>
      {v.mode !== "tamu" ? <p className="event-catatan">{v.mode === "contoh" ? "Contoh" : "Pratinjau"}: jawaban tidak disimpan.</p> : null}
      <p className="event-prosa">{v.teksBatas}</p>
      <div className="event-kartu event-form" data-anim="naik">
        <p className="event-untuk">Undangan untuk <strong>{v.namaTamu}</strong></p>
        {v.showForm ? <form onSubmit={(e) => { e.preventDefault(); v.kirimRsvp(); }}><p className="event-catatan">{v.keteranganMaks}</p>{v.rsvpAcara.map((a) => <fieldset key={a.id}><legend>{a.nama}</legend><p className="event-catatan">{[a.tgl, a.jam].filter(Boolean).join(" · ")}</p><div className="event-pilihan"><button type="button" aria-pressed={a.ya} onClick={a.pilihYa}>Hadir</button><button type="button" aria-pressed={a.tidak} onClick={a.pilihTidak}>Tidak hadir</button></div><HariHadir acara={a} />{a.tampilJumlah ? <div className="event-penghitung"><Jumlah acara={a} /></div> : null}</fieldset>)}<button type="submit" className="event-tombol" disabled={v.kirimNonaktif}>Kirim konfirmasi</button></form> : null}
        {v.showTerima ? <div className="event-terima"><span className="event-centang" aria-hidden="true">✓</span><h3>Konfirmasi diterima.</h3><p className="event-prosa">{v.ringkasan}</p>{v.qrTampil ? <div className="event-qr"><Image src={v.qrTampil} alt="Kode QR check-in" width={180} height={180} unoptimized /><p>Tunjukkan kode ini kepada petugas saat tiba.</p></div> : null}<p className="event-catatan">{v.teksUbah}</p>{v.bisaUbah ? <button type="button" className="event-tombol event-sekunder" onClick={v.ubahRsvp}>Ubah jawaban</button> : null}</div> : null}
        {v.showTutup ? <div className="event-terima"><h3>Konfirmasi sudah ditutup.</h3><p className="event-prosa">Batas waktu konfirmasi telah berakhir. Terima kasih atas perhatian Anda.</p></div> : null}
        {v.pesanRsvp ? <p className="event-pesan" role="status">{v.pesanRsvp}</p> : null}
      </div>
    </section>
  );
}


export function Progres() {
  return <div className="event-progres" aria-hidden="true"><span /></div>;
}


