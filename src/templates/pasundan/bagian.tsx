import { Fragment, type CSSProperties } from "react";
import Image from "next/image";
import type { PropsBagian, Vals } from "@/templates/bersama/jenis";

export const GAYA_AKAR: CSSProperties = { minHeight: "100vh", background: "#E9E2CC", fontFamily: "'Mulish', system-ui, sans-serif", color: "#1F3A2E" };

export const KERTAS: { className?: string; style: CSSProperties } = { className: "kertas", style: { maxWidth: "430px", margin: "0 auto", position: "relative", overflow: "hidden" } };

export function Sampul({ v, berikut }: PropsBagian) {
  return (
    <section id="sampul" className="sampul-undangan" style={{ boxSizing: "border-box", position: "relative", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", overflow: "hidden", background: "radial-gradient(110% 70% at 50% 30%, #FFFDF7 0%, #F6F1E4 70%)" }}>
      <span className="kelopak" style={{ left: "12%", animationDuration: "13s", animationDelay: "-2s" }} aria-hidden="true" />
      <span className="kelopak" style={{ left: "34%", width: "7px", height: "7px", animationDuration: "15s", animationDelay: "-8s" }} aria-hidden="true" />
      <span className="kelopak" style={{ left: "66%", animationDuration: "12s", animationDelay: "-5s" }} aria-hidden="true" />
      <span className="kelopak" style={{ left: "88%", width: "7px", height: "7px", animationDuration: "16s", animationDelay: "-11s" }} aria-hidden="true" />
      <div style={{ position: "absolute", top: "0", left: "0", right: "0", height: "160px", transform: "translateY(calc(var(--gulir, 0) * -0.25px))" }} aria-hidden="true">
        <div style={{ position: "absolute", top: "-18px", left: "-40px", width: "220px", height: "132px" }}>
          <svg className="hanyut" style={{ width: "220px", height: "132px" }}>
            <use href="#p-awan" />
          </svg>
        </div>
        <div style={{ position: "absolute", top: "-18px", right: "-40px", width: "220px", height: "132px", transform: "scaleX(-1)" }}>
          <svg className="hanyut" style={{ width: "220px", height: "132px", animationDelay: "-7s" }}>
            <use href="#p-awan" />
          </svg>
        </div>
      </div>
      <div className="sampul-konten">
      <div className="masuk" style={{ position: "relative", width: "260px", height: "150px" }} aria-hidden="true">
        <svg className="goyang" style={{ position: "absolute", left: "82.4px", top: "36.3px", width: "20px", height: "46px", animationDelay: "-0s" }}>
          <use href="#p-kembang" />
        </svg>
        <svg className="goyang" style={{ position: "absolute", left: "97.4px", top: "18.1px", width: "20px", height: "46px", animationDelay: "-0.7s" }}>
          <use href="#p-kembang" />
        </svg>
        <svg className="goyang" style={{ position: "absolute", left: "120px", top: "-2.1px", width: "20px", height: "46px", animationDelay: "-1.4s" }}>
          <use href="#p-kembang" />
        </svg>
        <svg className="goyang" style={{ position: "absolute", left: "142.6px", top: "18.1px", width: "20px", height: "46px", animationDelay: "-2.1s" }}>
          <use href="#p-kembang" />
        </svg>
        <svg className="goyang" style={{ position: "absolute", left: "157.6px", top: "36.3px", width: "20px", height: "46px", animationDelay: "-2.8s" }}>
          <use href="#p-kembang" />
        </svg>
        <svg style={{ position: "relative", width: "260px", height: "150px", filter: "drop-shadow(0 8px 14px rgba(140,106,36,0.25))" }}>
          <use href="#p-siger" />
        </svg>
        <svg className="kelip" style={{ left: "122px", top: "110px", width: "16px", height: "16px", animationDelay: "-0s" }}>
          <use href="#p-kilau" />
        </svg>
        <svg className="kelip" style={{ left: "97.4px", top: "107.7px", width: "11px", height: "11px", animationDelay: "-0.9s" }}>
          <use href="#p-kilau" />
        </svg>
        <svg className="kelip" style={{ left: "151.6px", top: "107.7px", width: "11px", height: "11px", animationDelay: "-1.8s" }}>
          <use href="#p-kilau" />
        </svg>
        <svg className="ayun" style={{ position: "absolute", left: "15px", top: "136px", width: "14px", height: "150px", animationDelay: "-1s" }}>
          <use href="#p-ronce" />
        </svg>
        <svg className="ayun" style={{ position: "absolute", right: "15px", top: "136px", width: "14px", height: "150px", animationDelay: "-3s" }}>
          <use href="#p-ronce" />
        </svg>
      </div>
      <p className="mata masuk" style={{ animationDelay: ".3s", position: "relative", marginTop: "6px" }}>
        The wedding of
      </p>
      <div className="masuk" style={{ animationDelay: ".5s", position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <h1 style={{ margin: "0", fontFamily: "'Great Vibes', cursive", fontWeight: "400", fontSize: "64px", lineHeight: "1" }}>
          {v.pria}
        </h1>
        <span style={{ fontFamily: "'Great Vibes', cursive", fontSize: "36px", lineHeight: "1" }}>
          <span className="emas">
            &amp;
          </span>
        </span>
        <h1 style={{ margin: "0", fontFamily: "'Great Vibes', cursive", fontWeight: "400", fontSize: "64px", lineHeight: "1" }}>
          {v.wanita}
        </h1>
      </div>
      <svg className="masuk" style={{ animationDelay: ".6s", position: "relative", width: "180px", height: "18px" }} aria-hidden="true">
        <use href="#p-pemisah" />
      </svg>
      <p className="masuk" style={{ animationDelay: ".65s", position: "relative", margin: "0", fontFamily: "'Playfair Display', serif", fontSize: "17px", letterSpacing: "0.14em" }}>
        {v.tglTitik}
      </p>
      <div className="masuk" style={{ animationDelay: ".8s", position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: "2px", marginTop: "6px" }}>
        <p className="miring" style={{ margin: "0", fontSize: "15px", color: "#4E6B5C" }}>
          Kepada Bapak/Ibu/Saudara/i
        </p>
        <p style={{ margin: "0", fontFamily: "'Playfair Display', serif", fontSize: "22px", fontWeight: "600", lineHeight: "1.25" }}>
          {v.namaTamu}
        </p>
      </div>
      </div>
      <div className="sampul-aksi">
        <a href={`#${berikut}`} onClick={v.bukaUndangan} className="denyut" style={{ display: "inline-flex", alignItems: "center", gap: "10px", minHeight: "50px", padding: "0 28px", borderRadius: "999px", background: "#1F4D3A", color: "#FBF8F0", border: "1px solid #C8A24A", textDecoration: "none", fontSize: "12px", fontWeight: "700", letterSpacing: "0.22em", textTransform: "uppercase" }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="M3 7l9 6 9-6" />
          </svg>
          Buka undangan
        </a>
      </div>
      <svg viewBox="0 0 430 220" preserveAspectRatio="xMidYMax slice" style={{ position: "absolute", left: "0", bottom: "0", width: "100%", height: "200px" }} aria-hidden="true">
        <g style={{ transform: "translateY(calc(var(--gulir, 0) * 0.05px))" }}>
          <path d="M0 128 C50 110 92 84 140 70 C160 64 176 54 196 52 L236 52 C256 54 270 62 292 70 C340 86 384 104 430 116 V220 H0Z" fill="#B7D5BF" />
          <path d="M196 52 L236 52" stroke="#9CC4A8" strokeWidth="2" />
        </g>
        <path d="M0 152 C70 130 130 142 200 126 C270 110 340 134 430 124 V220 H0Z" fill="#86B596" />
        <path d="M0 172 C90 158 170 168 250 156 C320 146 380 154 430 148 V220 H0Z" fill="#5E9A72" />
        <path d="M0 184 C90 170 170 180 250 168 C320 158 380 166 430 160" fill="none" stroke="#A9D1B2" strokeWidth="1" opacity="0.7" />
        <path d="M0 196 C100 186 200 194 300 184 C360 178 400 182 430 180 V220 H0Z" fill="#3F7A5A" />
        <path d="M0 206 C100 196 200 204 300 194 C360 188 400 192 430 190" fill="none" stroke="#86B596" strokeWidth="1" opacity="0.7" />
        <path d="M0 212 C110 204 220 212 320 204 C370 200 410 202 430 202 V220 H0Z" fill="#2F6B4F" />
      </svg>
      <svg className="goyang-pelan" style={{ position: "absolute", left: "-18px", bottom: "-4px", width: "118px", height: "144px" }} aria-hidden="true">
        <use href="#p-rumpun" />
      </svg>
      <div style={{ position: "absolute", right: "-18px", bottom: "-4px", width: "118px", height: "144px", transform: "scaleX(-1)" }} aria-hidden="true">
        <svg className="goyang-pelan" style={{ width: "118px", height: "144px", animationDelay: "-3s" }}>
          <use href="#p-rumpun" />
        </svg>
      </div>
    </section>
  );
}

export function Pembuka({ v, berikut }: PropsBagian) {
  return (
    <section id="mulai" style={{ minHeight: "720px", boxSizing: "border-box", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "90px 28px 150px", textAlign: "center", background: "linear-gradient(180deg, #2F6B4F 0%, #24563F 50%, #1F4D3A 100%)", color: "#FBF8F0" }}>
      <div data-anim="zoom" style={{ position: "relative", width: "210px", height: "210px" }}>
        <svg className="putar" style={{ position: "absolute", inset: "0", width: "210px", height: "210px" }} aria-hidden="true">
          <use href="#p-cincin-hias" />
        </svg>
        <span style={{ position: "absolute", inset: "0", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", fontFamily: "'Great Vibes', cursive", fontSize: "60px", lineHeight: "1" }}>
          {v.inisialPria}
          <span style={{ fontSize: "34px", color: "#E6C47A" }}>
            &amp;
          </span>
          {v.inisialWanita}
        </span>
      </div>
      <p className="mata" data-anim="naik" style={{ "--d": ".2s", marginTop: "30px", color: "#E6C47A" } as CSSProperties}>
        Kami menikah
      </p>
      <p data-anim="naik" style={{ "--d": ".35s", margin: "10px 0 0", fontFamily: "'Playfair Display', serif", fontSize: "21px", letterSpacing: "0.06em" } as CSSProperties}>
        {v.tglPanjang}
      </p>
      <svg className="goyang-pelan" style={{ position: "absolute", left: "-14px", bottom: "-6px", width: "112px", height: "136px" }} aria-hidden="true">
        <use href="#p-rumpun" />
      </svg>
      <div style={{ position: "absolute", right: "-14px", bottom: "-6px", width: "112px", height: "136px", transform: "scaleX(-1)" }} aria-hidden="true">
        <svg className="goyang-pelan" style={{ width: "112px", height: "136px", animationDelay: "-2.5s" }}>
          <use href="#p-rumpun" />
        </svg>
      </div>
      <a href={`#${berikut}`} className="pantul" style={{ position: "absolute", bottom: "64px", left: "50%", marginLeft: "-22px", width: "44px", height: "44px", display: "flex", alignItems: "center", justifyContent: "center", color: "#E6C47A" }} aria-label="Gulir ke bawah">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </a>
    </section>
  );
}

export function Salam({ v, atas }: PropsBagian) {
  return (
    <section id="salam" style={{ minHeight: "600px", boxSizing: "border-box", padding: "96px 22px 70px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative" }}>
      <svg style={{ position: "absolute", top: "-1px", left: "0", width: "100%", height: "46px", color: atas, pointerEvents: "none" }} viewBox="0 0 430 60" preserveAspectRatio="none" aria-hidden="true">
        <use href="#p-mega" />
      </svg>
      <svg style={{ position: "absolute", top: "22px", left: "50%", marginLeft: "-10px", width: "20px", height: "20px", pointerEvents: "none" }} aria-hidden="true">
        <use href="#p-melati" />
      </svg>
      <div className="kartu" data-anim="naik" style={{ width: "100%", boxSizing: "border-box", padding: "54px 28px 38px", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", textAlign: "center" }}>
        <svg style={{ position: "absolute", top: "-26px", left: "50%", marginLeft: "-45px", width: "90px", height: "52px" }} aria-hidden="true">
          <use href="#p-siger" />
        </svg>
        <h2 className="judul" style={{ fontSize: "46px" }}>
          Wilujeng sumping
        </h2>
        {v.kutipanTampil ? (
          <p className="miring" style={{ whiteSpace: "pre-line", margin: "0", fontSize: "19px", lineHeight: "1.65", color: "#34513F" }}>
            {v.kutipanTampil}
          </p>
        ) : null}
        <svg style={{ width: "200px", height: "20px" }} aria-hidden="true">
          <use href="#p-pemisah" />
        </svg>
        {v.sambutan ? (
          <p style={{ whiteSpace: "pre-line", margin: "0", fontSize: "15px", lineHeight: "1.75", color: "#4E6B5C" }}>
            {v.sambutan}
          </p>
        ) : null}
      </div>
    </section>
  );
}

export function Mempelai({ v }: PropsBagian) {
  return (
    <section id="mempelai" style={{ minHeight: "1180px", boxSizing: "border-box", padding: "60px 24px 90px", display: "flex", flexDirection: "column", alignItems: "center", gap: "28px", textAlign: "center", position: "relative", overflow: "hidden" }}>
      <p className="mata" data-anim="naik">
        Mempelai
      </p>
      <h2 className="judul" data-anim="naik" style={{ "--d": ".1s", marginTop: "-18px" } as CSSProperties}>
        Kedua mempelai
      </h2>
      <div data-anim="kiri" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
        <div style={{ position: "relative", width: "224px", height: "296px" }}>
          <div className="foto" style={{ width: "224px", height: "296px", boxSizing: "border-box", borderRadius: "112px 112px 18px 18px", background: "linear-gradient(165deg, #DDEFE2, #9CC4A8)", border: "5px solid #FFFDF7", boxShadow: "0 0 0 1px #C8A24A, 0 16px 34px rgba(31,77,58,0.18)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "6px", color: "#2F6B4F" }}>
            {v.fotoPria ? (
              <Image src={v.fotoPria} alt={v.altPria} fill sizes="240px" style={{ objectFit: "cover" }} />
            ) : (
              <span aria-hidden="true" style={{ fontFamily: "'Great Vibes', cursive", fontSize: "88px", lineHeight: "1", opacity: "0.8" }}>
                {v.inisialPria}
              </span>
            )}
          </div>
          <svg className="goyang-pelan" style={{ position: "absolute", left: "-44px", bottom: "-12px", width: "104px", height: "126px" }} aria-hidden="true">
            <use href="#p-rumpun" />
          </svg>
        </div>
        <h3 style={{ margin: "16px 0 0", fontFamily: "'Great Vibes', cursive", fontWeight: "400", fontSize: "44px", lineHeight: "1.1" }}>
          {v.priaLengkap}
        </h3>
        <p style={{ whiteSpace: "pre-line", margin: "0", fontSize: "14px", lineHeight: "1.6", color: "#4E6B5C" }}>
          {v.priaOrtu}
        </p>
      </div>
      <div data-anim="zoom" aria-hidden="true">
        <svg style={{ width: "64px", height: "37px" }}>
          <use href="#p-siger" />
        </svg>
      </div>
      <div data-anim="kanan" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
        <div style={{ position: "relative", width: "224px", height: "296px" }}>
          <div className="foto" style={{ width: "224px", height: "296px", boxSizing: "border-box", borderRadius: "112px 112px 18px 18px", background: "linear-gradient(165deg, #F6EBD2, #E2C98E)", border: "5px solid #FFFDF7", boxShadow: "0 0 0 1px #C8A24A, 0 16px 34px rgba(31,77,58,0.18)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "6px", color: "#8C6A24" }}>
            {v.fotoWanita ? (
              <Image src={v.fotoWanita} alt={v.altWanita} fill sizes="240px" style={{ objectFit: "cover" }} />
            ) : (
              <span aria-hidden="true" style={{ fontFamily: "'Great Vibes', cursive", fontSize: "88px", lineHeight: "1", opacity: "0.8" }}>
                {v.inisialWanita}
              </span>
            )}
          </div>
          <div style={{ position: "absolute", right: "-44px", bottom: "-12px", width: "104px", height: "126px", transform: "scaleX(-1)" }} aria-hidden="true">
            <svg className="goyang-pelan" style={{ width: "104px", height: "126px", animationDelay: "-2s" }}>
              <use href="#p-rumpun" />
            </svg>
          </div>
        </div>
        <h3 style={{ margin: "16px 0 0", fontFamily: "'Great Vibes', cursive", fontWeight: "400", fontSize: "44px", lineHeight: "1.1" }}>
          {v.wanitaLengkap}
        </h3>
        <p style={{ whiteSpace: "pre-line", margin: "0", fontSize: "14px", lineHeight: "1.6", color: "#4E6B5C" }}>
          {v.wanitaOrtu}
        </p>
      </div>
    </section>
  );
}

export function Hitung({ v }: PropsBagian) {
  return (
    <section id="hitung" style={{ minHeight: "620px", boxSizing: "border-box", padding: "160px 22px 90px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "20px", textAlign: "center", background: "#2F6B4F", color: "#FBF8F0", position: "relative", overflow: "hidden" }}>
      <div className="ayun" style={{ position: "absolute", top: "12px", left: "10px", width: "34px", animationDelay: "-1s" }} aria-hidden="true">
        <span style={{ display: "block", margin: "0 auto", width: "1px", height: "16px", background: "#6B4F2A" }} />
        <svg style={{ display: "block", width: "34px", height: "68px" }}>
          <use href="#p-angklung" />
        </svg>
      </div>
      <div className="ayun" style={{ position: "absolute", top: "12px", left: "52px", width: "30px", animationDelay: "-2.6s" }} aria-hidden="true">
        <span style={{ display: "block", margin: "0 auto", width: "1px", height: "44px", background: "#6B4F2A" }} />
        <svg style={{ display: "block", width: "30px", height: "60px" }}>
          <use href="#p-angklung" />
        </svg>
      </div>
      <div className="ayun" style={{ position: "absolute", top: "12px", right: "52px", width: "30px", animationDelay: "-.4s" }} aria-hidden="true">
        <span style={{ display: "block", margin: "0 auto", width: "1px", height: "40px", background: "#6B4F2A" }} />
        <svg style={{ display: "block", width: "30px", height: "60px" }}>
          <use href="#p-angklung" />
        </svg>
      </div>
      <div className="ayun" style={{ position: "absolute", top: "12px", right: "10px", width: "34px", animationDelay: "-3.4s" }} aria-hidden="true">
        <span style={{ display: "block", margin: "0 auto", width: "1px", height: "20px", background: "#6B4F2A" }} />
        <svg style={{ display: "block", width: "34px", height: "68px" }}>
          <use href="#p-angklung" />
        </svg>
      </div>
      <div style={{ position: "absolute", top: "0", left: "-10px", right: "-10px", height: "14px", background: "linear-gradient(180deg, #F0D58F, #C9973F 60%, #9C7330)", boxShadow: "0 4px 10px rgba(0,0,0,0.25)" }} aria-hidden="true">
        <span style={{ position: "absolute", inset: "0", background: "repeating-linear-gradient(90deg, transparent 0 92px, rgba(108,79,42,0.55) 92px 94px, transparent 94px 96px)" }} />
      </div>
      <svg className="goyang-daun" style={{ position: "absolute", top: "4px", left: "92px", width: "60px", height: "40px" }} aria-hidden="true">
        <use href="#p-daun-bambu" />
      </svg>
      <div style={{ position: "absolute", top: "4px", right: "92px", width: "60px", height: "40px", transform: "scaleX(-1)" }} aria-hidden="true">
        <svg className="goyang-daun" style={{ width: "60px", height: "40px", animationDelay: "-2s" }}>
          <use href="#p-daun-bambu" />
        </svg>
      </div>
      <p className="mata" data-anim="naik" style={{ color: "#E6C47A" }}>
        Menuju hari bahagia
      </p>
      <h2 className="judul" data-anim="naik" style={{ "--d": ".1s", color: "#FBF8F0", fontSize: "46px" } as CSSProperties}>
        Hitung mundur
      </h2>
      <div data-anim="zoom" style={{ "--d": ".2s", display: "grid", gridTemplateColumns: v.kolomHitung, gap: "10px", width: "100%", maxWidth: "330px" } as CSSProperties}>
        <div style={{ padding: "16px 0 12px", borderRadius: "16px", background: "#FFFDF7", color: "#1F3A2E" }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "30px", fontWeight: "600", lineHeight: "1" }}>
            {v.hari}
          </div>
          <div style={{ fontSize: "10px", fontWeight: "700", letterSpacing: "0.18em", marginTop: "6px", color: "#2F6B4F" }}>
            HARI
          </div>
        </div>
        <div style={{ padding: "16px 0 12px", borderRadius: "16px", background: "#FFFDF7", color: "#1F3A2E" }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "30px", fontWeight: "600", lineHeight: "1" }}>
            {v.jam}
          </div>
          <div style={{ fontSize: "10px", fontWeight: "700", letterSpacing: "0.18em", marginTop: "6px", color: "#2F6B4F" }}>
            JAM
          </div>
        </div>
        <div style={{ padding: "16px 0 12px", borderRadius: "16px", background: "#FFFDF7", color: "#1F3A2E" }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "30px", fontWeight: "600", lineHeight: "1" }}>
            {v.menit}
          </div>
          <div style={{ fontSize: "10px", fontWeight: "700", letterSpacing: "0.18em", marginTop: "6px", color: "#2F6B4F" }}>
            MENIT
          </div>
        </div>
        {v.tampilDetik ? (
          <div style={{ padding: "16px 0 12px", borderRadius: "16px", background: "linear-gradient(180deg, #F6E3A8, #C8A24A)", color: "#1F3A2E" }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "30px", fontWeight: "600", lineHeight: "1" }}>
              {v.detik}
            </div>
            <div style={{ fontSize: "10px", fontWeight: "700", letterSpacing: "0.18em", marginTop: "6px", color: "#1F4D3A" }}>
              DETIK
            </div>
          </div>
        ) : null}
      </div>
      <p data-anim="naik" style={{ "--d": ".3s", margin: "0", fontFamily: "'Playfair Display', serif", fontSize: "18px", letterSpacing: "0.08em" } as CSSProperties}>
        {v.tglPanjang}
      </p>
      {v.kalender ? (
        <a href={v.kalender} download data-anim="naik" style={{ textDecoration: "none", "--d": ".4s", display: "inline-flex", alignItems: "center", gap: "8px", minHeight: "46px", padding: "0 22px", borderRadius: "999px", border: "1px solid #E6C47A", background: "transparent", color: "#FBF8F0", font: "700 12px 'Mulish', sans-serif", letterSpacing: "0.16em", cursor: "pointer" } as CSSProperties}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path d="M16 3v4M8 3v4M3 10h18M12 14v4M10 16h4" />
          </svg>
          SIMPAN KE KALENDER
        </a>
      ) : null}
    </section>
  );
}

export function Acara({ v, atas, bawah }: PropsBagian) {
  return (
    <section id="acara" style={{ minHeight: "1000px", boxSizing: "border-box", padding: "90px 22px 100px", display: "flex", flexDirection: "column", alignItems: "center", gap: "26px", textAlign: "center", position: "relative" }}>
      <svg style={{ position: "absolute", top: "-1px", left: "0", width: "100%", height: "46px", color: atas, pointerEvents: "none" }} viewBox="0 0 430 60" preserveAspectRatio="none" aria-hidden="true">
        <use href="#p-mega" />
      </svg>
      <svg style={{ position: "absolute", top: "22px", left: "50%", marginLeft: "-10px", width: "20px", height: "20px", pointerEvents: "none" }} aria-hidden="true">
        <use href="#p-melati" />
      </svg>
      <p className="mata" data-anim="naik">
        Waktu &amp; tempat
      </p>
      <h2 className="judul" data-anim="naik" style={{ "--d": ".1s", marginTop: "-18px" } as CSSProperties}>
        Rangkaian acara
      </h2>
      <div data-anim="naik" style={{ "--d": ".2s", width: "100%", display: "flex", flexDirection: "column", gap: "34px" } as CSSProperties}>
        {v.acara.map((a) => (
          <Fragment key={a.id}>
            <article className="kartu" style={{ padding: "44px 26px 30px", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
              <svg style={{ position: "absolute", top: "-22px", left: "50%", marginLeft: "-38px", width: "76px", height: "44px" }} aria-hidden="true">
                <use href="#p-siger" />
              </svg>
              <h3 style={{ margin: "0", fontFamily: "'Great Vibes', cursive", fontWeight: "400", fontSize: "42px", lineHeight: "1.1" }}>
                {a.nama}
              </h3>
              <p className="mata" style={{ letterSpacing: "0.16em" }}>
                {a.tgl}
              </p>
              <p style={{ margin: "0", fontFamily: "'Playfair Display', serif", fontSize: "19px", fontWeight: "600" }}>
                {a.jam}
              </p>
              <svg style={{ width: "140px", height: "14px", margin: "6px 0" }} aria-hidden="true">
                <use href="#p-pemisah" />
              </svg>
              <p style={{ margin: "0", fontFamily: "'Playfair Display', serif", fontSize: "19px", fontWeight: "600" }}>
                {a.tempat}
              </p>
              <p style={{ margin: "0", fontSize: "14px", lineHeight: "1.55", color: "#4E6B5C" }}>
                {a.alamat}
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "10px", marginTop: "10px" }}>
                {a.peta ? (
                  <a href={a.peta ?? undefined} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "8px", minHeight: "44px", padding: "0 18px", borderRadius: "999px", background: "#2F6B4F", color: "#FBF8F0", textDecoration: "none", fontSize: "12px", fontWeight: "700", letterSpacing: "0.14em" }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M12 21s-7-6.2-7-11a7 7 0 0114 0c0 4.8-7 11-7 11z" />
                      <circle cx="12" cy="10" r="2.5" />
                    </svg>
                    BUKA PETA
                  </a>
                ) : null}
                {a.kalender ? (
                  <a href={a.kalender ?? undefined} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "8px", minHeight: "44px", padding: "0 18px", borderRadius: "999px", border: "1px solid #C8A24A", background: "transparent", color: "#1F3A2E", font: "700 12px 'Mulish', sans-serif", letterSpacing: "0.14em", cursor: "pointer" }}>
                    + KALENDER
                  </a>
                ) : null}
              </div>
            </article>
          </Fragment>
        ))}
      </div>
      <svg style={{ position: "absolute", bottom: "-1px", transform: "scaleY(-1)", left: "0", width: "100%", height: "46px", color: bawah, pointerEvents: "none" }} viewBox="0 0 430 60" preserveAspectRatio="none" aria-hidden="true">
        <use href="#p-mega" />
      </svg>
      <svg style={{ position: "absolute", bottom: "22px", left: "50%", marginLeft: "-10px", width: "20px", height: "20px", pointerEvents: "none" }} aria-hidden="true">
        <use href="#p-melati" />
      </svg>
    </section>
  );
}

export function Cerita({ v }: PropsBagian) {
  return (
    <section id="cerita" style={{ minHeight: "820px", boxSizing: "border-box", padding: "70px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: "26px", textAlign: "center", background: "#E6EFE3" }}>
      <p className="mata" data-anim="naik">
        Cerita kami
      </p>
      <h2 className="judul" data-anim="naik" style={{ "--d": ".1s", marginTop: "-18px" } as CSSProperties}>
        Perjalanan cinta
      </h2>
      <div style={{ position: "relative", width: "100%", display: "flex", flexDirection: "column", gap: "22px", textAlign: "left" }}>
        {v.cerita.map((c) => (
          <div key={c.kunci} data-anim="naik" style={{ "--d": c.tunda, position: "relative", paddingLeft: "46px" } as CSSProperties}>
            {c.akhir ? null : (
              <span data-anim="garis" style={{ "--d": c.tundaGaris, position: "absolute", left: "15px", top: "34px", bottom: "-56px", width: "2px", background: "#C8A24A" } as CSSProperties} aria-hidden="true" />
            )}
            <span style={{ position: "absolute", left: "4px", top: "22px", width: "24px", height: "24px", boxSizing: "border-box", borderRadius: "50%", background: "#E6EFE3", border: "2px solid #C8A24A", display: "flex", alignItems: "center", justifyContent: "center" }} aria-hidden="true">
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#2F6B4F" }} />
            </span>
            <div className="kartu" style={{ padding: "22px 20px", display: "flex", flexDirection: "column", gap: "6px" }}>
              <p className="mata" style={{ color: "#8C6A24" }}>
                {c.tahun}
              </p>
              <h3 style={{ margin: "0", fontFamily: "'Playfair Display', serif", fontSize: "20px", fontWeight: "600" }}>
                {c.judul}
              </h3>
              <p style={{ whiteSpace: "pre-line", margin: "0", fontSize: "14px", lineHeight: "1.7", color: "#4E6B5C" }}>
                {c.teks}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function Galeri({ v, atas, bawah }: PropsBagian) {
  return (
    <section id="galeri" style={{ minHeight: "820px", boxSizing: "border-box", padding: "90px 18px 100px", display: "flex", flexDirection: "column", alignItems: "center", gap: "24px", textAlign: "center", position: "relative" }}>
      <svg style={{ position: "absolute", top: "-1px", left: "0", width: "100%", height: "46px", color: atas, pointerEvents: "none" }} viewBox="0 0 430 60" preserveAspectRatio="none" aria-hidden="true">
        <use href="#p-mega" />
      </svg>
      <svg style={{ position: "absolute", top: "22px", left: "50%", marginLeft: "-10px", width: "20px", height: "20px", pointerEvents: "none" }} aria-hidden="true">
        <use href="#p-melati" />
      </svg>
      <p className="mata" data-anim="naik">
        Galeri
      </p>
      <h2 className="judul" data-anim="naik" style={{ "--d": ".1s", marginTop: "-18px" } as CSSProperties}>
        Momen kami
      </h2>
      <div data-anim="zoom" style={{ "--d": ".15s", display: "flex", alignItems: "flex-start", gap: "10px", width: "100%" } as CSSProperties}>
        {v.lajurGaleri.map((lajur, n) => (
          <div key={n} style={{ flex: "1 1 0", minWidth: "0", display: "flex", flexDirection: "column", gap: "10px" }}>
            {lajur.map((g) => (
              <button key={g.id} type="button" className="foto" onClick={g.buka} aria-label={`Lihat ${g.label}`} style={{ display: "block", width: "100%", aspectRatio: g.rasio, border: "0", padding: "0", borderRadius: "12px", background: g.warna, cursor: "zoom-in" }}>
                {g.src ? <Image src={g.src} alt="" fill sizes={g.sizes} style={{ objectFit: "contain" }} /> : null}
              </button>
            ))}
          </div>
        ))}
      </div>
      <p style={{ margin: "0", fontSize: "12px", color: "#5E7568" }}>
        Ketuk foto untuk memperbesar
      </p>
      <svg style={{ position: "absolute", bottom: "-1px", transform: "scaleY(-1)", left: "0", width: "100%", height: "46px", color: bawah, pointerEvents: "none" }} viewBox="0 0 430 60" preserveAspectRatio="none" aria-hidden="true">
        <use href="#p-mega" />
      </svg>
      <svg style={{ position: "absolute", bottom: "22px", left: "50%", marginLeft: "-10px", width: "20px", height: "20px", pointerEvents: "none" }} aria-hidden="true">
        <use href="#p-melati" />
      </svg>
    </section>
  );
}

export function Rsvp({ v }: PropsBagian) {
  return (
    <section id="rsvp" style={{ minHeight: "1140px", boxSizing: "border-box", padding: "70px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: "20px", textAlign: "center", background: "#1F4D3A", color: "#FBF8F0", position: "relative" }}>
      <p className="mata" data-anim="naik" style={{ color: "#E6C47A" }}>
        Konfirmasi kehadiran
      </p>
      <h2 className="judul" data-anim="naik" style={{ "--d": ".1s", marginTop: "-16px", color: "#FBF8F0" } as CSSProperties}>
        RSVP
      </h2>
      <p data-anim="naik" style={{ "--d": ".15s", margin: "0", fontSize: "14px", lineHeight: "1.6", color: "#D5E6DA" } as CSSProperties}>
        {v.teksBatas}
      </p>
      <div className="kartu" data-anim="naik" style={{ "--d": ".2s", width: "100%", boxSizing: "border-box", padding: "30px 20px", textAlign: "left" } as CSSProperties}>
        {v.showForm ? (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              <div style={{ textAlign: "center" }}>
                <p className="mata" style={{ letterSpacing: "0.2em" }}>
                  Undangan untuk
                </p>
                <p style={{ margin: "6px 0 0", fontFamily: "'Playfair Display', serif", fontSize: "21px", fontWeight: "600" }}>
                  {v.namaTamu}
                </p>
                <p style={{ margin: "6px 0 0", fontSize: "12px", lineHeight: "1.5", color: "#4E6B5C" }}>
                  {v.keteranganMaks}
                </p>
              </div>
              {v.rsvpAcara.map((r) => (
                <Fragment key={r.id}>
                  <fieldset style={{ margin: "0", padding: "16px", border: "1px solid #E3D8BC", borderRadius: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
                    <legend style={{ padding: "0 8px", fontFamily: "'Playfair Display', serif", fontSize: "18px", fontWeight: "600" }}>
                      {r.nama}
                    </legend>
                    <p style={{ margin: "-6px 0 0", fontSize: "12px", color: "#5E7568" }}>
                      {r.tgl} · {r.jam}
                    </p>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "8px" }}>
                      <button type="button" onClick={r.pilihYa} aria-pressed={r.ya} style={{ minHeight: "46px", borderRadius: "999px", border: `1.5px solid ${r.yaBd}`, background: r.yaBg, color: r.yaFg, font: "600 13px 'Mulish', sans-serif", cursor: "pointer" }}>
                        Ya, akan hadir
                      </button>
                      <button type="button" onClick={r.pilihTidak} aria-pressed={r.tidak} style={{ minHeight: "46px", borderRadius: "999px", border: `1.5px solid ${r.tdBd}`, background: r.tdBg, color: r.tdFg, font: "600 13px 'Mulish', sans-serif", cursor: "pointer" }}>
                        Tidak hadir
                      </button>
                    </div>
                    {r.tampilJumlah ? (
                      <>
                        <div className="masuk" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px", padding: "6px 6px 6px 16px", borderRadius: "999px", background: "#F2EEE2" }}>
                            <span style={{ display: "flex", flexDirection: "column", gap: "2px", textAlign: "left" }}>
                              <span style={{ fontSize: "14px", fontWeight: "600" }}>
                                Dewasa
                              </span>
                              <span style={{ fontSize: "11px", opacity: "0.7" }}>
                                Maks. {r.maksD}
                              </span>
                            </span>
                            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                              <button type="button" onClick={r.kurangD} aria-label={`Kurangi dewasa ${r.nama}`} style={{ width: "34px", height: "34px", borderRadius: "50%", border: "1px solid #C9BE9F", background: "#FFFFFF", color: "#1F3A2E", cursor: "pointer", opacity: r.dMinOp }}>
                                −
                              </button>
                              <span style={{ minWidth: "20px", textAlign: "center", fontWeight: "700" }}>
                                {r.dewasa}
                              </span>
                              <button type="button" onClick={r.tambahD} aria-label={`Tambah dewasa ${r.nama}`} style={{ width: "34px", height: "34px", borderRadius: "50%", border: "1px solid #C9BE9F", background: "#FFFFFF", color: "#1F3A2E", cursor: "pointer", opacity: r.dMaxOp }}>
                                +
                              </button>
                            </span>
                          </div>
                          {r.showAnak ? (
                            <>
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px", padding: "6px 6px 6px 16px", borderRadius: "999px", background: "#F2EEE2" }}>
                                <span style={{ display: "flex", flexDirection: "column", gap: "2px", textAlign: "left" }}>
                                  <span style={{ fontSize: "14px", fontWeight: "600" }}>
                                    Anak
                                  </span>
                                  <span style={{ fontSize: "11px", opacity: "0.7" }}>
                                    Maks. {r.maksA}
                                  </span>
                                </span>
                                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                  <button type="button" onClick={r.kurangA} aria-label={`Kurangi anak ${r.nama}`} style={{ width: "34px", height: "34px", borderRadius: "50%", border: "1px solid #C9BE9F", background: "#FFFFFF", color: "#1F3A2E", cursor: "pointer", opacity: r.aMinOp }}>
                                    −
                                  </button>
                                  <span style={{ minWidth: "20px", textAlign: "center", fontWeight: "700" }}>
                                    {r.anak}
                                  </span>
                                  <button type="button" onClick={r.tambahA} aria-label={`Tambah anak ${r.nama}`} style={{ width: "34px", height: "34px", borderRadius: "50%", border: "1px solid #C9BE9F", background: "#FFFFFF", color: "#1F3A2E", cursor: "pointer", opacity: r.aMaxOp }}>
                                    +
                                  </button>
                                </span>
                              </div>
                            </>
                          ) : null}
                        </div>
                      </>
                    ) : null}
                  </fieldset>
                </Fragment>
              ))}
              <button type="button" onClick={v.kirimRsvp} disabled={v.kirimNonaktif} style={{ minHeight: "52px", borderRadius: "999px", border: "0", background: "#1F4D3A", color: "#FBF8F0", font: "700 13px 'Mulish', sans-serif", letterSpacing: "0.2em", cursor: "pointer", opacity: v.kirimOpacity }}>
                KIRIM KONFIRMASI
              </button>
            </div>
          </>
        ) : null}
        {v.showTerima ? (
          <>
            <div className="masuk" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", textAlign: "center", padding: "10px 0" }}>
              <svg width="84" height="48" aria-hidden="true">
                <use href="#p-siger" />
              </svg>
              <h3 style={{ margin: "0", fontFamily: "'Great Vibes', cursive", fontWeight: "400", fontSize: "42px" }}>
                Hatur nuhun
              </h3>
              <p style={{ margin: "0", fontSize: "15px", lineHeight: "1.6" }}>
                {v.ringkasan}
              </p>
              <p style={{ margin: "0", fontSize: "13px", color: "#4E6B5C" }}>
                {v.teksUbah}
              </p>
              {v.bisaUbah ? (
                <button type="button" onClick={v.ubahRsvp} style={{ minHeight: "44px", padding: "0 20px", borderRadius: "999px", border: "1px solid #C8A24A", background: "transparent", color: "#1F3A2E", font: "600 13px 'Mulish', sans-serif", cursor: "pointer" }}>
                  Ubah jawaban
                </button>
              ) : null}
              {v.qrTampil ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", marginTop: "6px" }}>
                  <Image src={v.qrTampil} alt="Kode QR check-in" width={168} height={168} unoptimized style={{ borderRadius: "12px", background: "#FFFFFF", padding: "8px", boxSizing: "content-box" }} />
                  <p style={{ margin: "0", fontSize: "13px", color: "#4E6B5C", textAlign: "center" }}>
                    Tunjukkan kode ini kepada penerima tamu di lokasi acara.
                  </p>
                </div>
              ) : null}
            </div>
          </>
        ) : null}
        {v.showTutup ? (
          <p style={{ margin: "0", fontSize: "13px", color: "#4E6B5C", textAlign: "center", padding: "10px 0" }}>
            Formulir konfirmasi sudah ditutup. Hubungi mempelai bila rencana Anda berubah.
          </p>
        ) : null}
        {v.pesanRsvp ? (
          <p role="status" style={{ margin: "0", fontSize: "13px", color: "#4E6B5C", textAlign: "center", marginTop: "14px" }}>
            {v.pesanRsvp}
          </p>
        ) : null}
      </div>
    </section>
  );
}

export function Ucapan({ v, atas, bawah }: PropsBagian) {
  return (
    <section id="ucapan" style={{ minHeight: "1120px", boxSizing: "border-box", padding: "90px 20px 100px", display: "flex", flexDirection: "column", alignItems: "center", gap: "20px", textAlign: "center", position: "relative" }}>
      <svg style={{ position: "absolute", top: "-1px", left: "0", width: "100%", height: "46px", color: atas, pointerEvents: "none" }} viewBox="0 0 430 60" preserveAspectRatio="none" aria-hidden="true">
        <use href="#p-mega" />
      </svg>
      <svg style={{ position: "absolute", top: "22px", left: "50%", marginLeft: "-10px", width: "20px", height: "20px", pointerEvents: "none" }} aria-hidden="true">
        <use href="#p-melati" />
      </svg>
      <p className="mata" data-anim="naik">
        Ucapan &amp; doa
      </p>
      <h2 className="judul" data-anim="naik" style={{ "--d": ".1s", marginTop: "-18px" } as CSSProperties}>
        Kirim ucapan
      </h2>
      <div className="kartu" data-anim="naik" style={{ "--d": ".2s", width: "100%", boxSizing: "border-box", padding: "26px 20px", display: "flex", flexDirection: "column", gap: "12px", textAlign: "left" } as CSSProperties}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ width: "38px", height: "38px", borderRadius: "50%", background: "#DDEFE2", color: "#1F4D3A", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Playfair Display', serif", fontWeight: "600" }} aria-hidden="true">
            {v.inisialTamu}
          </span>
          <span style={{ fontWeight: "700" }}>
            {v.namaTamu}
          </span>
        </div>
        <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", fontWeight: "700" }}>
          Ucapan dan doa
          <textarea rows={3} value={v.teksUcapan} onChange={v.ketikUcapan} maxLength={v.maksUcapan} placeholder={v.placeholderUcapan} style={{ font: "500 14px/1.5 'Mulish', sans-serif", padding: "12px", borderRadius: "14px", border: "1px solid #DDD3B8", background: "#FFFFFF", color: "#1F3A2E", resize: "vertical" }} />
        </label>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
          <span style={{ fontSize: "12px", color: "#5E7568" }}>
            {v.sisaKarakter} karakter tersisa
          </span>
          <button type="button" onClick={v.kirimUcapan} disabled={v.ucapanNonaktif} style={{ minHeight: "44px", padding: "0 20px", borderRadius: "999px", border: "0", background: "#2F6B4F", color: "#FBF8F0", font: "700 12px 'Mulish', sans-serif", letterSpacing: "0.14em", cursor: "pointer", opacity: v.ucapanOpacity }}>
            KIRIM UCAPAN
          </button>
        </div>
        {v.pesanUcapan ? (
          <p role="status" style={{ fontSize: "12px", color: "#5E7568", margin: "0" }}>
            {v.pesanUcapan}
          </p>
        ) : null}
      </div>
      <div data-anim="naik" style={{ "--d": ".25s", width: "100%", display: "flex", flexDirection: "column", gap: "12px" } as CSSProperties}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "17px", fontWeight: "600" }}>
            {v.jumlahUcapan} ucapan
          </span>
          <span style={{ fontSize: "12px", color: "#5E7568" }}>
            Halaman {v.halamanKe} dari {v.totalHalaman}
          </span>
        </div>
        <ul style={{ listStyle: "none", margin: "0", padding: "4px 6px 4px 0", maxHeight: "470px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px", textAlign: "left" }}>
          {v.adaUcapan ? null : (
            <li style={{ padding: "14px 16px", borderRadius: "18px", background: "#FFFDF7", border: "1px solid #EDE4CB", display: "flex", flexDirection: "column", gap: "6px" }}>
              <p style={{ margin: "0", fontSize: "14px", lineHeight: "1.6", color: "#34513F", textAlign: "center" }}>
                Belum ada ucapan. Jadilah yang pertama mendoakan {v.pasangan}.
              </p>
            </li>
          )}
          {v.ucapan.map((u) => (
            <Fragment key={u.id}>
              <li className="masuk" style={{ padding: "14px 16px", borderRadius: "18px", background: "#FFFDF7", border: "1px solid #EDE4CB", display: "flex", flexDirection: "column", gap: "6px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ width: "34px", height: "34px", borderRadius: "50%", background: u.avatar, color: "#1F3A2E", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Playfair Display', serif", fontWeight: "600", flexShrink: "0" }} aria-hidden="true">
                    {u.inisial}
                  </span>
                  <div style={{ flex: "1", minWidth: "0" }}>
                    <p style={{ margin: "0", fontWeight: "700", fontSize: "14px" }}>
                      {u.nama}
                    </p>
                    <p style={{ margin: "0", fontSize: "11px", color: "#5E7568" }}>
                      {u.waktu}
                    </p>
                  </div>
                  <span style={{ padding: "3px 9px", borderRadius: "999px", background: u.badgeBg, color: u.badgeFg, fontSize: "11px", fontWeight: "700", whiteSpace: "nowrap" }}>
                    {u.badge}
                  </span>
                </div>
                <p style={{ margin: "0", fontSize: "14px", lineHeight: "1.6", color: "#34513F" }}>
                  {u.teks}
                </p>
              </li>
            </Fragment>
          ))}
        </ul>
        <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
          <button type="button" onClick={v.halSebelum} disabled={v.sebelumNonaktif} style={{ minHeight: "40px", padding: "0 16px", borderRadius: "999px", border: "1px solid #C8A24A", background: "#FFFDF7", color: "#1F3A2E", font: "600 13px 'Mulish', sans-serif", cursor: "pointer", opacity: v.sebelumOp }}>
            Sebelumnya
          </button>
          <button type="button" onClick={v.halBerikut} disabled={v.berikutNonaktif} style={{ minHeight: "40px", padding: "0 16px", borderRadius: "999px", border: "1px solid #C8A24A", background: "#FFFDF7", color: "#1F3A2E", font: "600 13px 'Mulish', sans-serif", cursor: "pointer", opacity: v.berikutOp }}>
            Berikutnya
          </button>
        </div>
      </div>
      <svg style={{ position: "absolute", bottom: "-1px", transform: "scaleY(-1)", left: "0", width: "100%", height: "46px", color: bawah, pointerEvents: "none" }} viewBox="0 0 430 60" preserveAspectRatio="none" aria-hidden="true">
        <use href="#p-mega" />
      </svg>
      <svg style={{ position: "absolute", bottom: "22px", left: "50%", marginLeft: "-10px", width: "20px", height: "20px", pointerEvents: "none" }} aria-hidden="true">
        <use href="#p-melati" />
      </svg>
    </section>
  );
}

export function Amplop({ v }: PropsBagian) {
  return (
    <section id="amplop" style={{ minHeight: "640px", boxSizing: "border-box", padding: "70px 22px", display: "flex", flexDirection: "column", alignItems: "center", gap: "18px", textAlign: "center", background: "#E6EFE3" }}>
      <p className="mata" data-anim="naik">
        Tanda kasih
      </p>
      <h2 className="judul" data-anim="naik" style={{ "--d": ".1s", marginTop: "-18px" } as CSSProperties}>
        Amplop digital
      </h2>
      <p data-anim="naik" style={{ "--d": ".15s", margin: "0", fontSize: "14px", lineHeight: "1.7", color: "#4E6B5C" } as CSSProperties}>
        Doa restu Anda adalah hadiah terindah. Jika ingin memberi tanda kasih, dapat melalui:
      </p>
      {v.rekening.map((r) => (
        <div key={r.kunci} className="kartu" data-anim={r.arah} style={{ "--d": r.tunda, width: "100%", boxSizing: "border-box", padding: "26px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" } as CSSProperties}>
          <span className="mata">
            {r.bank}
          </span>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "22px", fontWeight: "600", letterSpacing: "0.06em" }}>
            {r.nomor}
          </span>
          {r.atasNama ? (
            <span style={{ fontSize: "13px", color: "#4E6B5C" }}>
              a.n. {r.atasNama}
            </span>
          ) : null}
          <button type="button" onClick={r.salin} style={{ marginTop: "10px", minHeight: "40px", padding: "0 18px", borderRadius: "999px", border: "1px solid #2F6B4F", background: "#FFFFFF", color: "#1F4D3A", font: "700 12px 'Mulish', sans-serif", letterSpacing: "0.12em", cursor: "pointer" }}>
            {r.label}
          </button>
        </div>
      ))}
      {v.qris ? (
        <div className="kartu" data-anim="naik" style={{ "--d": ".4s", width: "100%", boxSizing: "border-box", padding: "26px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" } as CSSProperties}>
          <span className="mata">
            QRIS
          </span>
          <Image src={v.qris} alt="Kode QRIS" width={240} height={240} sizes="240px" style={{ width: "220px", height: "auto", marginTop: "10px", borderRadius: "12px", background: "#FFFFFF", padding: "10px" }} />
        </div>
      ) : null}
    </section>
  );
}

export function Penutup({ v, atas }: PropsBagian) {
  return (
    <section id="penutup" style={{ minHeight: "820px", boxSizing: "border-box", padding: "100px 30px 250px", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", textAlign: "center", position: "relative", overflow: "hidden", background: "radial-gradient(110% 70% at 50% 40%, #FFFDF7 0%, #F6F1E4 70%)" }}>
      <span className="kelopak" style={{ left: "18%", animationDuration: "13s", animationDelay: "-3s" }} aria-hidden="true" />
      <span className="kelopak" style={{ left: "52%", width: "7px", height: "7px", animationDuration: "15s", animationDelay: "-9s" }} aria-hidden="true" />
      <span className="kelopak" style={{ left: "80%", animationDuration: "12s", animationDelay: "-6s" }} aria-hidden="true" />
      <svg style={{ position: "absolute", top: "-1px", left: "0", width: "100%", height: "46px", color: atas, pointerEvents: "none" }} viewBox="0 0 430 60" preserveAspectRatio="none" aria-hidden="true">
        <use href="#p-mega" />
      </svg>
      <svg style={{ position: "absolute", top: "22px", left: "50%", marginLeft: "-10px", width: "20px", height: "20px", pointerEvents: "none" }} aria-hidden="true">
        <use href="#p-melati" />
      </svg>
      <div data-anim="zoom" style={{ position: "relative", width: "156px", height: "90px" }} aria-hidden="true">
        <svg style={{ width: "156px", height: "90px", filter: "drop-shadow(0 6px 10px rgba(140,106,36,0.25))" }}>
          <use href="#p-siger" />
        </svg>
      </div>
      <p className="miring" data-anim="naik" style={{ whiteSpace: "pre-line", "--d": ".1s", margin: "6px 0 0", fontSize: "18px", lineHeight: "1.65", color: "#34513F" } as CSSProperties}>
        {v.penutup}
      </p>
      <h2 className="judul" data-anim="zoom" style={{ "--d": ".2s", fontSize: "60px" } as CSSProperties}>
        Hatur nuhun
      </h2>
      <p data-anim="naik" style={{ "--d": ".3s", margin: "0", fontFamily: "'Great Vibes', cursive", fontSize: "34px", color: "#2F6B4F" } as CSSProperties}>
        {v.pasangan}
      </p>
      <svg viewBox="0 0 430 220" preserveAspectRatio="xMidYMax slice" style={{ position: "absolute", left: "0", bottom: "0", width: "100%", height: "200px" }} aria-hidden="true">
        <path d="M0 128 C50 110 92 84 140 70 C160 64 176 54 196 52 L236 52 C256 54 270 62 292 70 C340 86 384 104 430 116 V220 H0Z" fill="#B7D5BF" />
        <path d="M0 152 C70 130 130 142 200 126 C270 110 340 134 430 124 V220 H0Z" fill="#86B596" />
        <path d="M0 172 C90 158 170 168 250 156 C320 146 380 154 430 148 V220 H0Z" fill="#5E9A72" />
        <path d="M0 184 C90 170 170 180 250 168 C320 158 380 166 430 160" fill="none" stroke="#A9D1B2" strokeWidth="1" opacity="0.7" />
        <path d="M0 196 C100 186 200 194 300 184 C360 178 400 182 430 180 V220 H0Z" fill="#3F7A5A" />
        <path d="M0 206 C100 196 200 204 300 194 C360 188 400 192 430 190" fill="none" stroke="#86B596" strokeWidth="1" opacity="0.7" />
        <path d="M0 212 C110 204 220 212 320 204 C370 200 410 202 430 202 V220 H0Z" fill="#2F6B4F" />
      </svg>
      <svg className="goyang-pelan" style={{ position: "absolute", left: "-18px", bottom: "-4px", width: "118px", height: "144px" }} aria-hidden="true">
        <use href="#p-rumpun" />
      </svg>
      <div style={{ position: "absolute", right: "-18px", bottom: "-4px", width: "118px", height: "144px", transform: "scaleX(-1)" }} aria-hidden="true">
        <svg className="goyang-pelan" style={{ width: "118px", height: "144px", animationDelay: "-3s" }}>
          <use href="#p-rumpun" />
        </svg>
      </div>
    </section>
  );
}

export function Progres() {
  return (
    <div style={{ position: "fixed", top: "0", left: "0", zIndex: "30", height: "3px", width: "calc(var(--progres, 0) * 100%)", background: "linear-gradient(90deg, #E6C47A, #2F6B4F)" }} aria-hidden="true" />
  );
}

export function Lightbox({ v }: { v: Vals }) {
  return v.fotoBuka ? (
      <>
        <div role="dialog" aria-modal="true" aria-label="Foto galeri" style={{ position: "fixed", inset: "0", zIndex: "40", background: "rgba(18,40,30,0.9)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px", padding: "20px" }}>
          <div className="masuk foto" style={{ width: "min(360px, 88vw)", height: "min(480px, 70vh)", borderRadius: "16px", border: "5px solid #FFFDF7", boxShadow: "0 0 0 1px #C8A24A", background: v.fotoWarna }}>
            {v.fotoSrc ? <Image key={v.fotoSrc} src={v.fotoSrc} alt={v.fotoLabel} fill sizes="(max-width: 430px) 88vw, 360px" style={{ objectFit: "contain" }} /> : null}
          </div>
          <p style={{ margin: "0", color: "#FBF8F0", fontSize: "13px", fontWeight: "600", letterSpacing: "0.1em" }}>
            {v.fotoLabel}
          </p>
          <div style={{ display: "flex", gap: "10px" }}>
            <button type="button" onClick={v.fotoSebelum} aria-label="Foto sebelumnya" style={{ width: "46px", height: "46px", borderRadius: "50%", border: "1px solid #E6C47A", background: "transparent", color: "#FBF8F0", fontSize: "20px", cursor: "pointer" }}>
              ‹
            </button>
            <button type="button" onClick={v.fotoTutup} data-tutup-foto style={{ minHeight: "46px", padding: "0 20px", borderRadius: "999px", border: "0", background: "#E6C47A", color: "#1F3A2E", font: "700 13px 'Mulish', sans-serif", cursor: "pointer" }}>
              Tutup
            </button>
            <button type="button" onClick={v.fotoBerikut} aria-label="Foto berikutnya" style={{ width: "46px", height: "46px", borderRadius: "50%", border: "1px solid #E6C47A", background: "transparent", color: "#FBF8F0", fontSize: "20px", cursor: "pointer" }}>
              ›
            </button>
          </div>
        </div>
      </>
  ) : null;
}

export function Musik({ v }: { v: Vals }) {
  if (!v.adaMusik) return null;
  return (
    <button type="button" onClick={v.toggleMusik} aria-label={v.musikLabel} style={{ position: "fixed", right: "16px", bottom: "20px", zIndex: "35", width: "50px", height: "50px", borderRadius: "50%", border: "2px solid #E6C47A", background: "#1F4D3A", color: "#FBF8F0", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 22px rgba(31,77,58,0.4)", cursor: "pointer", padding: "0" }}>
      {v.musikMain ? (
        <>
          <svg className="cakram" width="30" height="30" viewBox="0 0 30 30" aria-hidden="true">
            <circle cx="15" cy="15" r="14" fill="#14281F" />
            <circle cx="15" cy="15" r="10" fill="none" stroke="#3F7A5A" strokeWidth="0.8" />
            <circle cx="15" cy="15" r="6.5" fill="none" stroke="#3F7A5A" strokeWidth="0.8" />
            <circle cx="15" cy="15" r="3.5" fill="#E6C47A" />
            <circle cx="15" cy="15" r="1" fill="#14281F" />
          </svg>
        </>
      ) : null}
      {v.musikDiam ? (
        <>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M8 5v14l11-7z" />
          </svg>
        </>
      ) : null}
    </button>
  );
}

export const BAGIAN = {
  sampul: Sampul,
  pembuka: Pembuka,
  salam: Salam,
  mempelai: Mempelai,
  hitung: Hitung,
  acara: Acara,
  cerita: Cerita,
  galeri: Galeri,
  rsvp: Rsvp,
  ucapan: Ucapan,
  amplop: Amplop,
  penutup: Penutup,
};
