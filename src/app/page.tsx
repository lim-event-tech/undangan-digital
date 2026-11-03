import "@fontsource/cormorant-garamond/400-italic.css";
import "@fontsource/pinyon-script/400.css";
import "@/components/landing/landing.css";
import type { CSSProperties, ReactNode } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import { db } from "@/db";
import { IlustrasiSapaan } from "@/components/landing/ilustrasi-sapaan";
import { KARTU_TEMPLATE, angkaKata } from "@/components/landing/kartu-template";
import { gambarTemplate } from "@/templates/registry";
import { listSelectableTemplates } from "@/lib/platform/templates";

export const metadata: Metadata = {
  title: { absolute: "UndanganDigital: undangan yang menyapa tiap tamu" },
};

const lebar: CSSProperties = { maxWidth: "1180px", margin: "0 auto" };
const gutter = "clamp(16px, 3vw, 32px)";

const FITUR = [
  "Sapaan nama per tamu",
  "RSVP dewasa dan anak",
  "Kirim lewat WhatsApp",
  "Akad dan resepsi terpisah",
  "Peta dan simpan ke kalender",
  "Dashboard real-time",
  "Susun blok sesuka hati",
];

const TANYA = [
  {
    q: "Apakah tamu perlu membuat akun?",
    a: "Tidak. Tiap tamu mendapat link pribadi, jadi namanya langsung tampil dan ia cukup mengetuk tombol untuk konfirmasi.",
  },
  {
    q: "Bisakah jam atau lokasi diubah setelah dikirim?",
    a: "Bisa. Semua tamu langsung melihat versi terbaru tanpa perlu dikirimi ulang.",
  },
  {
    q: "Bisakah susunan bagian undangan diubah?",
    a: "Bisa. Seret bagian ke posisi lain atau sembunyikan yang tidak perlu.",
  },
];

const BATANG = [
  { tinggi: "20%", warna: "#E3D2A9" },
  { tinggi: "62%", warna: "#E3D2A9" },
  { tinggi: "100%", warna: "#7D5F28" },
  { tinggi: "50%", warna: "#E3D2A9" },
  { tinggi: "36%", warna: "#E3D2A9" },
  { tinggi: "55%", warna: "#C29A8C" },
  { tinggi: "32%", warna: "#E3D2A9" },
];

function Panah() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

function Merek() {
  return (
    <Link href="/" className="merek" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none", color: "#2A2622", minWidth: 0 }}>
      <span className="jdl merek-teks" style={{ fontSize: "23px" }}>
        UndanganDigital
      </span>
    </Link>
  );
}

function JudulBagian({ children, ukuran = "53px" }: { children: ReactNode; ukuran?: string }) {
  return (
    <h2 className="jdl jdl-besar" style={{ fontSize: ukuran }}>
      {children}
    </h2>
  );
}

const kartuStat: CSSProperties = { padding: "16px" };
const labelStat: CSSProperties = { fontSize: "13px", fontWeight: 600 };
const angkaStat: CSSProperties = { display: "block", fontSize: "47px" };

