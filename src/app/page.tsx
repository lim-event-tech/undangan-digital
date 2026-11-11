import type { Metadata } from "next";
import Link from "next/link";
import { Ikon } from "@/components/ikon";
import { BrandLogo } from "@/components/brand-logo";
import "./portal.css";

export const metadata: Metadata = {
  title: { absolute: "UndanganDigital" },
  description: "Buat undangan acara baru atau kelola isi, tamu, dan RSVP undangan Anda.",
};

function Panah() {
  return (
    <svg className="portal-panah" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 12h16M13 5l7 7-7 7" />
    </svg>
  );
}

export default function Beranda() {
  return (
    <div className="portal-awal selalu-gerak">
      <header className="portal-header">
        <Link className="portal-merek" href="/" aria-label="LingkarIDE Manajemen, beranda UndanganDigital">
          <BrandLogo height={40} />
        </Link>
        <Link className="portal-masuk" href="/masuk">Masuk <span aria-hidden="true">↗</span></Link>
      </header>

      <main className="portal-main" aria-labelledby="portal-judul">
        <div className="portal-isi">
          <div className="portal-intro">
            <p className="portal-label">Ruang kerja undangan</p>
            <h1 id="portal-judul">Kelola undangan<br className="portal-jeda" /> acara Anda.</h1>
            <p>Buat undangan baru atau lanjutkan pengelolaan acara yang sudah ada.</p>
          </div>

          <div className="portal-pilihan">
            <Link className="portal-kartu portal-buat" href="/undangan/baru" aria-labelledby="portal-buat-judul" aria-describedby="portal-buat-deskripsi">
              <div className="portal-kartu-atas">
                <span className="portal-ikon"><Ikon nama="pena" ukuran={32} tebal={1.35} /></span>
                <Panah />
              </div>
              <div className="portal-kartu-isi">
                <h2 id="portal-buat-judul">Buat undangan</h2>
                <p id="portal-buat-deskripsi">Pilih template dan isi detail acara baru Anda.</p>
              </div>
            </Link>

            <Link className="portal-kartu portal-kelola" href="/undangan" aria-labelledby="portal-kelola-judul" aria-describedby="portal-kelola-deskripsi">
              <div className="portal-kartu-atas">
                <span className="portal-ikon"><Ikon nama="dasbor" ukuran={32} tebal={1.35} /></span>
                <Panah />
              </div>
              <div className="portal-kartu-isi">
                <h2 id="portal-kelola-judul">Kelola undangan</h2>
                <p id="portal-kelola-deskripsi">Lanjutkan pengelolaan isi, daftar undangan, dan RSVP.</p>
              </div>
            </Link>
          </div>

          <div className="portal-akses">
            <p className="portal-daftar">Belum punya akun? <Link href="/daftar">Daftar</Link></p>
          </div>
        </div>
      </main>

      <footer className="portal-footer">
        <BrandLogo height={28} />
        <p>Untuk tamu, buka tautan undangan yang dibagikan penyelenggara.</p>
      </footer>
    </div>
  );
}
