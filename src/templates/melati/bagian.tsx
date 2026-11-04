import { Fragment, type CSSProperties } from "react";
import Image from "next/image";
import type { PropsBagian, Vals } from "@/templates/bersama/jenis";

export const GAYA_AKAR: CSSProperties = { minHeight: "100vh", background: "#E7E1D3", fontFamily: "'Jost', system-ui, sans-serif", color: "#2E3B2A" };

export const KERTAS: { className?: string; style: CSSProperties } = { className: "kertas", style: { maxWidth: "430px", margin: "0 auto", position: "relative", overflow: "hidden" } };

export function Sampul({ v, berikut }: PropsBagian) {
  return (
    <section id="sampul" className="sampul-undangan" style={{ boxSizing: "border-box", position: "relative", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", overflow: "hidden", background: "radial-gradient(120% 70% at 50% 10%, #FBF8F0 0%, #F3EEE2 60%, #EFE9DC 100%)" }}>
      <div style={{ position: "absolute", top: "0", left: "0", right: "0", height: "300px", transform: "translateY(calc(var(--gulir, 0) * -0.3px))" }} aria-hidden="true">
        <div style={{ position: "absolute", top: "-6px", left: "0", right: "0", height: "26px", background: "linear-gradient(180deg, #6E8B6A, #86A27E)", borderRadius: "0 0 50% 50% / 0 0 100% 100%" }} />
        <svg className="ayun" style={{ position: "absolute", top: "10px", left: "14px", width: "22px", height: "230px", animationDelay: "-1s" }}>
          <use href="#m-untai" />
        </svg>
        <svg className="ayun" style={{ position: "absolute", top: "10px", left: "50px", width: "18px", height: "170px", animationDelay: "-2.4s" }}>
          <use href="#m-untai" />
        </svg>
        <svg className="ayun" style={{ position: "absolute", top: "10px", left: "84px", width: "24px", height: "260px", animationDelay: "-.5s" }}>
          <use href="#m-untai" />
        </svg>
        <svg className="ayun" style={{ position: "absolute", top: "10px", left: "124px", width: "16px", height: "140px", animationDelay: "-3.2s" }}>
          <use href="#m-untai" />
        </svg>
        <svg className="ayun" style={{ position: "absolute", top: "10px", right: "124px", width: "16px", height: "150px", animationDelay: "-1.8s" }}>
          <use href="#m-untai" />
        </svg>
        <svg className="ayun" style={{ position: "absolute", top: "10px", right: "84px", width: "24px", height: "250px", animationDelay: "-2.9s" }}>
          <use href="#m-untai" />
        </svg>
        <svg className="ayun" style={{ position: "absolute", top: "10px", right: "50px", width: "18px", height: "180px", animationDelay: "-.9s" }}>
          <use href="#m-untai" />
        </svg>
        <svg className="ayun" style={{ position: "absolute", top: "10px", right: "14px", width: "22px", height: "230px", animationDelay: "-4s" }}>
          <use href="#m-untai" />
        </svg>
      </div>
      <span className="kelopak" style={{ left: "10%", width: "11px", height: "15px", animationDuration: "12s", animationDelay: "-2s" }} />
      <span className="kelopak" style={{ left: "34%", width: "9px", height: "12px", animationDuration: "15s", animationDelay: "-7s" }} />
      <span className="kelopak" style={{ left: "62%", width: "12px", height: "16px", animationDuration: "13s", animationDelay: "-4s" }} />
      <span className="kelopak" style={{ left: "86%", width: "10px", height: "13px", animationDuration: "16s", animationDelay: "-10s" }} />
      <div className="kupu" style={{ bottom: "120px", left: "60px" }} aria-hidden="true">
        <svg className="sayap" width="22" height="18" viewBox="0 0 22 18">
          <path d="M11 9 C6 0 0 2 2 8 C0 13 6 17 11 9Z" fill="#E8CFC6" />
          <path d="M11 9 C16 0 22 2 20 8 C22 13 16 17 11 9Z" fill="#E8CFC6" />
          <path d="M11 4 V15" stroke="#7A5A50" strokeWidth="1.2" />
        </svg>
      </div>
      <div className="sampul-konten">
      <div className="masuk" style={{ position: "relative", width: "300px", boxSizing: "border-box", padding: "64px 24px 30px", borderRadius: "150px 150px 22px 22px", background: "rgba(255,253,248,0.82)", boxShadow: "0 20px 50px rgba(46,59,42,0.12)", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
        <span style={{ position: "absolute", inset: "8px", border: "1px solid rgba(184,154,94,0.6)", borderRadius: "142px 142px 16px 16px", pointerEvents: "none" }} />
        <span style={{ position: "absolute", inset: "13px", border: "1px solid rgba(184,154,94,0.3)", borderRadius: "137px 137px 12px 12px", pointerEvents: "none" }} />
        <p className="mata">
          The wedding of
        </p>
        <h1 style={{ margin: "6px 0 0", fontFamily: "'Pinyon Script', cursive", fontWeight: "400", fontSize: "62px", lineHeight: "1" }}>
          {v.pria}
        </h1>
        <span style={{ fontFamily: "'Pinyon Script', cursive", fontSize: "34px", lineHeight: "1" }}>
          <span className="emas">
            &amp;
          </span>
        </span>
        <h1 style={{ margin: "0", fontFamily: "'Pinyon Script', cursive", fontWeight: "400", fontSize: "62px", lineHeight: "1" }}>
          {v.wanita}
        </h1>
        <svg style={{ width: "180px", height: "18px", marginTop: "8px" }} aria-hidden="true">
          <use href="#m-pemisah" />
        </svg>
        <p style={{ margin: "2px 0 0", fontFamily: "'Cormorant Garamond', serif", fontSize: "19px", letterSpacing: "0.16em" }}>
          {v.tglTitik}
        </p>
      </div>
      <div className="masuk" style={{ animationDelay: ".5s", position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
        <p style={{ margin: "0", fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "16px", color: "#5A6455" }}>
          Kepada Bapak/Ibu/Saudara/i
        </p>
        <p style={{ margin: "0", fontFamily: "'Cormorant Garamond', serif", fontSize: "25px", fontWeight: "600", lineHeight: "1.2" }}>
          {v.namaTamu}
        </p>
      </div>
      </div>
      <div className="sampul-aksi">
        <a href={`#${berikut}`} onClick={v.bukaUndangan} className="denyut" style={{ display: "inline-flex", alignItems: "center", gap: "10px", minHeight: "50px", padding: "0 30px", borderRadius: "999px", background: "#3E5239", color: "#FBF8F1", textDecoration: "none", fontSize: "13px", fontWeight: "500", letterSpacing: "0.22em", textTransform: "uppercase" }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="M3 7l9 6 9-6" />
          </svg>
          Buka undangan
        </a>
      </div>
      <svg className="ayun-pelan" style={{ position: "absolute", left: "-26px", bottom: "-18px", width: "200px", height: "155px", transformOrigin: "0 100%" }} aria-hidden="true">
        <use href="#m-buket" />
      </svg>
      <div style={{ position: "absolute", right: "-26px", bottom: "-18px", width: "200px", height: "155px", transform: "scaleX(-1)" }} aria-hidden="true">
        <svg className="ayun-pelan" style={{ width: "200px", height: "155px", transformOrigin: "0 100%", animationDelay: "-3s" }}>
          <use href="#m-buket" />
        </svg>
      </div>
    </section>
  );
}

export function Pembuka({ v, berikut }: PropsBagian) {
  return (
    <section id="mulai" style={{ minHeight: "720px", boxSizing: "border-box", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", padding: "90px 28px 0", textAlign: "center", background: "linear-gradient(180deg, #EFE9DC 0%, #EEF1E7 55%, #DCE4D3 100%)" }}>
      <div data-anim="zoom" style={{ width: "190px", height: "190px" }} aria-hidden="true">
        <svg className="putar" style={{ width: "190px", height: "190px" }} viewBox="0 0 190 190">
          <use href="#m-karangan" />
        </svg>
      </div>
      <div data-anim="zoom" style={{ "--d": ".2s", position: "absolute", top: "152px", left: "0", right: "0", display: "flex", justifyContent: "center", alignItems: "center", gap: "6px", fontFamily: "'Pinyon Script', cursive", fontSize: "52px", lineHeight: "1" } as CSSProperties}>
        <span>
          {v.inisialPria}
        </span>
        <span style={{ fontSize: "30px", color: "#B89A5E" }}>
          &amp;
        </span>
        <span>
          {v.inisialWanita}
        </span>
      </div>
      <p className="mata" data-anim="naik" style={{ "--d": ".3s", marginTop: "26px" } as CSSProperties}>
        Kami menikah
      </p>
      <p data-anim="naik" style={{ "--d": ".45s", margin: "8px 0 0", fontFamily: "'Cormorant Garamond', serif", fontSize: "22px", letterSpacing: "0.08em" } as CSSProperties}>
        {v.tglPanjang}
      </p>
      <div style={{ position: "absolute", left: "0", right: "0", bottom: "0", height: "280px" }} aria-hidden="true">
        <svg viewBox="0 0 430 280" preserveAspectRatio="xMidYMax slice" style={{ position: "absolute", inset: "0", width: "100%", height: "100%" }}>
          <g style={{ transform: "translateY(calc((var(--gulir, 844) - 844) * 0.1px))" }}>
            <path d="M0 150 C70 110 120 120 180 96 C240 72 300 100 350 88 C390 80 420 96 430 100 V280 H0Z" fill="url(#m-bukit1)" />
          </g>
          <g style={{ transform: "translateY(calc((var(--gulir, 844) - 844) * 0.06px))" }}>
            <path d="M0 190 C60 160 110 176 170 150 C230 124 290 160 350 140 C390 128 420 140 430 146 V280 H0Z" fill="url(#m-bukit2)" />
            <path d="M300 150 l6 -26 l6 26 Z M318 146 l5 -20 l5 20 Z M90 170 l6 -24 l6 24 Z" fill="#7D9473" />
          </g>
          <g>
            <path d="M0 230 C80 200 140 222 210 204 C280 186 340 214 430 200 V280 H0Z" fill="url(#m-bukit3)" />
          </g>
        </svg>
      </div>
      <a href={`#${berikut}`} className="pantul" style={{ position: "absolute", bottom: "24px", left: "50%", marginLeft: "-22px", width: "44px", height: "44px", display: "flex", alignItems: "center", justifyContent: "center", color: "#FBF8F1" }} aria-label="Gulir ke bawah">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </a>
    </section>
  );
}

export function Salam({ v }: PropsBagian) {
  return (
    <section id="salam" style={{ minHeight: "560px", boxSizing: "border-box", padding: "70px 22px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#5E7A58" }}>
      <div className="kartu" data-anim="naik" style={{ width: "100%", boxSizing: "border-box", padding: "64px 30px 40px", display: "flex", flexDirection: "column", alignItems: "center", gap: "18px", textAlign: "center" }}>
        <svg className="mekar" style={{ position: "absolute", top: "-28px", left: "50%", marginLeft: "-28px", width: "56px", height: "56px" }} aria-hidden="true">
          <use href="#m-bunga" />
        </svg>
        {v.kutipanTampil ? (
          <p style={{ whiteSpace: "pre-line", margin: "0", fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "21px", lineHeight: "1.6", color: "#3B4636" }}>
            {v.kutipanTampil}
          </p>
        ) : null}
        <svg style={{ width: "200px", height: "20px" }} aria-hidden="true">
          <use href="#m-pemisah" />
        </svg>
        {v.sambutan ? (
          <p style={{ whiteSpace: "pre-line", margin: "0", fontSize: "15px", lineHeight: "1.75", color: "#4B5546" }}>
            {v.sambutan}
          </p>
        ) : null}
      </div>
    </section>
  );
}

export function Mempelai({ v, atas }: PropsBagian) {
  return (
    <section id="mempelai" style={{ minHeight: "1180px", boxSizing: "border-box", padding: "76px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: "30px", textAlign: "center", position: "relative", overflow: "hidden" }}>
      <svg style={{ position: "absolute", top: "-1px", left: "0", width: "100%", height: "46px", color: atas, pointerEvents: "none" }} viewBox="0 0 430 60" preserveAspectRatio="none" aria-hidden="true">
        <use href="#m-gelombang" />
      </svg>
      <svg style={{ position: "absolute", top: "22px", left: "50%", marginLeft: "-13px", width: "26px", height: "26px", pointerEvents: "none" }} aria-hidden="true">
        <use href="#m-bunga" />
      </svg>
      <p className="mata" data-anim="naik">
        Mempelai
      </p>
      <h2 className="judul" data-anim="naik" style={{ "--d": ".1s", marginTop: "-18px" } as CSSProperties}>
        Kedua mempelai
      </h2>
      <div data-anim="kiri" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
        <div style={{ position: "relative", width: "230px", height: "300px" }}>
          <div className="foto" style={{ width: "230px", height: "300px", borderRadius: "115px 115px 18px 18px", background: "linear-gradient(165deg, #E1E8D8, #B9C9AE)", border: "5px solid #FFFDF8", boxShadow: "0 16px 34px rgba(46,59,42,0.16)", boxSizing: "border-box", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "6px", color: "#4F6A4B" }}>
            {v.fotoPria ? (
              <Image src={v.fotoPria} alt={v.altPria} fill sizes="240px" style={{ objectFit: "cover" }} />
            ) : (
              <span aria-hidden="true" style={{ fontFamily: "'Pinyon Script', cursive", fontSize: "88px", lineHeight: "1", opacity: "0.8" }}>
                {v.inisialPria}
              </span>
            )}
          </div>
          <svg className="ayun-pelan" style={{ position: "absolute", left: "-54px", bottom: "-34px", width: "170px", height: "130px", transformOrigin: "0 100%" }} aria-hidden="true">
            <use href="#m-buket" />
          </svg>
        </div>
        <h3 style={{ margin: "18px 0 0", fontFamily: "'Pinyon Script', cursive", fontWeight: "400", fontSize: "44px", lineHeight: "1.1" }}>
          {v.priaLengkap}
        </h3>
        <p style={{ whiteSpace: "pre-line", margin: "0", fontSize: "14px", lineHeight: "1.6", color: "#5A6455" }}>
          {v.priaOrtu}
        </p>
      </div>
      <span data-anim="zoom" style={{ fontFamily: "'Pinyon Script', cursive", fontSize: "66px", lineHeight: "0.8" }}>
        <span className="emas">
          &amp;
        </span>
      </span>
      <div data-anim="kanan" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
        <div style={{ position: "relative", width: "230px", height: "300px" }}>
          <div className="foto" style={{ width: "230px", height: "300px", borderRadius: "115px 115px 18px 18px", background: "linear-gradient(165deg, #F3E4DD, #E1C5BB)", border: "5px solid #FFFDF8", boxShadow: "0 16px 34px rgba(46,59,42,0.16)", boxSizing: "border-box", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "6px", color: "#7A5A50" }}>
            {v.fotoWanita ? (
              <Image src={v.fotoWanita} alt={v.altWanita} fill sizes="240px" style={{ objectFit: "cover" }} />
            ) : (
              <span aria-hidden="true" style={{ fontFamily: "'Pinyon Script', cursive", fontSize: "88px", lineHeight: "1", opacity: "0.8" }}>
                {v.inisialWanita}
              </span>
            )}
          </div>
          <div style={{ position: "absolute", right: "-54px", bottom: "-34px", width: "170px", height: "130px", transform: "scaleX(-1)" }} aria-hidden="true">
            <svg className="ayun-pelan" style={{ width: "170px", height: "130px", transformOrigin: "0 100%", animationDelay: "-2s" }}>
              <use href="#m-buket" />
            </svg>
          </div>
        </div>
        <h3 style={{ margin: "18px 0 0", fontFamily: "'Pinyon Script', cursive", fontWeight: "400", fontSize: "44px", lineHeight: "1.1" }}>
          {v.wanitaLengkap}
        </h3>
        <p style={{ whiteSpace: "pre-line", margin: "0", fontSize: "14px", lineHeight: "1.6", color: "#5A6455" }}>
          {v.wanitaOrtu}
        </p>
      </div>
    </section>
  );
}

export function Hitung({ v, atas }: PropsBagian) {
  return (
    <section id="hitung" style={{ minHeight: "540px", boxSizing: "border-box", padding: "76px 22px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "22px", textAlign: "center", background: "#3E5239", color: "#FBF8F1", position: "relative", overflow: "hidden" }}>
      <svg style={{ position: "absolute", top: "-1px", left: "0", width: "100%", height: "46px", color: atas, pointerEvents: "none" }} viewBox="0 0 430 60" preserveAspectRatio="none" aria-hidden="true">
        <use href="#m-festun" />
      </svg>
      <svg className="ayun" style={{ position: "absolute", top: "2px", left: "3px", width: "14px", height: "110px", animationDelay: "-2.6s" }} aria-hidden="true">
        <use href="#m-untai" />
      </svg>
      <svg className="ayun" style={{ position: "absolute", top: "2px", left: "calc(10% - 9px)", width: "18px", height: "190px", animationDelay: "-1s" }} aria-hidden="true">
        <use href="#m-untai" />
      </svg>
      <svg className="ayun" style={{ position: "absolute", top: "2px", right: "calc(10% - 9px)", width: "18px", height: "200px", animationDelay: "-3.4s" }} aria-hidden="true">
        <use href="#m-untai" />
      </svg>
      <svg className="ayun" style={{ position: "absolute", top: "2px", right: "3px", width: "14px", height: "120px", animationDelay: "-.4s" }} aria-hidden="true">
        <use href="#m-untai" />
      </svg>
      <svg style={{ position: "absolute", top: "-7px", left: "-12px", width: "24px", height: "24px" }} aria-hidden="true">
        <use href="#m-bunga" />
      </svg>
      <svg style={{ position: "absolute", top: "-7px", left: "calc(10% - 12px)", width: "24px", height: "24px" }} aria-hidden="true">
        <use href="#m-bunga" />
      </svg>
      <svg style={{ position: "absolute", top: "-7px", right: "calc(10% - 12px)", width: "24px", height: "24px" }} aria-hidden="true">
        <use href="#m-bunga" />
      </svg>
      <svg style={{ position: "absolute", top: "-7px", right: "-12px", width: "24px", height: "24px" }} aria-hidden="true">
        <use href="#m-bunga" />
      </svg>
      <p className="mata" data-anim="naik" style={{ color: "#C9D8C0" }}>
        Menuju hari bahagia
      </p>
      <h2 data-anim="naik" style={{ "--d": ".1s", margin: "0", fontFamily: "'Pinyon Script', cursive", fontWeight: "400", fontSize: "42px", lineHeight: "1.15" } as CSSProperties}>
        Hitung mundur
        <br />
        menuju hari kami
      </h2>
      <div data-anim="zoom" style={{ "--d": ".2s", display: "grid", gridTemplateColumns: v.kolomHitung, gap: "10px", width: "100%", maxWidth: "330px" } as CSSProperties}>
        <div style={{ padding: "16px 0 12px", borderRadius: "16px", background: "#FFFDF8", color: "#2E3B2A" }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "34px", fontWeight: "600", lineHeight: "1" }}>
            {v.hari}
          </div>
          <div style={{ fontSize: "10px", letterSpacing: "0.2em", marginTop: "6px", color: "#6E8B6A" }}>
            HARI
          </div>
        </div>
        <div style={{ padding: "16px 0 12px", borderRadius: "16px", background: "#FFFDF8", color: "#2E3B2A" }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "34px", fontWeight: "600", lineHeight: "1" }}>
            {v.jam}
          </div>
          <div style={{ fontSize: "10px", letterSpacing: "0.2em", marginTop: "6px", color: "#6E8B6A" }}>
            JAM
          </div>
        </div>
        <div style={{ padding: "16px 0 12px", borderRadius: "16px", background: "#FFFDF8", color: "#2E3B2A" }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "34px", fontWeight: "600", lineHeight: "1" }}>
            {v.menit}
          </div>
          <div style={{ fontSize: "10px", letterSpacing: "0.2em", marginTop: "6px", color: "#6E8B6A" }}>
            MENIT
          </div>
        </div>
        {v.tampilDetik ? (
          <div style={{ padding: "16px 0 12px", borderRadius: "16px", background: "#FFFDF8", color: "#2E3B2A" }}>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "34px", fontWeight: "600", lineHeight: "1" }}>
              {v.detik}
            </div>
            <div style={{ fontSize: "10px", letterSpacing: "0.2em", marginTop: "6px", color: "#6E8B6A" }}>
              DETIK
            </div>
          </div>
        ) : null}
      </div>
      <p data-anim="naik" style={{ "--d": ".3s", margin: "0", fontFamily: "'Cormorant Garamond', serif", fontSize: "19px", letterSpacing: "0.12em" } as CSSProperties}>
        {v.tglPanjang}
      </p>
      {v.kalender ? (
        <a href={v.kalender} download data-anim="naik" style={{ textDecoration: "none", "--d": ".4s", display: "inline-flex", alignItems: "center", gap: "8px", minHeight: "46px", padding: "0 22px", borderRadius: "999px", border: "1px solid #FBF8F1", background: "transparent", color: "#FBF8F1", font: "500 13px 'Jost', sans-serif", letterSpacing: "0.12em", cursor: "pointer" } as CSSProperties}>
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
    <section id="acara" style={{ minHeight: "1000px", boxSizing: "border-box", padding: "76px 22px", display: "flex", flexDirection: "column", alignItems: "center", gap: "26px", textAlign: "center", position: "relative" }}>
      <svg style={{ position: "absolute", top: "-1px", left: "0", width: "100%", height: "46px", color: atas, pointerEvents: "none" }} viewBox="0 0 430 60" preserveAspectRatio="none" aria-hidden="true">
        <use href="#m-gelombang" />
      </svg>
      <svg style={{ position: "absolute", top: "22px", left: "50%", marginLeft: "-13px", width: "26px", height: "26px", pointerEvents: "none" }} aria-hidden="true">
        <use href="#m-bunga" />
      </svg>
      <p className="mata" data-anim="naik">
        Waktu &amp; tempat
      </p>
      <h2 className="judul" data-anim="naik" style={{ "--d": ".1s", marginTop: "-20px" } as CSSProperties}>
        Rangkaian acara
      </h2>
      <div data-anim="naik" style={{ "--d": ".2s", width: "100%", display: "flex", flexDirection: "column", gap: "26px" } as CSSProperties}>
        {v.acara.map((a) => (
          <Fragment key={a.id}>
            <article className="kartu" style={{ padding: "44px 26px 30px", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
              <svg className="mekar" style={{ position: "absolute", top: "-24px", left: "50%", marginLeft: "-24px", width: "48px", height: "48px" }} aria-hidden="true">
                <use href="#m-bunga" />
              </svg>
              <h3 style={{ margin: "0", fontFamily: "'Pinyon Script', cursive", fontWeight: "400", fontSize: "40px", lineHeight: "1.1" }}>
                {a.nama}
              </h3>
              <p className="mata" style={{ letterSpacing: "0.18em" }}>
                {a.tgl}
              </p>
              <p style={{ margin: "0", fontFamily: "'Cormorant Garamond', serif", fontSize: "20px", fontWeight: "600" }}>
                {a.jam}
              </p>
              <svg style={{ width: "140px", height: "14px", margin: "6px 0" }} aria-hidden="true">
                <use href="#m-pemisah" />
              </svg>
              <p style={{ margin: "0", fontFamily: "'Cormorant Garamond', serif", fontSize: "20px", fontWeight: "600" }}>
                {a.tempat}
              </p>
              <p style={{ margin: "0", fontSize: "14px", lineHeight: "1.55", color: "#5A6455" }}>
                {a.alamat}
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "10px", marginTop: "10px" }}>
                {a.peta ? (
                  <a href={a.peta ?? undefined} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "8px", minHeight: "44px", padding: "0 18px", borderRadius: "999px", background: "#3E5239", color: "#FBF8F1", textDecoration: "none", fontSize: "12px", fontWeight: "500", letterSpacing: "0.14em" }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M12 21s-7-6.2-7-11a7 7 0 0114 0c0 4.8-7 11-7 11z" />
                      <circle cx="12" cy="10" r="2.5" />
                    </svg>
                    BUKA PETA
                  </a>
                ) : null}
                {a.kalender ? (
                  <a href={a.kalender ?? undefined} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "8px", minHeight: "44px", padding: "0 18px", borderRadius: "999px", border: "1px solid #A9BB9E", background: "transparent", color: "#2E3B2A", font: "500 12px 'Jost', sans-serif", letterSpacing: "0.14em", cursor: "pointer" }}>
                    + KALENDER
                  </a>
                ) : null}
              </div>
            </article>
          </Fragment>
        ))}
      </div>
      <svg style={{ position: "absolute", bottom: "-1px", transform: "scaleY(-1)", left: "0", width: "100%", height: "46px", color: bawah, pointerEvents: "none" }} viewBox="0 0 430 60" preserveAspectRatio="none" aria-hidden="true">
        <use href="#m-gelombang" />
      </svg>
      <svg style={{ position: "absolute", bottom: "22px", left: "50%", marginLeft: "-13px", width: "26px", height: "26px", pointerEvents: "none" }} aria-hidden="true">
        <use href="#m-bunga" />
      </svg>
    </section>
  );
}

export function Cerita({ v }: PropsBagian) {
  return (
    <section id="cerita" style={{ minHeight: "820px", boxSizing: "border-box", padding: "76px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: "26px", background: "#EEF1E7", textAlign: "center" }}>
      <p className="mata" data-anim="naik">
        Cerita kami
      </p>
      <h2 className="judul" data-anim="naik" style={{ "--d": ".1s", marginTop: "-20px" } as CSSProperties}>
        Perjalanan cinta
      </h2>
      <div style={{ position: "relative", width: "100%", display: "flex", flexDirection: "column", gap: "22px", textAlign: "left" }}>
        {v.cerita.map((c) => (
          <div key={c.kunci} data-anim="naik" style={{ "--d": c.tunda, position: "relative", paddingLeft: "46px" } as CSSProperties}>
            {c.akhir ? null : (
              <span data-anim="garis" style={{ "--d": c.tundaGaris, position: "absolute", left: "15px", top: "34px", bottom: "-56px", width: "2px", background: "#B89A5E" } as CSSProperties} aria-hidden="true" />
            )}
            <span style={{ position: "absolute", left: "4px", top: "22px", width: "24px", height: "24px", boxSizing: "border-box", borderRadius: "50%", background: "#EEF1E7", border: "2px solid #B89A5E", display: "flex", alignItems: "center", justifyContent: "center" }} aria-hidden="true">
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#B89A5E" }} />
            </span>
            <div className="kartu" style={{ padding: "22px 20px", display: "flex", flexDirection: "column", gap: "6px" }}>
              <p className="mata" style={{ color: "#B89A5E" }}>
                {c.tahun}
              </p>
              <h3 style={{ margin: "0", fontFamily: "'Cormorant Garamond', serif", fontSize: "22px", fontWeight: "600" }}>
                {c.judul}
              </h3>
              <p style={{ whiteSpace: "pre-line", margin: "0", fontSize: "14px", lineHeight: "1.65", color: "#4B5546" }}>
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
    <section id="galeri" style={{ position: "relative", minHeight: "780px", boxSizing: "border-box", padding: "76px 18px", display: "flex", flexDirection: "column", alignItems: "center", gap: "24px", textAlign: "center" }}>
      <svg style={{ position: "absolute", top: "-1px", left: "0", width: "100%", height: "46px", color: atas, pointerEvents: "none" }} viewBox="0 0 430 60" preserveAspectRatio="none" aria-hidden="true">
        <use href="#m-gelombang" />
      </svg>
      <svg style={{ position: "absolute", top: "22px", left: "50%", marginLeft: "-13px", width: "26px", height: "26px", pointerEvents: "none" }} aria-hidden="true">
        <use href="#m-bunga" />
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
              <button key={g.id} type="button" className="foto" onClick={g.buka} aria-label={`Lihat ${g.label}`} style={{ display: "block", width: "100%", aspectRatio: g.rasio, border: "0", padding: "0", borderRadius: "16px", background: g.warna, cursor: "zoom-in" }}>
                {g.src ? <Image src={g.src} alt="" fill sizes={g.sizes} style={{ objectFit: "contain" }} /> : null}
              </button>
            ))}
          </div>
        ))}
      </div>
      <p style={{ margin: "0", fontSize: "12px", color: "#6B7466" }}>
        Ketuk foto untuk memperbesar
      </p>
      <svg style={{ position: "absolute", bottom: "-1px", transform: "scaleY(-1)", left: "0", width: "100%", height: "46px", color: bawah, pointerEvents: "none" }} viewBox="0 0 430 60" preserveAspectRatio="none" aria-hidden="true">
        <use href="#m-gelombang" />
      </svg>
      <svg style={{ position: "absolute", bottom: "22px", left: "50%", marginLeft: "-13px", width: "26px", height: "26px", pointerEvents: "none" }} aria-hidden="true">
        <use href="#m-bunga" />
      </svg>
    </section>
  );
}

export function Rsvp({ v }: PropsBagian) {
  return (
    <section id="rsvp" style={{ minHeight: "1180px", boxSizing: "border-box", padding: "76px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: "20px", textAlign: "center", background: "#5E7A58", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: "-24px", right: "-40px", width: "200px", height: "155px", transform: "scaleY(-1)", opacity: "0.55" }} aria-hidden="true">
        <svg className="ayun-pelan" style={{ width: "200px", height: "155px" }}>
          <use href="#m-buket" />
        </svg>
      </div>
      <p className="mata" data-anim="naik" style={{ color: "#DCE7D5" }}>
        Konfirmasi kehadiran
      </p>
      <h2 className="judul" data-anim="naik" style={{ "--d": ".1s", marginTop: "-16px", color: "#FBF8F1" } as CSSProperties}>
        RSVP
      </h2>
      <p data-anim="naik" style={{ "--d": ".15s", margin: "0", fontSize: "14px", lineHeight: "1.6", color: "#E4ECDD" } as CSSProperties}>
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
                <p style={{ margin: "6px 0 0", fontFamily: "'Cormorant Garamond', serif", fontSize: "23px", fontWeight: "600" }}>
                  {v.namaTamu}
                </p>
                <p style={{ margin: "6px 0 0", fontSize: "12px", lineHeight: "1.5", color: "#5A6455" }}>
                  {v.keteranganMaks}
                </p>
              </div>
              {v.rsvpAcara.map((r) => (
                <Fragment key={r.id}>
                  <fieldset style={{ margin: "0", padding: "16px", border: "1px solid #E3DAC6", borderRadius: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
                    <legend style={{ padding: "0 8px", fontFamily: "'Cormorant Garamond', serif", fontSize: "20px", fontWeight: "600" }}>
                      {r.nama}
                    </legend>
                    <p style={{ margin: "-6px 0 0", fontSize: "12px", color: "#6B7466" }}>
                      {r.tgl} · {r.jam}
                    </p>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "8px" }}>
                      <button type="button" onClick={r.pilihYa} aria-pressed={r.ya} style={{ minHeight: "46px", borderRadius: "999px", border: `1.5px solid ${r.yaBd}`, background: r.yaBg, color: r.yaFg, font: "500 13px 'Jost', sans-serif", cursor: "pointer" }}>
                        Ya, akan hadir
                      </button>
                      <button type="button" onClick={r.pilihTidak} aria-pressed={r.tidak} style={{ minHeight: "46px", borderRadius: "999px", border: `1.5px solid ${r.tdBd}`, background: r.tdBg, color: r.tdFg, font: "500 13px 'Jost', sans-serif", cursor: "pointer" }}>
                        Tidak hadir
                      </button>
                    </div>
                    {r.tampilJumlah ? (
                      <>
                        <div className="masuk" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px", padding: "6px 6px 6px 16px", borderRadius: "999px", background: "#F4F0E6" }}>
                            <span style={{ display: "flex", flexDirection: "column", gap: "2px", textAlign: "left" }}>
                              <span style={{ fontSize: "13px" }}>
                                Dewasa
                              </span>
                              <span style={{ fontSize: "11px", opacity: "0.7" }}>
                                Maks. {r.maksD}
                              </span>
                            </span>
                            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                              <button type="button" onClick={r.kurangD} aria-label={`Kurangi dewasa ${r.nama}`} style={{ width: "32px", height: "32px", borderRadius: "50%", border: "1px solid #B9C4B0", background: "#FFFFFF", color: "#2E3B2A", cursor: "pointer", opacity: r.dMinOp }}>
                                −
                              </button>
                              <span style={{ minWidth: "18px", textAlign: "center", fontWeight: "500" }}>
                                {r.dewasa}
                              </span>
                              <button type="button" onClick={r.tambahD} aria-label={`Tambah dewasa ${r.nama}`} style={{ width: "32px", height: "32px", borderRadius: "50%", border: "1px solid #B9C4B0", background: "#FFFFFF", color: "#2E3B2A", cursor: "pointer", opacity: r.dMaxOp }}>
                                +
                              </button>
                            </span>
                          </div>
                          {r.showAnak ? (
                            <>
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px", padding: "6px 6px 6px 16px", borderRadius: "999px", background: "#F4F0E6" }}>
                                <span style={{ display: "flex", flexDirection: "column", gap: "2px", textAlign: "left" }}>
                                  <span style={{ fontSize: "13px" }}>
                                    Anak
                                  </span>
                                  <span style={{ fontSize: "11px", opacity: "0.7" }}>
                                    Maks. {r.maksA}
                                  </span>
                                </span>
                                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                  <button type="button" onClick={r.kurangA} aria-label={`Kurangi anak ${r.nama}`} style={{ width: "32px", height: "32px", borderRadius: "50%", border: "1px solid #B9C4B0", background: "#FFFFFF", color: "#2E3B2A", cursor: "pointer", opacity: r.aMinOp }}>
                                    −
                                  </button>
                                  <span style={{ minWidth: "18px", textAlign: "center", fontWeight: "500" }}>
                                    {r.anak}
                                  </span>
                                  <button type="button" onClick={r.tambahA} aria-label={`Tambah anak ${r.nama}`} style={{ width: "32px", height: "32px", borderRadius: "50%", border: "1px solid #B9C4B0", background: "#FFFFFF", color: "#2E3B2A", cursor: "pointer", opacity: r.aMaxOp }}>
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
              <button type="button" onClick={v.kirimRsvp} disabled={v.kirimNonaktif} style={{ minHeight: "52px", borderRadius: "999px", border: "0", background: "#3E5239", color: "#FBF8F1", font: "500 13px 'Jost', sans-serif", letterSpacing: "0.22em", cursor: "pointer", opacity: v.kirimOpacity }}>
                KIRIM KONFIRMASI
              </button>
            </div>
          </>
        ) : null}
        {v.showTerima ? (
          <>
            <div className="masuk" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", textAlign: "center", padding: "10px 0" }}>
              <svg className="mekar" width="58" height="58" aria-hidden="true">
                <use href="#m-bunga" />
              </svg>
              <h3 style={{ margin: "0", fontFamily: "'Pinyon Script', cursive", fontWeight: "400", fontSize: "40px" }}>
                Terima kasih
              </h3>
              <p style={{ margin: "0", fontSize: "15px", lineHeight: "1.6" }}>
                {v.ringkasan}
              </p>
              <p style={{ margin: "0", fontSize: "13px", color: "#5A6455" }}>
                {v.teksUbah}
              </p>
              {v.bisaUbah ? (
                <button type="button" onClick={v.ubahRsvp} style={{ minHeight: "44px", padding: "0 20px", borderRadius: "999px", border: "1px solid #A9BB9E", background: "transparent", color: "#2E3B2A", font: "500 13px 'Jost', sans-serif", cursor: "pointer" }}>
                  Ubah jawaban
                </button>
              ) : null}
              {v.qrTampil ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", marginTop: "6px" }}>
                  <Image src={v.qrTampil} alt="Kode QR check-in" width={168} height={168} unoptimized style={{ borderRadius: "12px", background: "#FFFFFF", padding: "8px", boxSizing: "content-box" }} />
                  <p style={{ margin: "0", fontSize: "13px", color: "#5A6455", textAlign: "center" }}>
                    Tunjukkan kode ini kepada penerima tamu di lokasi acara.
                  </p>
                </div>
              ) : null}
            </div>
          </>
        ) : null}
        {v.showTutup ? (
          <p style={{ margin: "0", fontSize: "13px", color: "#5A6455", textAlign: "center", padding: "10px 0" }}>
            Formulir konfirmasi sudah ditutup. Hubungi mempelai bila rencana Anda berubah.
          </p>
        ) : null}
        {v.pesanRsvp ? (
          <p role="status" style={{ margin: "0", fontSize: "13px", color: "#5A6455", textAlign: "center", marginTop: "14px" }}>
            {v.pesanRsvp}
          </p>
        ) : null}
      </div>
    </section>
  );
}

export function Ucapan({ v, atas, bawah }: PropsBagian) {
  return (
    <section id="ucapan" style={{ position: "relative", minHeight: "1120px", boxSizing: "border-box", padding: "76px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: "20px", textAlign: "center" }}>
      <svg style={{ position: "absolute", top: "-1px", left: "0", width: "100%", height: "46px", color: atas, pointerEvents: "none" }} viewBox="0 0 430 60" preserveAspectRatio="none" aria-hidden="true">
        <use href="#m-gelombang" />
      </svg>
      <svg style={{ position: "absolute", top: "22px", left: "50%", marginLeft: "-13px", width: "26px", height: "26px", pointerEvents: "none" }} aria-hidden="true">
        <use href="#m-bunga" />
      </svg>
      <p className="mata" data-anim="naik">
        Ucapan &amp; doa
      </p>
      <h2 className="judul" data-anim="naik" style={{ "--d": ".1s", marginTop: "-16px" } as CSSProperties}>
        Kirim ucapan
      </h2>
      <div className="kartu" data-anim="naik" style={{ "--d": ".2s", width: "100%", boxSizing: "border-box", padding: "26px 20px", display: "flex", flexDirection: "column", gap: "12px", textAlign: "left" } as CSSProperties}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ width: "38px", height: "38px", borderRadius: "50%", background: "#DCE5D2", color: "#3E5239", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Cormorant Garamond', serif", fontSize: "18px", fontWeight: "600" }} aria-hidden="true">
            {v.inisialTamu}
          </span>
          <span style={{ fontWeight: "500" }}>
            {v.namaTamu}
          </span>
        </div>
        <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", fontWeight: "500" }}>
          Ucapan dan doa
          <textarea rows={3} value={v.teksUcapan} onChange={v.ketikUcapan} maxLength={v.maksUcapan} placeholder={v.placeholderUcapan} style={{ font: "400 14px/1.5 'Jost', sans-serif", padding: "12px", borderRadius: "14px", border: "1px solid #D8D2C2", background: "#FDFCF8", color: "#2E3B2A", resize: "vertical" }} />
        </label>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
          <span style={{ fontSize: "12px", color: "#6B7466" }}>
            {v.sisaKarakter} karakter tersisa
          </span>
          <button type="button" onClick={v.kirimUcapan} disabled={v.ucapanNonaktif} style={{ minHeight: "44px", padding: "0 20px", borderRadius: "999px", border: "0", background: "#3E5239", color: "#FBF8F1", font: "500 12px 'Jost', sans-serif", letterSpacing: "0.18em", cursor: "pointer", opacity: v.ucapanOpacity }}>
            KIRIM UCAPAN
          </button>
        </div>
        {v.pesanUcapan ? (
          <p role="status" style={{ fontSize: "12px", color: "#6B7466", margin: "0" }}>
            {v.pesanUcapan}
          </p>
        ) : null}
      </div>
      <div data-anim="naik" style={{ "--d": ".25s", width: "100%", display: "flex", flexDirection: "column", gap: "12px" } as CSSProperties}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "20px", fontWeight: "600" }}>
            {v.jumlahUcapan} ucapan
          </span>
          <span style={{ fontSize: "12px", color: "#6B7466" }}>
            Halaman {v.halamanKe} dari {v.totalHalaman}
          </span>
        </div>
        <ul className="daftar-ucapan" style={{ listStyle: "none", margin: "0", padding: "4px 6px 4px 0", maxHeight: "470px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px", textAlign: "left" }}>
          {v.adaUcapan ? null : (
            <li style={{ padding: "14px 16px", borderRadius: "18px", background: "#FFFDF8", border: "1px solid #E8E0CD", display: "flex", flexDirection: "column", gap: "6px" }}>
              <p style={{ margin: "0", fontSize: "14px", lineHeight: "1.6", color: "#3B4636", textAlign: "center" }}>
                Belum ada ucapan. Jadilah yang pertama mendoakan {v.pasangan}.
              </p>
            </li>
          )}
          {v.ucapan.map((u) => (
            <Fragment key={u.id}>
              <li className="masuk" style={{ padding: "14px 16px", borderRadius: "18px", background: "#FFFDF8", border: "1px solid #E8E0CD", display: "flex", flexDirection: "column", gap: "6px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ width: "34px", height: "34px", borderRadius: "50%", background: u.avatar, color: "#2E3B2A", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Cormorant Garamond', serif", fontSize: "16px", fontWeight: "600", flexShrink: "0" }} aria-hidden="true">
                    {u.inisial}
                  </span>
                  <div style={{ flex: "1", minWidth: "0" }}>
                    <p style={{ margin: "0", fontWeight: "500", fontSize: "14px" }}>
                      {u.nama}
                    </p>
                    <p style={{ margin: "0", fontSize: "11px", color: "#6B7466" }}>
                      {u.waktu}
                    </p>
                  </div>
                  <span style={{ padding: "3px 9px", borderRadius: "999px", background: u.badgeBg, color: u.badgeFg, fontSize: "11px", fontWeight: "500", whiteSpace: "nowrap" }}>
                    {u.badge}
                  </span>
                </div>
                <p style={{ margin: "0", fontSize: "14px", lineHeight: "1.6", color: "#3B4636" }}>
                  {u.teks}
                </p>
              </li>
            </Fragment>
          ))}
        </ul>
        <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
          <button type="button" onClick={v.halSebelum} disabled={v.sebelumNonaktif} style={{ minHeight: "40px", padding: "0 16px", borderRadius: "999px", border: "1px solid #C9D3BF", background: "#FFFDF8", color: "#2E3B2A", font: "500 13px 'Jost', sans-serif", cursor: "pointer", opacity: v.sebelumOp }}>
            Sebelumnya
          </button>
          <button type="button" onClick={v.halBerikut} disabled={v.berikutNonaktif} style={{ minHeight: "40px", padding: "0 16px", borderRadius: "999px", border: "1px solid #C9D3BF", background: "#FFFDF8", color: "#2E3B2A", font: "500 13px 'Jost', sans-serif", cursor: "pointer", opacity: v.berikutOp }}>
            Berikutnya
          </button>
        </div>
      </div>
      <svg style={{ position: "absolute", bottom: "-1px", transform: "scaleY(-1)", left: "0", width: "100%", height: "46px", color: bawah, pointerEvents: "none" }} viewBox="0 0 430 60" preserveAspectRatio="none" aria-hidden="true">
        <use href="#m-gelombang" />
      </svg>
      <svg style={{ position: "absolute", bottom: "22px", left: "50%", marginLeft: "-13px", width: "26px", height: "26px", pointerEvents: "none" }} aria-hidden="true">
        <use href="#m-bunga" />
      </svg>
    </section>
  );
}

export function Amplop({ v }: PropsBagian) {
  return (
    <section id="amplop" style={{ minHeight: "640px", boxSizing: "border-box", padding: "76px 22px", display: "flex", flexDirection: "column", alignItems: "center", gap: "18px", textAlign: "center", background: "#EEF1E7" }}>
      <p className="mata" data-anim="naik">
        Tanda kasih
      </p>
      <h2 className="judul" data-anim="naik" style={{ "--d": ".1s", marginTop: "-16px" } as CSSProperties}>
        Amplop digital
      </h2>
      <p data-anim="naik" style={{ "--d": ".15s", margin: "0", fontSize: "14px", lineHeight: "1.7", color: "#4B5546" } as CSSProperties}>
        Doa restu Anda adalah hadiah terindah. Jika ingin memberi tanda kasih, dapat melalui:
      </p>
      {v.rekening.map((r) => (
        <div key={r.kunci} className="kartu" data-anim={r.arah} style={{ "--d": r.tunda, width: "100%", boxSizing: "border-box", padding: "26px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" } as CSSProperties}>
          <span className="mata" style={{ letterSpacing: "0.2em" }}>
            {r.bank}
          </span>
          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "26px", fontWeight: "600", letterSpacing: "0.06em" }}>
            {r.nomor}
          </span>
          {r.atasNama ? (
            <span style={{ fontSize: "13px" }}>
              a.n. {r.atasNama}
            </span>
          ) : null}
          <button type="button" onClick={r.salin} style={{ marginTop: "10px", minHeight: "40px", padding: "0 18px", borderRadius: "999px", border: "1px solid #A9BB9E", background: "#FBF8F1", color: "#2E3B2A", font: "500 12px 'Jost', sans-serif", letterSpacing: "0.14em", cursor: "pointer" }}>
            {r.label}
          </button>
        </div>
      ))}
      {v.qris ? (
        <div className="kartu" data-anim="naik" style={{ "--d": ".4s", width: "100%", boxSizing: "border-box", padding: "26px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" } as CSSProperties}>
          <span className="mata" style={{ letterSpacing: "0.2em" }}>
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
    <section id="penutup" style={{ minHeight: "720px", boxSizing: "border-box", padding: "220px 30px 90px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", gap: "18px", textAlign: "center", position: "relative", overflow: "hidden", background: "radial-gradient(120% 70% at 50% 100%, #DCE4D3 0%, #F7F3EA 70%)" }}>
      <svg style={{ position: "absolute", top: "-1px", left: "0", width: "100%", height: "46px", color: atas, pointerEvents: "none" }} viewBox="0 0 430 60" preserveAspectRatio="none" aria-hidden="true">
        <use href="#m-festun" />
      </svg>
      <svg className="ayun" style={{ position: "absolute", top: "2px", left: "3px", width: "14px", height: "130px", animationDelay: "-2.6s" }} aria-hidden="true">
        <use href="#m-untai" />
      </svg>
      <svg className="ayun" style={{ position: "absolute", top: "2px", left: "calc(10% - 9px)", width: "18px", height: "200px", animationDelay: "-1s" }} aria-hidden="true">
        <use href="#m-untai" />
      </svg>
      <svg className="ayun" style={{ position: "absolute", top: "2px", right: "calc(10% - 9px)", width: "18px", height: "190px", animationDelay: "-3.4s" }} aria-hidden="true">
        <use href="#m-untai" />
      </svg>
      <svg className="ayun" style={{ position: "absolute", top: "2px", right: "3px", width: "14px", height: "140px", animationDelay: "-.4s" }} aria-hidden="true">
        <use href="#m-untai" />
      </svg>
      <svg style={{ position: "absolute", top: "-7px", left: "-12px", width: "24px", height: "24px" }} aria-hidden="true">
        <use href="#m-bunga" />
      </svg>
      <svg style={{ position: "absolute", top: "-7px", left: "calc(10% - 12px)", width: "24px", height: "24px" }} aria-hidden="true">
        <use href="#m-bunga" />
      </svg>
      <svg style={{ position: "absolute", top: "-7px", right: "calc(10% - 12px)", width: "24px", height: "24px" }} aria-hidden="true">
        <use href="#m-bunga" />
      </svg>
      <svg style={{ position: "absolute", top: "-7px", right: "-12px", width: "24px", height: "24px" }} aria-hidden="true">
        <use href="#m-bunga" />
      </svg>
      <span className="kelopak" style={{ left: "20%", width: "10px", height: "13px", animationDuration: "12s", animationDelay: "-3s" }} />
      <span className="kelopak" style={{ left: "72%", width: "11px", height: "15px", animationDuration: "14s", animationDelay: "-8s" }} />
      <p data-anim="naik" style={{ whiteSpace: "pre-line", margin: "0", fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontSize: "19px", lineHeight: "1.65", color: "#3B4636" }}>
        {v.penutup}
      </p>
      <h2 className="judul" data-anim="zoom" style={{ "--d": ".15s", fontSize: "56px" } as CSSProperties}>
        Terima kasih
      </h2>
      <p data-anim="naik" style={{ "--d": ".25s", margin: "0", fontFamily: "'Pinyon Script', cursive", fontSize: "34px", color: "#4F6A4B" } as CSSProperties}>
        {v.pasangan}
      </p>
      <svg style={{ position: "absolute", left: "-26px", bottom: "-18px", width: "200px", height: "155px" }} className="ayun-pelan" aria-hidden="true">
        <use href="#m-buket" />
      </svg>
      <div style={{ position: "absolute", right: "-26px", bottom: "-18px", width: "200px", height: "155px", transform: "scaleX(-1)" }} aria-hidden="true">
        <svg className="ayun-pelan" style={{ width: "200px", height: "155px", animationDelay: "-3s" }}>
          <use href="#m-buket" />
        </svg>
      </div>
    </section>
  );
}

export function Progres() {
  return (
    <div style={{ position: "fixed", top: "0", left: "0", zIndex: "30", height: "3px", width: "calc(var(--progres, 0) * 100%)", background: "linear-gradient(90deg, #B5C4A9, #5E7A58)" }} aria-hidden="true" />
  );
}

export function Lightbox({ v }: { v: Vals }) {
  return v.fotoBuka ? (
      <>
        <div role="dialog" aria-modal="true" aria-label="Foto galeri" style={{ position: "fixed", inset: "0", zIndex: "40", background: "rgba(30,38,28,0.88)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px", padding: "20px" }}>
          <div className="masuk foto" style={{ width: "min(360px, 88vw)", height: "min(480px, 70vh)", borderRadius: "18px", background: v.fotoWarna }}>
            {v.fotoSrc ? <Image key={v.fotoSrc} src={v.fotoSrc} alt={v.fotoLabel} fill sizes="(max-width: 430px) 88vw, 360px" style={{ objectFit: "contain" }} /> : null}
          </div>
          <p style={{ margin: "0", color: "#FBF8F1", fontSize: "13px", letterSpacing: "0.12em" }}>
            {v.fotoLabel}
          </p>
          <div style={{ display: "flex", gap: "10px" }}>
            <button type="button" onClick={v.fotoSebelum} aria-label="Foto sebelumnya" style={{ width: "46px", height: "46px", borderRadius: "50%", border: "1px solid rgba(251,248,241,0.6)", background: "transparent", color: "#FBF8F1", fontSize: "20px", cursor: "pointer" }}>
              ‹
            </button>
            <button type="button" onClick={v.fotoTutup} data-tutup-foto style={{ minHeight: "46px", padding: "0 20px", borderRadius: "999px", border: "0", background: "#FBF8F1", color: "#2E3B2A", font: "500 13px 'Jost', sans-serif", cursor: "pointer" }}>
              Tutup
            </button>
            <button type="button" onClick={v.fotoBerikut} aria-label="Foto berikutnya" style={{ width: "46px", height: "46px", borderRadius: "50%", border: "1px solid rgba(251,248,241,0.6)", background: "transparent", color: "#FBF8F1", fontSize: "20px", cursor: "pointer" }}>
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
    <button type="button" onClick={v.toggleMusik} aria-label={v.musikLabel} style={{ position: "fixed", right: "16px", bottom: "20px", zIndex: "35", width: "50px", height: "50px", borderRadius: "50%", border: "2px solid #FBF8F1", background: "#3E5239", color: "#FBF8F1", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 22px rgba(46,59,42,0.35)", cursor: "pointer", padding: "0" }}>
      {v.musikMain ? (
        <>
          <svg className="cakram" width="30" height="30" viewBox="0 0 30 30" aria-hidden="true">
            <circle cx="15" cy="15" r="14" fill="#2E3B2A" />
            <circle cx="15" cy="15" r="10" fill="none" stroke="#5E7A58" strokeWidth="0.8" />
            <circle cx="15" cy="15" r="6.5" fill="none" stroke="#5E7A58" strokeWidth="0.8" />
            <circle cx="15" cy="15" r="3.5" fill="#E8CFC6" />
            <circle cx="15" cy="15" r="1" fill="#2E3B2A" />
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