export default async function Beranda() {
  await connection();
  const templates = await listSelectableTemplates(db);
  const jumlah = templates.length;

  return (
    <div
      className="landing papan selalu-gerak"
      style={{ minHeight: "100vh", fontFamily: "'Jost', system-ui, sans-serif", color: "#2A2622", overflowX: "hidden" }}
    >
      <header
        className="kepala"
        style={{
          ...lebar,
          padding: `18px ${gutter}`,
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px 14px",
        }}
      >
        <Merek />
        <nav aria-label="Menu" className="desk-saja" style={{ display: "flex", alignItems: "center", gap: "22px", fontWeight: 600, fontSize: "15px" }}>
          <a href="#template" style={{ color: "#2A2622" }}>
            Template
          </a>
          <a href="#cara" style={{ color: "#2A2622" }}>
            Cara kerja
          </a>
          <a href="#tanya" style={{ color: "#2A2622" }}>
            Pertanyaan
          </a>
        </nav>
        <div className="kepala-aksi" style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
          <Link href="/masuk" className="t t-kecil">
            Masuk
          </Link>
          <Link href="/daftar" className="t t-kecil t-kunyit">
            <span className="desk-inline">Daftar gratis</span>
            <span className="hp-inline">Daftar</span>
          </Link>
        </div>
      </header>

      <main>
        <section
          style={{ ...lebar, padding: `30px ${gutter} 70px`, display: "flex", flexWrap: "wrap", alignItems: "center", gap: "40px" }}
        >
          <div style={{ flex: "1 1 460px", minWidth: 0, display: "flex", flexDirection: "column", gap: "22px" }}>
            <h1 className="jdl jdl-raksasa" style={{ fontSize: "74px" }}>
              Undangan pernikahan yang menyapa tiap tamu dengan <span className="stabilo">namanya.</span>
            </h1>
            <p style={{ margin: 0, maxWidth: "540px", fontSize: "18px", fontWeight: 400, lineHeight: 1.6 }}>
              Pilih template beranimasi, isi dan susun detail acara, impor daftar tamu, lalu kirim link personal lewat
              WhatsApp. Tamu konfirmasi hadir tanpa membuat akun, dan Anda melihat hasilnya di satu dashboard.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
              <Link href="/daftar" className="t t-besar t-kunyit">
                Daftar gratis
                <Panah />
              </Link>
              <a href="#template" className="t t-besar">
                Lihat template
              </a>
            </div>
            <p style={{ margin: 0, fontSize: "14px", fontWeight: 400, color: "#6A6157" }}>
              Daftar dengan akun Google atau email. Tamu tidak perlu login.
            </p>
          </div>
          <div style={{ flex: "1 1 400px", minWidth: 0, display: "flex", justifyContent: "center" }}>
            <IlustrasiSapaan />
          </div>
        </section>

        <div
          style={{ borderTop: "1px solid #D9C9A6", borderBottom: "1px solid #D9C9A6", background: "#FFFFFF", padding: "20px 0", overflow: "hidden" }}
          aria-label="Fitur"
        >
          <div className="jalur">
            {[...FITUR, ...FITUR].map((teks, i) => (
              <span
                key={i}
                aria-hidden={i >= FITUR.length ? true : undefined}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "28px",
                  font: "italic 500 23px 'Cormorant Garamond', Georgia, serif",
                  color: "#4A433B",
                  whiteSpace: "nowrap",
                }}
              >
                {teks}
                <span style={{ width: "6px", height: "6px", background: "#A8853F", transform: "rotate(45deg)" }} aria-hidden="true" />
              </span>
            ))}
          </div>
        </div>

        <section id="cara" style={{ ...lebar, padding: `90px ${gutter} 40px`, display: "flex", flexDirection: "column", gap: "30px" }}>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: "14px" }}>
            <JudulBagian>
              Siap kirim dalam <span className="stabilo">empat langkah</span>
            </JudulBagian>
            <p style={{ margin: 0, maxWidth: "360px", fontSize: "16px", fontWeight: 400 }}>
              Rata-rata cukup satu sesi santai, tanpa bantuan tim kami.
            </p>
          </div>
          <ol
            style={{
              listStyle: "none",
              margin: 0,
              padding: 0,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(230px, 100%), 1fr))",
              gap: "22px",
            }}
          >
            {[
              ["Pilih template", `${angkaKata(jumlah)} tema beranimasi. Lihat pratinjau di HP dan desktop sebelum menyimpan.`],
              ["Isi dan susun", "Nama mempelai, foto, dan tiap acara lengkap dengan peta. Susun ulang bagiannya dengan seret."],
              ["Impor tamu", "Unggah spreadsheet, atur batas dewasa dan anak serta acara yang diundang per tamu."],
              ["Kirim dan pantau", "Satu ketukan langsung kirim semua undangan. RSVP masuk ke dashboard."],
            ].map(([judul, teks], i) => (
              <li key={judul} className="k" style={{ padding: "22px 20px", display: "flex", flexDirection: "column", gap: "12px" }}>
                <span
                  className="jdl"
                  style={{
                    width: "58px",
                    height: "58px",
                    border: "1px solid #C6A867",
                    borderRadius: "50%",
                    background: "#FAF7F0",
                    color: "#7D5F28",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "34px",
                    fontStyle: "italic",
                    fontWeight: 400,
                  }}
                >
                  {i + 1}
                </span>
                <h3 className="jdl" style={{ fontSize: "28px" }}>
                  {judul}
                </h3>
                <p style={{ margin: 0, fontSize: "15px", fontWeight: 400, lineHeight: 1.55 }}>{teks}</p>
              </li>
            ))}
          </ol>
        </section>

        <section id="template" style={{ ...lebar, padding: `60px ${gutter}`, display: "flex", flexDirection: "column", gap: "30px" }}>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: "14px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <span className="stiker" style={{ alignSelf: "flex-start", background: "#F3E5DE" }}>
                {jumlah} tema
              </span>
              <JudulBagian>
                Template yang terasa <span className="stabilo">hidup</span>
              </JudulBagian>
            </div>
            <p style={{ margin: 0, maxWidth: "420px", fontSize: "16px", fontWeight: 400, lineHeight: 1.55 }}>
              Bunga yang bergoyang, siger berkilau, bintang jatuh, dan angklung berayun.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(200px, 100%), 1fr))", gap: "24px" }}>
            {templates.map((t) => {
              const kartu = KARTU_TEMPLATE[t.key];
              return (
                <Link key={t.key} href={`/contoh/${t.key}`} className="polaroid">
                  <span
                    style={{ display: "block", overflow: "hidden", border: "1px solid #E4DAC7", borderRadius: "8px", background: "#F5EEDF", aspectRatio: "390 / 600" }}
                  >
                    <Image
                      unoptimized
                      src={gambarTemplate(t.key).hp}
                      alt={`Tampilan template ${t.label}`}
                      width={780}
                      height={1688}
                      loading="lazy"
                      style={{ display: "block", width: "100%", height: "100%", objectFit: "cover", objectPosition: "top" }}
                    />
                  </span>
                  <span className="jdl" style={{ fontSize: "23px" }}>
                    {t.label}
                  </span>
                  <span style={{ fontSize: "13px", fontWeight: 400, color: "#6A6157", marginTop: "-6px" }}>{kartu.ket}</span>
                </Link>
              );
            })}
          </div>
          <Link href="/undangan/baru" className="t t-besar" style={{ alignSelf: "center" }}>
            Pilih template
            <Panah />
          </Link>
        </section>

        <section style={{ ...lebar, padding: `60px ${gutter}`, display: "flex", flexWrap: "wrap", alignItems: "center", gap: "40px" }}>
          <div style={{ flex: "1 1 380px", display: "flex", flexDirection: "column", gap: "16px" }}>
            <JudulBagian>
              Hitung tamu tanpa <span className="stabilo">rekap manual</span>
            </JudulBagian>
            <p style={{ margin: 0, fontSize: "17px", fontWeight: 400, lineHeight: 1.6 }}>
              Lihat siapa yang hadir, tidak hadir, dan belum menjawab, lengkap dengan jumlah dewasa dan anak per acara. Tahu juga
              siapa yang sudah membuka undangannya, lalu ingatkan yang belum dengan satu ketukan.
            </p>
          </div>
          <div style={{ flex: "1 1 420px", position: "relative", display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "14px" }}>
            <span className="stiker" style={{ position: "absolute", top: "-16px", right: "6px", zIndex: 2, background: "#FFFFFF" }}>
              Contoh
            </span>
            <div className="k" style={{ ...kartuStat, background: "#7D5F28", color: "#FFFFFF" }}>
              <span style={labelStat}>Hadir</span>
              <span className="jdl" style={angkaStat}>
                98
              </span>
            </div>
            <div className="k" style={{ ...kartuStat, background: "#EADAD0" }}>
              <span style={labelStat}>Tidak hadir</span>
              <span className="jdl" style={angkaStat}>
                21
              </span>
            </div>
            <div className="k" style={{ ...kartuStat, background: "#EFE4CC" }}>
              <span style={labelStat}>Belum menjawab</span>
              <span className="jdl" style={angkaStat}>
                67
              </span>
            </div>
            <div
              className="k"
              style={{ ...kartuStat, background: "#2A2622", color: "#FAF7F0", boxShadow: "0 18px 40px -22px rgba(42,38,34,.32)" }}
            >
              <span style={labelStat}>Total orang hadir</span>
              <span className="jdl" style={angkaStat}>
                231
              </span>
              <span style={{ fontSize: "12px", fontWeight: 400 }}>196 dewasa · 35 anak</span>
            </div>
            <div
              className="k"
              style={{ gridColumn: "span 2", padding: "16px", display: "flex", alignItems: "flex-end", gap: "10px", height: "150px" }}
              aria-hidden="true"
            >
              {BATANG.map((b, i) => (
                <span
                  key={i}
                  className="tumbuhY"
                  style={{ "--d": `${(i * 0.08).toFixed(2)}s`, flex: 1, height: b.tinggi, background: b.warna, borderRadius: "6px 6px 0 0" } as CSSProperties}
                />
              ))}
            </div>
          </div>
        </section>

        <section id="tanya" style={{ maxWidth: "860px", margin: "0 auto", padding: `60px ${gutter}`, display: "flex", flexDirection: "column", gap: "22px" }}>
          <JudulBagian>
            Pertanyaan yang <span className="stabilo">sering muncul</span>
          </JudulBagian>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {TANYA.map((t, i) => (
              <details key={t.q} className="tanya k-polos" open={i === 0}>
                <summary>
                  {t.q}
                  <span
                    className="plus"
                    style={{
                      width: "32px",
                      height: "32px",
                      flex: "none",
                      border: "1px solid #E4DAC7",
                      borderRadius: "50%",
                      background: "#EFE4CC",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    aria-hidden="true"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </span>
                </summary>
                <p style={{ margin: 0, padding: "0 18px 18px", fontSize: "15px", fontWeight: 400, lineHeight: 1.6 }}>{t.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section style={{ ...lebar, padding: `40px ${gutter} 80px` }}>
          <div
            className="k"
            style={{
              padding: "clamp(28px, 5vw, 56px)",
              background: "#EFE4CC",
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "24px",
              overflow: "hidden",
            }}
          >
            <span
              style={{ position: "absolute", inset: "14px", border: "1px solid rgba(168,133,63,.55)", borderRadius: "4px", pointerEvents: "none" }}
              aria-hidden="true"
            />
            <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: "12px", maxWidth: "620px" }}>
              <JudulBagian ukuran="57px">Mulai undangan Anda hari ini</JudulBagian>
              <p style={{ margin: 0, fontSize: "17px", fontWeight: 400 }}>
                Daftar dengan akun Google atau email, langsung bisa membuat undangan.
              </p>
            </div>
            <Link href="/daftar" className="t t-besar t-tinta" style={{ position: "relative" }}>
              Daftar gratis
              <Panah />
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
