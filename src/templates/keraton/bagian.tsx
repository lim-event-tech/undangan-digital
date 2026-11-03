import { Fragment, type CSSProperties } from "react";
import Image from "next/image";
import type { PropsBagian, Vals } from "@/templates/bersama/jenis";

export const GAYA_AKAR: CSSProperties = { minHeight: "100vh", background: "#0F231D", fontFamily: "'Lora', Georgia, serif", color: "#F4EBD8" };

export const KERTAS: { className?: string; style: CSSProperties } = { style: { maxWidth: "430px", margin: "0 auto", position: "relative", overflow: "hidden", background: "#16302A" } };

export function Sampul({ v, berikut }: PropsBagian) {
  return (
    <section id="sampul" style={{ minHeight: "844px", boxSizing: "border-box", position: "relative", padding: "70px 24px 56px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "22px", overflow: "hidden", background: "linear-gradient(180deg, #B9CBB6 0%, #7F9C88 28%, #2F5A48 62%, #16302A 100%)" }}>
      <div style={{ position: "absolute", inset: "0", transform: "translateY(calc(var(--gulir, 0) * 0.05px))" }} aria-hidden="true">
        <svg className="goyang" style={{ position: "absolute", left: "-40px", bottom: "290px", width: "170px", height: "220px", color: "#8FAA97", transformOrigin: "50% 100%" }}>
          <use href="#k-palem" />
        </svg>
        <svg className="goyang" style={{ position: "absolute", right: "-50px", bottom: "290px", width: "190px", height: "240px", color: "#8FAA97", transformOrigin: "50% 100%", animationDelay: "-2s" }}>
          <use href="#k-palem" />
        </svg>
      </div>
      <svg className="kabut" style={{ position: "absolute", left: "-60px", bottom: "262px", width: "520px", height: "70px" }} aria-hidden="true">
        <ellipse cx="260" cy="35" rx="260" ry="24" fill="#DCE6D8" opacity="0.4" />
      </svg>
      <div style={{ position: "absolute", inset: "0", transform: "translateY(calc(var(--gulir, 0) * 0.06px))" }} aria-hidden="true">
        <svg className="goyang" style={{ position: "absolute", left: "-90px", bottom: "-30px", width: "200px", height: "260px", color: "#2F5A48", transformOrigin: "50% 100%", animationDelay: "-1s" }}>
          <use href="#k-palem" />
        </svg>
        <svg className="goyang" style={{ position: "absolute", right: "-100px", bottom: "-30px", width: "210px", height: "270px", color: "#2F5A48", transformOrigin: "50% 100%", animationDelay: "-3s" }}>
          <use href="#k-palem" />
        </svg>
      </div>
      <svg style={{ position: "absolute", left: "0", right: "0", bottom: "0", width: "100%", height: "56px" }} viewBox="0 0 430 56" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 26 C80 8 160 24 215 16 C290 6 360 22 430 12 V56 H0Z" fill="#16302A" />
      </svg>
      <div style={{ position: "absolute", top: "0", left: "0", right: "0", height: "200px", transform: "translateY(calc(var(--gulir, 0) * -0.3px))" }} aria-hidden="true">
        <div style={{ position: "absolute", top: "-4px", left: "-10px", right: "-10px", height: "24px", background: "#26473A", borderRadius: "0 0 50% 50% / 0 0 100% 100%" }} />
        <svg className="ayun" style={{ position: "absolute", top: "12px", left: "16px", width: "16px", height: "170px", animationDelay: "-1s" }}>
          <use href="#k-untai" />
        </svg>
        <svg className="ayun" style={{ position: "absolute", top: "12px", left: "44px", width: "14px", height: "120px", animationDelay: "-2.4s" }}>
          <use href="#k-untai" />
        </svg>
        <svg className="ayun" style={{ position: "absolute", top: "12px", left: "70px", width: "16px", height: "190px", animationDelay: "-.5s" }}>
          <use href="#k-untai" />
        </svg>
        <svg className="ayun" style={{ position: "absolute", top: "12px", right: "70px", width: "16px", height: "180px", animationDelay: "-2.9s" }}>
          <use href="#k-untai" />
        </svg>
        <svg className="ayun" style={{ position: "absolute", top: "12px", right: "44px", width: "14px", height: "130px", animationDelay: "-.9s" }}>
          <use href="#k-untai" />
        </svg>
        <svg className="ayun" style={{ position: "absolute", top: "12px", right: "16px", width: "16px", height: "170px", animationDelay: "-4s" }}>
          <use href="#k-untai" />
        </svg>
      </div>
      <div className="bangkit" style={{ position: "relative", width: "280px", height: "400px", marginTop: "30px" }}>
        <svg style={{ width: "280px", height: "400px", filter: "drop-shadow(0 18px 30px rgba(0,0,0,0.35))" }} viewBox="0 0 300 430" aria-hidden="true">
          <use href="#k-gapura" />
        </svg>
        <svg className="kelip" style={{ top: "-8px", left: "132px", width: "16px", height: "16px" }} aria-hidden="true">
          <use href="#k-bintik" />
        </svg>
        <svg className="kelip" style={{ top: "110px", left: "0", width: "12px", height: "12px", animationDelay: "-1s" }} aria-hidden="true">
          <use href="#k-bintik" />
        </svg>
        <svg className="kelip" style={{ top: "110px", right: "0", width: "12px", height: "12px", animationDelay: "-2s" }} aria-hidden="true">
          <use href="#k-bintik" />
        </svg>
        <div style={{ position: "absolute", left: "62px", right: "62px", top: "120px", bottom: "30px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "4px" }}>
          <p className="mata" style={{ color: "#F2D58C", fontSize: "10px", letterSpacing: "0.26em" }}>
            The wedding of
          </p>
          <h1 style={{ margin: "8px 0 0", fontFamily: "'Italianno', cursive", fontWeight: "400", fontSize: "54px", lineHeight: "0.9", color: "#FBF5E8" }}>
            {v.pria}
          </h1>
          <span style={{ fontFamily: "'Italianno', cursive", fontSize: "30px", lineHeight: "1" }}>
            <span className="emas">
              &amp;
            </span>
          </span>
          <h1 style={{ margin: "0", fontFamily: "'Italianno', cursive", fontWeight: "400", fontSize: "54px", lineHeight: "0.9", color: "#FBF5E8" }}>
            {v.wanita}
          </h1>
          <p style={{ margin: "10px 0 0", fontFamily: "'Cinzel', serif", fontSize: "12px", letterSpacing: "0.18em", color: "#F2D58C" }}>
            {v.tglTitikTengah}
          </p>
        </div>
        <svg className="mekar" style={{ position: "absolute", left: "-46px", bottom: "-14px", width: "130px", height: "108px" }} aria-hidden="true">
          <use href="#k-rangkai" />
        </svg>
        <div style={{ position: "absolute", right: "-46px", bottom: "-14px", width: "130px", height: "108px", transform: "scaleX(-1)" }} aria-hidden="true">
          <svg className="mekar" style={{ width: "130px", height: "108px", animationDelay: "-2.5s" }}>
            <use href="#k-rangkai" />
          </svg>
        </div>
      </div>
      <div className="masuk" style={{ animationDelay: ".6s", position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
        <p style={{ margin: "0", fontStyle: "italic", fontSize: "15px", color: "#DCE6D8" }}>
          Kepada Bapak/Ibu/Saudara/i
        </p>
        <p style={{ margin: "0", fontFamily: "'Cinzel', serif", fontSize: "20px", fontWeight: "600", letterSpacing: "0.04em", color: "#F2D58C" }}>
          {v.namaTamu}
        </p>
      </div>
      <div className="masuk" style={{ animationDelay: ".9s", position: "relative" }}>
        <a href={`#${berikut}`} onClick={v.bukaUndangan} className="denyut" style={{ display: "inline-flex", alignItems: "center", gap: "10px", minHeight: "50px", padding: "0 30px", borderRadius: "999px", background: "#8A1E2D", border: "1px solid #C6A35A", color: "#F4EBD8", textDecoration: "none", fontFamily: "'Cinzel', serif", fontSize: "13px", fontWeight: "600", letterSpacing: "0.2em" }}>
          BUKA UNDANGAN
        </a>
      </div>
    </section>
  );
}

export function Pembuka({ v, atas, berikut }: PropsBagian) {
  return (
    <section id="mulai" style={{ minHeight: "720px", boxSizing: "border-box", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "center", padding: "120px 28px 0", textAlign: "center", background: "linear-gradient(180deg, #DCE6D8 0%, #A7BBA6 45%, #4E7A63 100%)" }}>
      <svg style={{ position: "absolute", top: "-1px", left: "0", width: "100%", height: "46px", color: atas, pointerEvents: "none" }} viewBox="0 0 430 60" preserveAspectRatio="none" aria-hidden="true">
        <use href="#k-tumpal" />
      </svg>
      <div data-anim="zoom" style={{ position: "relative", width: "170px", height: "170px" }}>
        <svg className="putar" style={{ width: "170px", height: "170px" }} viewBox="-85 -85 170 170" aria-hidden="true">
          <circle r="80" fill="none" stroke="#8A1E2D" strokeWidth="1" strokeDasharray="2 6" />
          <circle r="66" fill="rgba(251,245,232,0.55)" stroke="#B08A3E" strokeWidth="1" />
          <use href="#k-kawung" x="-12" y="-92" width="24" height="24" />
          <use href="#k-kawung" x="-12" y="68" width="24" height="24" />
          <use href="#k-kawung" x="-92" y="-12" width="24" height="24" />
          <use href="#k-kawung" x="68" y="-12" width="24" height="24" />
        </svg>
        <span style={{ position: "absolute", inset: "0", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Italianno', cursive", fontSize: "66px", color: "#8A1E2D" }}>
          {v.inisialPria}
          <span style={{ fontSize: "34px", margin: "0 2px", color: "#B08A3E" }}>
            &amp;
          </span>
          {v.inisialWanita}
        </span>
      </div>
      <p className="mata" data-anim="naik" style={{ "--d": ".2s", marginTop: "26px", color: "#6B1522" } as CSSProperties}>
        Kami menikah
      </p>
      <p data-anim="naik" style={{ "--d": ".35s", margin: "10px 0 0", fontFamily: "'Cinzel', serif", fontSize: "17px", letterSpacing: "0.12em", color: "#2A2016" } as CSSProperties}>
        {v.tglPanjang}
      </p>
      <div style={{ position: "absolute", left: "0", right: "0", bottom: "0", height: "330px" }} aria-hidden="true">
        <div style={{ position: "absolute", inset: "0", transform: "translateY(calc((var(--gulir, 844) - 844) * 0.03px))" }}>
          <svg className="goyang" style={{ position: "absolute", left: "10px", bottom: "60px", width: "150px", height: "190px", color: "#7F9C88", transformOrigin: "50% 100%" }}>
            <use href="#k-palem" />
          </svg>
          <svg className="goyang" style={{ position: "absolute", right: "20px", bottom: "80px", width: "130px", height: "170px", color: "#7F9C88", transformOrigin: "50% 100%", animationDelay: "-2s" }}>
            <use href="#k-palem" />
          </svg>
        </div>
        <svg className="kabut" style={{ position: "absolute", left: "-80px", bottom: "90px", width: "560px", height: "60px" }}>
          <ellipse cx="280" cy="30" rx="280" ry="22" fill="#EEF3EC" opacity="0.5" />
        </svg>
        <div style={{ position: "absolute", inset: "0" }}>
          <svg className="goyang" style={{ position: "absolute", left: "-50px", bottom: "-20px", width: "210px", height: "260px", color: "#26473A", transformOrigin: "50% 100%", animationDelay: "-1.4s" }}>
            <use href="#k-palem" />
          </svg>
          <svg className="goyang" style={{ position: "absolute", right: "-60px", bottom: "-30px", width: "230px", height: "290px", color: "#26473A", transformOrigin: "50% 100%", animationDelay: "-3.2s" }}>
            <use href="#k-palem" />
          </svg>
        </div>
        <div style={{ position: "absolute", left: "0", right: "0", bottom: "0", height: "60px", background: "linear-gradient(180deg, transparent, #16302A)" }} />
      </div>
      <a href={`#${berikut}`} className="pantul" style={{ position: "absolute", bottom: "20px", left: "50%", marginLeft: "-22px", width: "44px", height: "44px", display: "flex", alignItems: "center", justifyContent: "center", color: "#F2D58C" }} aria-label="Gulir ke bawah">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </a>
    </section>
  );
}

export function Salam({ v }: PropsBagian) {
  return (
    <section id="salam" style={{ minHeight: "560px", boxSizing: "border-box", padding: "76px 22px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }} className="hutan">
      <svg style={{ position: "absolute", inset: "0", width: "100%", height: "100%", opacity: "0.07" }} aria-hidden="true">
        <rect width="100%" height="100%" fill="url(#k-pola)" />
      </svg>
      <div className="kartu" data-anim="naik" style={{ width: "100%", boxSizing: "border-box", padding: "66px 30px 42px", display: "flex", flexDirection: "column", alignItems: "center", gap: "18px", textAlign: "center" }}>
        <svg className="mekar" style={{ position: "absolute", top: "-34px", left: "50%", marginLeft: "-34px", width: "68px", height: "68px" }} aria-hidden="true">
          <use href="#k-kembang" />
        </svg>
        {v.kutipanTampil ? (
          <p style={{ whiteSpace: "pre-line", margin: "0", fontStyle: "italic", fontSize: "18px", lineHeight: "1.7", color: "#4A3826" }}>
            {v.kutipanTampil}
          </p>
        ) : null}
        <svg style={{ width: "200px", height: "20px" }} aria-hidden="true">
          <use href="#k-pemisah" />
        </svg>
        {v.sambutan ? (
          <p style={{ whiteSpace: "pre-line", margin: "0", fontSize: "15px", lineHeight: "1.75", color: "#4A3826" }}>
            {v.sambutan}
          </p>
        ) : null}
      </div>
    </section>
  );
}

export function Mempelai({ v }: PropsBagian) {
  return (
    <section id="mempelai" style={{ minHeight: "1180px", boxSizing: "border-box", padding: "76px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: "30px", textAlign: "center", position: "relative", overflow: "hidden", background: "linear-gradient(180deg, #16302A, #1F3E33 50%, #16302A)" }}>
      <svg style={{ position: "absolute", inset: "0", width: "100%", height: "100%", opacity: "0.05" }} aria-hidden="true">
        <rect width="100%" height="100%" fill="url(#k-pola)" />
      </svg>
      <p className="mata" data-anim="naik">
        Mempelai
      </p>
      <h2 className="judul" data-anim="naik" style={{ "--d": ".1s", marginTop: "-16px" } as CSSProperties}>
        Kedua mempelai
      </h2>
      <div data-anim="kiri" style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
        <div style={{ position: "relative", padding: "8px", borderRadius: "130px 130px 14px 14px", background: "#FBF5E8", boxShadow: "0 18px 36px rgba(0,0,0,0.35)" }}>
          <div className="foto" style={{ width: "214px", height: "290px", borderRadius: "122px 122px 8px 8px", background: "linear-gradient(170deg, #7F9C88, #2F5A48)", border: "1px solid #C6A35A", boxSizing: "border-box", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "6px", color: "#F4EBD8" }}>
            {v.fotoPria ? (
              <Image src={v.fotoPria} alt={v.altPria} fill sizes="240px" style={{ objectFit: "cover" }} />
            ) : (
              <span aria-hidden="true" style={{ fontFamily: "'Italianno', cursive", fontSize: "88px", lineHeight: "1", opacity: "0.8" }}>
                {v.inisialPria}
              </span>
            )}
          </div>
          <svg className="mekar" style={{ position: "absolute", left: "-50px", bottom: "-30px", width: "150px", height: "125px" }} aria-hidden="true">
            <use href="#k-rangkai" />
          </svg>
        </div>
        <h3 style={{ margin: "22px 0 0", fontFamily: "'Italianno', cursive", fontWeight: "400", fontSize: "50px", lineHeight: "1", color: "#F2D58C" }}>
          {v.priaLengkap}
        </h3>
        <p style={{ whiteSpace: "pre-line", textTransform: "uppercase", margin: "0", fontFamily: "'Cinzel', serif", fontSize: "11px", letterSpacing: "0.16em", lineHeight: "1.9", color: "#DCE6D8" }}>
          {v.priaOrtu}
        </p>
      </div>
      <div data-anim="zoom" aria-hidden="true">
        <svg style={{ width: "60px", height: "60px" }}>
          <use href="#k-kawung" />
        </svg>
      </div>
      <div data-anim="kanan" style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
        <div style={{ position: "relative", padding: "8px", borderRadius: "130px 130px 14px 14px", background: "#FBF5E8", boxShadow: "0 18px 36px rgba(0,0,0,0.35)" }}>
          <div className="foto" style={{ width: "214px", height: "290px", borderRadius: "122px 122px 8px 8px", background: "linear-gradient(170deg, #C98A8F, #8A1E2D)", border: "1px solid #C6A35A", boxSizing: "border-box", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "6px", color: "#F4EBD8" }}>
            {v.fotoWanita ? (
              <Image src={v.fotoWanita} alt={v.altWanita} fill sizes="240px" style={{ objectFit: "cover" }} />
            ) : (
              <span aria-hidden="true" style={{ fontFamily: "'Italianno', cursive", fontSize: "88px", lineHeight: "1", opacity: "0.8" }}>
                {v.inisialWanita}
              </span>
            )}
          </div>
          <div style={{ position: "absolute", right: "-50px", bottom: "-30px", width: "150px", height: "125px", transform: "scaleX(-1)" }} aria-hidden="true">
            <svg className="mekar" style={{ width: "150px", height: "125px", animationDelay: "-2s" }}>
              <use href="#k-rangkai" />
            </svg>
          </div>
        </div>
        <h3 style={{ margin: "22px 0 0", fontFamily: "'Italianno', cursive", fontWeight: "400", fontSize: "50px", lineHeight: "1", color: "#F2D58C" }}>
          {v.wanitaLengkap}
        </h3>
        <p style={{ whiteSpace: "pre-line", textTransform: "uppercase", margin: "0", fontFamily: "'Cinzel', serif", fontSize: "11px", letterSpacing: "0.16em", lineHeight: "1.9", color: "#DCE6D8" }}>
          {v.wanitaOrtu}
        </p>
      </div>
    </section>
  );
}

export function Hitung({ v, atas }: PropsBagian) {
  return (
    <section id="hitung" style={{ minHeight: "540px", boxSizing: "border-box", padding: "76px 22px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "22px", textAlign: "center", background: "#26473A", position: "relative", overflow: "hidden" }}>
      <svg style={{ position: "absolute", top: "-1px", left: "0", width: "100%", height: "46px", color: atas, pointerEvents: "none" }} viewBox="0 0 430 60" preserveAspectRatio="none" aria-hidden="true">
        <use href="#k-festun" />
      </svg>
      <svg className="ayun" style={{ position: "absolute", top: "2px", left: "3px", width: "12px", height: "120px", animationDelay: "-2.6s" }} aria-hidden="true">
        <use href="#k-untai" />
      </svg>
      <svg className="ayun" style={{ position: "absolute", top: "2px", left: "calc(10% - 8px)", width: "16px", height: "200px", animationDelay: "-1s" }} aria-hidden="true">
        <use href="#k-untai" />
      </svg>
      <svg className="ayun" style={{ position: "absolute", top: "2px", right: "calc(10% - 8px)", width: "16px", height: "210px", animationDelay: "-3.4s" }} aria-hidden="true">
        <use href="#k-untai" />
      </svg>
      <svg className="ayun" style={{ position: "absolute", top: "2px", right: "3px", width: "12px", height: "130px", animationDelay: "-.4s" }} aria-hidden="true">
        <use href="#k-untai" />
      </svg>
      <svg style={{ position: "absolute", top: "-6px", left: "-11px", width: "22px", height: "22px" }} aria-hidden="true">
        <use href="#k-kembang" />
      </svg>
      <svg style={{ position: "absolute", top: "-6px", left: "calc(10% - 11px)", width: "22px", height: "22px" }} aria-hidden="true">
        <use href="#k-kembang" />
      </svg>
      <svg style={{ position: "absolute", top: "-6px", right: "calc(10% - 11px)", width: "22px", height: "22px" }} aria-hidden="true">
        <use href="#k-kembang" />
      </svg>
      <svg style={{ position: "absolute", top: "-6px", right: "-11px", width: "22px", height: "22px" }} aria-hidden="true">
        <use href="#k-kembang" />
      </svg>
      <p className="mata" data-anim="naik">
        Menuju hari bahagia
      </p>
      <h2 className="judul" data-anim="naik" style={{ "--d": ".1s", marginTop: "-10px", fontSize: "50px" } as CSSProperties}>
        Hitung mundur
        <br />
        menuju cinta kami
      </h2>
      <div data-anim="zoom" style={{ "--d": ".2s", display: "grid", gridTemplateColumns: v.kolomHitung, gap: "10px", width: "100%", maxWidth: "320px" } as CSSProperties}>
        <div style={{ padding: "16px 0 12px", borderRadius: "12px", background: "#8A1E2D", border: "1px solid #C6A35A" }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: "28px", fontWeight: "700", lineHeight: "1", color: "#F4EBD8" }}>
            {v.hari}
          </div>
          <div style={{ fontSize: "10px", letterSpacing: "0.18em", marginTop: "6px", color: "#F2D58C" }}>
            HARI
          </div>
        </div>
        <div style={{ padding: "16px 0 12px", borderRadius: "12px", background: "#8A1E2D", border: "1px solid #C6A35A" }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: "28px", fontWeight: "700", lineHeight: "1", color: "#F4EBD8" }}>
            {v.jam}
          </div>
          <div style={{ fontSize: "10px", letterSpacing: "0.18em", marginTop: "6px", color: "#F2D58C" }}>
            JAM
          </div>
        </div>
        <div style={{ padding: "16px 0 12px", borderRadius: "12px", background: "#8A1E2D", border: "1px solid #C6A35A" }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: "28px", fontWeight: "700", lineHeight: "1", color: "#F4EBD8" }}>
            {v.menit}
          </div>
          <div style={{ fontSize: "10px", letterSpacing: "0.18em", marginTop: "6px", color: "#F2D58C" }}>
            MENIT
          </div>
        </div>
        {v.tampilDetik ? (
          <div style={{ padding: "16px 0 12px", borderRadius: "12px", background: "#8A1E2D", border: "1px solid #C6A35A" }}>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: "28px", fontWeight: "700", lineHeight: "1", color: "#F4EBD8" }}>
              {v.detik}
            </div>
            <div style={{ fontSize: "10px", letterSpacing: "0.18em", marginTop: "6px", color: "#F2D58C" }}>
              DETIK
            </div>
          </div>
        ) : null}
      </div>
      <p data-anim="naik" style={{ "--d": ".3s", margin: "0", fontFamily: "'Cinzel', serif", fontSize: "14px", letterSpacing: "0.16em" } as CSSProperties}>
        {v.tglBesar}
      </p>
      <div data-anim="naik" style={{ "--d": ".4s", display: "flex", gap: "10px" } as CSSProperties} aria-hidden="true">
        <svg className="mekar" style={{ width: "56px", height: "56px" }}>
          <use href="#k-kembang" />
        </svg>
        <svg className="mekar" style={{ width: "56px", height: "56px", animationDelay: "-2s" }}>
          <use href="#k-kembang" />
        </svg>
      </div>
    </section>
  );
}

export function Acara({ v, atas, bawah }: PropsBagian) {
  return (
    <section id="acara" style={{ minHeight: "1000px", boxSizing: "border-box", padding: "76px 22px", display: "flex", flexDirection: "column", alignItems: "center", gap: "26px", textAlign: "center", position: "relative", overflow: "hidden" }} className="hutan">
      <svg style={{ position: "absolute", top: "-1px", left: "0", width: "100%", height: "46px", color: atas, pointerEvents: "none" }} viewBox="0 0 430 60" preserveAspectRatio="none" aria-hidden="true">
        <use href="#k-tumpal" />
      </svg>
      <svg style={{ position: "absolute", inset: "0", width: "100%", height: "100%", opacity: "0.05" }} aria-hidden="true">
        <rect width="100%" height="100%" fill="url(#k-pola)" />
      </svg>
      <p className="mata" data-anim="naik">
        Waktu &amp; tempat
      </p>
      <h2 className="judul" data-anim="naik" style={{ "--d": ".1s", marginTop: "-16px" } as CSSProperties}>
        Rangkaian acara
      </h2>
      <div data-anim="naik" style={{ "--d": ".2s", width: "100%", display: "flex", flexDirection: "column", gap: "34px" } as CSSProperties}>
        {v.acara.map((a) => (
          <Fragment key={a.id}>
            <article className="kartu" style={{ padding: "48px 26px 32px", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
              <svg className="mekar" style={{ position: "absolute", top: "-28px", left: "50%", marginLeft: "-28px", width: "56px", height: "56px" }} aria-hidden="true">
                <use href="#k-kembang" />
              </svg>
              <h3 className="judul-gelap">
                {a.nama}
              </h3>
              <p style={{ margin: "0", fontFamily: "'Cinzel', serif", fontSize: "11px", fontWeight: "600", letterSpacing: "0.16em", color: "#8A1E2D" }}>
                {a.tglBesar} · {a.jam}
              </p>
              <svg style={{ width: "150px", height: "16px", margin: "6px 0" }} aria-hidden="true">
                <use href="#k-pemisah" />
              </svg>
              <p style={{ margin: "0", fontSize: "18px", fontWeight: "600" }}>
                {a.tempat}
              </p>
              <p style={{ margin: "0", fontSize: "14px", lineHeight: "1.6", color: "#5C4A38" }}>
                {a.alamat}
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "10px", marginTop: "12px" }}>
                {a.peta ? (
                  <a href={a.peta ?? undefined} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", minHeight: "44px", padding: "0 20px", borderRadius: "999px", background: "#8A1E2D", color: "#FBF5E8", textDecoration: "none", fontFamily: "'Cinzel', serif", fontSize: "11px", fontWeight: "600", letterSpacing: "0.16em" }}>
                    BUKA PETA
                  </a>
                ) : null}
                {a.kalender ? (
                  <a href={a.kalender ?? undefined} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", minHeight: "44px", padding: "0 20px", borderRadius: "999px", border: "1px solid #8A1E2D", background: "transparent", color: "#8A1E2D", font: "600 11px 'Cinzel', serif", letterSpacing: "0.16em", cursor: "pointer" }}>
                    + KALENDER
                  </a>
                ) : null}
              </div>
            </article>
          </Fragment>
        ))}
      </div>
      <svg style={{ position: "absolute", bottom: "-1px", transform: "scaleY(-1)", left: "0", width: "100%", height: "46px", color: bawah, pointerEvents: "none" }} viewBox="0 0 430 60" preserveAspectRatio="none" aria-hidden="true">
        <use href="#k-tumpal" />
      </svg>
    </section>
  );
}

export function Cerita({ v }: PropsBagian) {
  return (
    <section id="cerita" style={{ minHeight: "820px", boxSizing: "border-box", padding: "76px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: "26px", background: "#6B1522", textAlign: "center", position: "relative", overflow: "hidden" }}>
      <svg style={{ position: "absolute", inset: "0", width: "100%", height: "100%", opacity: "0.06" }} aria-hidden="true">
        <rect width="100%" height="100%" fill="url(#k-pola)" />
      </svg>
      <p className="mata" data-anim="naik" style={{ color: "#F2D58C" }}>
        Perjalanan cinta
      </p>
      <h2 className="judul" data-anim="naik" style={{ "--d": ".1s", marginTop: "-16px" } as CSSProperties}>
        Kisah kasih kami
      </h2>
      <div style={{ position: "relative", width: "100%", display: "flex", flexDirection: "column", gap: "22px", textAlign: "left" }}>
        {v.cerita.map((c) => (
          <div key={c.kunci} data-anim="naik" style={{ "--d": c.tunda, position: "relative", paddingLeft: "46px" } as CSSProperties}>
            {c.akhir ? null : (
              <span data-anim="garis" style={{ "--d": c.tundaGaris, position: "absolute", left: "15px", top: "34px", bottom: "-56px", width: "2px", background: "#C6A35A" } as CSSProperties} aria-hidden="true" />
            )}
            <span style={{ position: "absolute", left: "4px", top: "22px", width: "24px", height: "24px", boxSizing: "border-box", borderRadius: "50%", background: "#6B1522", border: "2px solid #C6A35A", display: "flex", alignItems: "center", justifyContent: "center" }} aria-hidden="true">
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#C6A35A" }} />
            </span>
            <div className="kartu" style={{ padding: "22px 20px", display: "flex", flexDirection: "column", gap: "6px" }}>
              <p className="mata" style={{ color: "#8A1E2D" }}>
                {c.tahun}
              </p>
              <h3 style={{ margin: "0", fontFamily: "'Cinzel', serif", fontSize: "17px", letterSpacing: "0.06em" }}>
                {c.judul}
              </h3>
              <p style={{ whiteSpace: "pre-line", margin: "0", fontSize: "14px", lineHeight: "1.7", color: "#5A4636" }}>
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
    <section id="galeri" style={{ position: "relative", minHeight: "780px", boxSizing: "border-box", padding: "76px 16px", display: "flex", flexDirection: "column", alignItems: "center", gap: "24px", textAlign: "center" }} className="hutan">
      <svg style={{ position: "absolute", top: "-1px", left: "0", width: "100%", height: "46px", color: atas, pointerEvents: "none" }} viewBox="0 0 430 60" preserveAspectRatio="none" aria-hidden="true">
        <use href="#k-tumpal" />
      </svg>
      <p className="mata" data-anim="naik">
        Galeri
      </p>
      <h2 className="judul" data-anim="naik" style={{ "--d": ".1s", marginTop: "-16px" } as CSSProperties}>
        Momen kami
      </h2>
      <div data-anim="zoom" style={{ "--d": ".15s", display: "flex", alignItems: "flex-start", gap: "8px", width: "100%", padding: "8px", boxSizing: "border-box", background: "#FBF5E8", borderRadius: "14px", border: "1px solid #C6A35A" } as CSSProperties}>
        {v.lajurGaleri.map((lajur, n) => (
          <div key={n} style={{ flex: "1 1 0", minWidth: "0", display: "flex", flexDirection: "column", gap: "8px" }}>
            {lajur.map((g) => (
              <button key={g.id} type="button" className="foto" onClick={g.buka} aria-label={`Lihat ${g.label}`} style={{ display: "block", width: "100%", aspectRatio: g.rasio, border: "0", padding: "0", borderRadius: "8px", background: g.warna, cursor: "zoom-in" }}>
                {g.src ? <Image src={g.src} alt="" fill sizes={g.sizes} style={{ objectFit: "contain" }} /> : null}
              </button>
            ))}
          </div>
        ))}
      </div>
      <p style={{ margin: "0", fontSize: "12px", color: "#A7BBA6" }}>
        Ketuk foto untuk memperbesar
      </p>
      <svg style={{ position: "absolute", bottom: "-1px", transform: "scaleY(-1)", left: "0", width: "100%", height: "46px", color: bawah, pointerEvents: "none" }} viewBox="0 0 430 60" preserveAspectRatio="none" aria-hidden="true">
        <use href="#k-tumpal" />
      </svg>
    </section>
  );
}

export function Rsvp({ v }: PropsBagian) {
  return (
    <section id="rsvp" style={{ minHeight: "1180px", boxSizing: "border-box", padding: "76px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: "20px", textAlign: "center", position: "relative", overflow: "hidden", background: "linear-gradient(180deg, #4E7A63, #26473A)" }}>
      <p className="mata" data-anim="naik" style={{ color: "#F2D58C" }}>
        Konfirmasi kehadiran
      </p>
      <h2 className="judul" data-anim="naik" style={{ "--d": ".1s", marginTop: "-14px" } as CSSProperties}>
        RSVP
      </h2>
      <p data-anim="naik" style={{ "--d": ".15s", margin: "0", fontSize: "14px", lineHeight: "1.6", color: "#E4ECDF" } as CSSProperties}>
        {v.teksBatas}
      </p>
      <div className="kartu" data-anim="naik" style={{ "--d": ".2s", width: "100%", boxSizing: "border-box", padding: "30px 20px", textAlign: "left" } as CSSProperties}>
        {v.showForm ? (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              <div style={{ textAlign: "center" }}>
                <p className="mata" style={{ color: "#8A1E2D", letterSpacing: "0.2em" }}>
                  Undangan untuk
                </p>
                <p style={{ margin: "6px 0 0", fontFamily: "'Cinzel', serif", fontSize: "18px", fontWeight: "600" }}>
                  {v.namaTamu}
                </p>
                <p style={{ margin: "6px 0 0", fontSize: "12px", lineHeight: "1.5", color: "#5C4A38" }}>
                  {v.keteranganMaks}
                </p>
              </div>
              {v.rsvpAcara.map((r) => (
                <Fragment key={r.id}>
                  <fieldset style={{ margin: "0", padding: "16px", border: "1px solid #E3D2AE", borderRadius: "16px", display: "flex", flexDirection: "column", gap: "12px", background: "#FFFCF4" }}>
                    <legend style={{ padding: "0 8px", fontFamily: "'Cinzel', serif", fontSize: "15px", fontWeight: "600", color: "#8A1E2D" }}>
                      {r.nama}
                    </legend>
                    <p style={{ margin: "-6px 0 0", fontSize: "12px", color: "#5C4A38" }}>
                      {r.tgl} · {r.jam}
                    </p>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "8px" }}>
                      <button type="button" onClick={r.pilihYa} aria-pressed={r.ya} style={{ minHeight: "46px", borderRadius: "999px", border: `1.5px solid ${r.yaBd}`, background: r.yaBg, color: r.yaFg, font: "600 13px 'Lora', serif", cursor: "pointer" }}>
                        Ya, akan hadir
                      </button>
                      <button type="button" onClick={r.pilihTidak} aria-pressed={r.tidak} style={{ minHeight: "46px", borderRadius: "999px", border: `1.5px solid ${r.tdBd}`, background: r.tdBg, color: r.tdFg, font: "600 13px 'Lora', serif", cursor: "pointer" }}>
                        Tidak hadir
                      </button>
                    </div>
                    {r.tampilJumlah ? (
                      <>
                        <div className="masuk" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px", padding: "6px 6px 6px 16px", borderRadius: "999px", background: "#F2E7CF" }}>
                            <span style={{ display: "flex", flexDirection: "column", gap: "2px", textAlign: "left" }}>
                              <span style={{ fontSize: "13px" }}>
                                Dewasa
                              </span>
                              <span style={{ fontSize: "11px", opacity: "0.7" }}>
                                Maks. {r.maksD}
                              </span>
                            </span>
                            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                              <button type="button" onClick={r.kurangD} aria-label={`Kurangi dewasa ${r.nama}`} style={{ width: "32px", height: "32px", borderRadius: "50%", border: "1px solid #C6A35A", background: "#FFFFFF", color: "#8A1E2D", cursor: "pointer", opacity: r.dMinOp }}>
                                −
                              </button>
                              <span style={{ minWidth: "18px", textAlign: "center", fontWeight: "600" }}>
                                {r.dewasa}
                              </span>
                              <button type="button" onClick={r.tambahD} aria-label={`Tambah dewasa ${r.nama}`} style={{ width: "32px", height: "32px", borderRadius: "50%", border: "1px solid #C6A35A", background: "#FFFFFF", color: "#8A1E2D", cursor: "pointer", opacity: r.dMaxOp }}>
                                +
                              </button>
                            </span>
                          </div>
                          {r.showAnak ? (
                            <>
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px", padding: "6px 6px 6px 16px", borderRadius: "999px", background: "#F2E7CF" }}>
                                <span style={{ display: "flex", flexDirection: "column", gap: "2px", textAlign: "left" }}>
                                  <span style={{ fontSize: "13px" }}>
                                    Anak
                                  </span>
                                  <span style={{ fontSize: "11px", opacity: "0.7" }}>
                                    Maks. {r.maksA}
                                  </span>
                                </span>
                                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                  <button type="button" onClick={r.kurangA} aria-label={`Kurangi anak ${r.nama}`} style={{ width: "32px", height: "32px", borderRadius: "50%", border: "1px solid #C6A35A", background: "#FFFFFF", color: "#8A1E2D", cursor: "pointer", opacity: r.aMinOp }}>
                                    −
                                  </button>
                                  <span style={{ minWidth: "18px", textAlign: "center", fontWeight: "600" }}>
                                    {r.anak}
                                  </span>
                                  <button type="button" onClick={r.tambahA} aria-label={`Tambah anak ${r.nama}`} style={{ width: "32px", height: "32px", borderRadius: "50%", border: "1px solid #C6A35A", background: "#FFFFFF", color: "#8A1E2D", cursor: "pointer", opacity: r.aMaxOp }}>
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
              <button type="button" onClick={v.kirimRsvp} disabled={v.kirimNonaktif} style={{ minHeight: "52px", borderRadius: "999px", border: "0", background: "#26473A", color: "#F2D58C", font: "600 12px 'Cinzel', serif", letterSpacing: "0.22em", cursor: "pointer", opacity: v.kirimOpacity }}>
                KIRIM KONFIRMASI
              </button>
            </div>
          </>
        ) : null}
        {v.showTerima ? (
          <>
            <div className="masuk" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", textAlign: "center", padding: "10px 0" }}>
              <svg className="mekar" width="64" height="64" aria-hidden="true">
                <use href="#k-kembang" />
              </svg>
              <h3 className="judul-gelap">
                Terima kasih
              </h3>
              <p style={{ margin: "0", fontSize: "15px", lineHeight: "1.6" }}>
                {v.ringkasan}
              </p>
              <p style={{ margin: "0", fontSize: "13px", color: "#5C4A38" }}>
                {v.teksUbah}
              </p>
              {v.bisaUbah ? (
                <button type="button" onClick={v.ubahRsvp} style={{ minHeight: "44px", padding: "0 20px", borderRadius: "999px", border: "1px solid #8A1E2D", background: "transparent", color: "#8A1E2D", font: "600 13px 'Lora', serif", cursor: "pointer" }}>
                  Ubah jawaban
                </button>
              ) : null}
              {v.qrTampil ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", marginTop: "6px" }}>
                  <Image src={v.qrTampil} alt="Kode QR check-in" width={168} height={168} unoptimized style={{ borderRadius: "12px", background: "#FFFFFF", padding: "8px", boxSizing: "content-box" }} />
                  <p style={{ margin: "0", fontSize: "13px", color: "#5C4A38", textAlign: "center" }}>
                    Tunjukkan kode ini kepada penerima tamu di lokasi acara.
                  </p>
                </div>
              ) : null}
            </div>
          </>
        ) : null}
        {v.showTutup ? (
          <p style={{ margin: "0", fontSize: "13px", color: "#5C4A38", textAlign: "center", padding: "10px 0" }}>
            Formulir konfirmasi sudah ditutup. Hubungi mempelai bila rencana Anda berubah.
          </p>
        ) : null}
        {v.pesanRsvp ? (
          <p role="status" style={{ margin: "0", fontSize: "13px", color: "#5C4A38", textAlign: "center", marginTop: "14px" }}>
            {v.pesanRsvp}
          </p>
        ) : null}
      </div>
    </section>
  );
}

export function Ucapan({ v, atas, bawah }: PropsBagian) {
  return (
    <section id="ucapan" style={{ position: "relative", minHeight: "1120px", boxSizing: "border-box", padding: "76px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: "20px", textAlign: "center", background: "#F4EBD8", color: "#2A2016" }}>
      <svg style={{ position: "absolute", top: "-1px", left: "0", width: "100%", height: "46px", color: atas, pointerEvents: "none" }} viewBox="0 0 430 60" preserveAspectRatio="none" aria-hidden="true">
        <use href="#k-tumpal" />
      </svg>
      <p className="mata" data-anim="naik" style={{ color: "#8A1E2D" }}>
        Ucapan &amp; doa
      </p>
      <h2 className="judul-gelap" data-anim="naik" style={{ "--d": ".1s", marginTop: "-14px" } as CSSProperties}>
        Kirim ucapan
      </h2>
      <div data-anim="naik" style={{ "--d": ".2s", width: "100%", boxSizing: "border-box", padding: "22px 18px", borderRadius: "20px", background: "#26473A", color: "#F4EBD8", display: "flex", flexDirection: "column", gap: "12px", textAlign: "left" } as CSSProperties}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ width: "38px", height: "38px", borderRadius: "50%", background: "#8A1E2D", color: "#F2D58C", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Cinzel', serif", fontWeight: "700" }} aria-hidden="true">
            {v.inisialTamu}
          </span>
          <span style={{ fontWeight: "600" }}>
            {v.namaTamu}
          </span>
        </div>
        <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", fontWeight: "600" }}>
          Ucapan dan doa
          <textarea rows={3} value={v.teksUcapan} onChange={v.ketikUcapan} maxLength={v.maksUcapan} placeholder="Tuliskan ucapan & doa Anda" style={{ font: "400 14px/1.5 'Lora', serif", padding: "12px", borderRadius: "12px", border: "1px solid rgba(198,163,90,0.6)", background: "#1F3E33", color: "#F4EBD8", resize: "vertical" }} />
        </label>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
          <span style={{ fontSize: "12px", color: "#A7BBA6" }}>
            {v.sisaKarakter} karakter tersisa
          </span>
          <button type="button" onClick={v.kirimUcapan} disabled={v.ucapanNonaktif} style={{ minHeight: "44px", padding: "0 20px", borderRadius: "999px", border: "0", background: "#C6A35A", color: "#1F3E33", font: "700 11px 'Cinzel', serif", letterSpacing: "0.18em", cursor: "pointer", opacity: v.ucapanOpacity }}>
            KIRIM UCAPAN
          </button>
        </div>
        {v.pesanUcapan ? (
          <p role="status" style={{ fontSize: "12px", color: "#A7BBA6", margin: "0" }}>
            {v.pesanUcapan}
          </p>
        ) : null}
      </div>
      <div data-anim="naik" style={{ "--d": ".25s", width: "100%", display: "flex", flexDirection: "column", gap: "12px" } as CSSProperties}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span style={{ fontFamily: "'Cinzel', serif", fontSize: "15px", fontWeight: "600" }}>
            {v.jumlahUcapan} ucapan
          </span>
          <span style={{ fontSize: "12px", color: "#5C4A38" }}>
            Halaman {v.halamanKe} dari {v.totalHalaman}
          </span>
        </div>
        <ul style={{ listStyle: "none", margin: "0", padding: "4px 6px 4px 0", maxHeight: "470px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px", textAlign: "left" }}>
          {v.adaUcapan ? null : (
            <li style={{ padding: "14px 16px", borderRadius: "16px", background: "#26473A", color: "#F4EBD8", display: "flex", flexDirection: "column", gap: "6px" }}>
              <p style={{ margin: "0", fontSize: "14px", lineHeight: "1.6", textAlign: "center" }}>
                Belum ada ucapan. Jadilah yang pertama mendoakan {v.pasangan}.
              </p>
            </li>
          )}
          {v.ucapan.map((u) => (
            <Fragment key={u.id}>
              <li className="masuk" style={{ padding: "14px 16px", borderRadius: "16px", background: "#26473A", color: "#F4EBD8", display: "flex", flexDirection: "column", gap: "6px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ width: "34px", height: "34px", borderRadius: "50%", background: u.avatar, color: "#2A2016", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Cinzel', serif", fontWeight: "700", flexShrink: "0" }} aria-hidden="true">
                    {u.inisial}
                  </span>
                  <div style={{ flex: "1", minWidth: "0" }}>
                    <p style={{ margin: "0", fontWeight: "600", fontSize: "14px" }}>
                      {u.nama}
                    </p>
                    <p style={{ margin: "0", fontSize: "11px", color: "#A7BBA6" }}>
                      {u.waktu}
                    </p>
                  </div>
                  <span style={{ padding: "3px 9px", borderRadius: "999px", background: u.badgeBg, color: u.badgeFg, fontSize: "11px", fontWeight: "600", whiteSpace: "nowrap" }}>
                    {u.badge}
                  </span>
                </div>
                <p style={{ margin: "0", fontSize: "14px", lineHeight: "1.6" }}>
                  {u.teks}
                </p>
              </li>
            </Fragment>
          ))}
        </ul>
        <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
          <button type="button" onClick={v.halSebelum} disabled={v.sebelumNonaktif} style={{ minHeight: "40px", padding: "0 16px", borderRadius: "999px", border: "1px solid #8A1E2D", background: "transparent", color: "#8A1E2D", font: "600 13px 'Lora', serif", cursor: "pointer", opacity: v.sebelumOp }}>
            Sebelumnya
          </button>
          <button type="button" onClick={v.halBerikut} disabled={v.berikutNonaktif} style={{ minHeight: "40px", padding: "0 16px", borderRadius: "999px", border: "1px solid #8A1E2D", background: "transparent", color: "#8A1E2D", font: "600 13px 'Lora', serif", cursor: "pointer", opacity: v.berikutOp }}>
            Berikutnya
          </button>
        </div>
      </div>
      <svg style={{ position: "absolute", bottom: "-1px", transform: "scaleY(-1)", left: "0", width: "100%", height: "46px", color: bawah, pointerEvents: "none" }} viewBox="0 0 430 60" preserveAspectRatio="none" aria-hidden="true">
        <use href="#k-tumpal" />
      </svg>
    </section>
  );
}

export function Amplop({ v }: PropsBagian) {
  return (
    <section id="amplop" style={{ minHeight: "640px", boxSizing: "border-box", padding: "76px 22px", display: "flex", flexDirection: "column", alignItems: "center", gap: "18px", textAlign: "center", position: "relative", overflow: "hidden" }} className="hutan">
      <svg className="mekar" style={{ position: "absolute", right: "-110px", top: "-110px", width: "260px", height: "260px", opacity: "0.35" }} aria-hidden="true">
        <use href="#k-kembang" />
      </svg>
      <svg className="mekar" style={{ position: "absolute", left: "-100px", bottom: "-100px", width: "230px", height: "230px", opacity: "0.3", animationDelay: "-2.5s" }} aria-hidden="true">
        <use href="#k-kembang" />
      </svg>
      <p className="mata" data-anim="naik">
        Tanda kasih
      </p>
      <h2 className="judul" data-anim="naik" style={{ "--d": ".1s", marginTop: "-14px" } as CSSProperties}>
        Amplop digital
      </h2>
      <p data-anim="naik" style={{ "--d": ".15s", margin: "0", fontSize: "14px", lineHeight: "1.7", color: "#DCE6D8" } as CSSProperties}>
        Doa restu Anda adalah hadiah terindah. Jika ingin memberi tanda kasih, dapat melalui:
      </p>
      {v.rekening.map((r) => (
        <div key={r.kunci} className="kartu" data-anim={r.arah} style={{ "--d": r.tunda, width: "100%", boxSizing: "border-box", padding: "26px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" } as CSSProperties}>
          <span style={{ fontFamily: "'Cinzel', serif", fontSize: "13px", fontWeight: "600", letterSpacing: "0.14em", color: "#8A1E2D" }}>
            {r.bank}
          </span>
          <span style={{ fontFamily: "'Cinzel', serif", fontSize: "22px", fontWeight: "600", letterSpacing: "0.06em" }}>
            {r.nomor}
          </span>
          {r.atasNama ? (
            <span style={{ fontSize: "13px" }}>
              a.n. {r.atasNama}
            </span>
          ) : null}
          <button type="button" onClick={r.salin} style={{ marginTop: "10px", minHeight: "40px", padding: "0 18px", borderRadius: "999px", border: "1px solid #8A1E2D", background: "transparent", color: "#8A1E2D", font: "600 11px 'Cinzel', serif", letterSpacing: "0.14em", cursor: "pointer" }}>
            {r.label}
          </button>
        </div>
      ))}
      {v.qris ? (
        <div className="kartu" data-anim="naik" style={{ "--d": ".4s", width: "100%", boxSizing: "border-box", padding: "26px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" } as CSSProperties}>
          <span style={{ fontFamily: "'Cinzel', serif", fontSize: "13px", fontWeight: "600", letterSpacing: "0.14em", color: "#8A1E2D" }}>
            QRIS
          </span>
          <Image src={v.qris} alt="Kode QRIS" width={240} height={240} sizes="240px" style={{ width: "220px", height: "auto", marginTop: "10px", borderRadius: "12px", background: "#FFFFFF", padding: "10px" }} />
        </div>
      ) : null}
    </section>
  );
}

export function Penutup({ v }: PropsBagian) {
  return (
    <section id="penutup" style={{ minHeight: "720px", boxSizing: "border-box", padding: "80px 30px 90px", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", textAlign: "center", position: "relative", overflow: "hidden", background: "linear-gradient(180deg, #16302A 0%, #2F5A48 60%, #7F9C88 100%)" }}>
      <div data-anim="zoom" style={{ position: "relative", width: "170px", height: "244px" }} aria-hidden="true">
        <svg style={{ width: "170px", height: "244px" }} viewBox="0 0 300 430">
          <use href="#k-gapura" />
        </svg>
        <span style={{ position: "absolute", left: "34px", right: "34px", top: "92px", bottom: "20px", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Italianno', cursive", fontSize: "44px", color: "#FBF5E8" }}>
          {v.inisialPria} &amp; {v.inisialWanita}
        </span>
      </div>
      <p data-anim="naik" style={{ whiteSpace: "pre-line", margin: "8px 0 0", fontStyle: "italic", fontSize: "16px", lineHeight: "1.7", color: "#DCE6D8" }}>
        {v.penutup}
      </p>
      <h2 className="judul" data-anim="zoom" style={{ "--d": ".15s", fontSize: "60px" } as CSSProperties}>
        Matur nuwun
      </h2>
      <p data-anim="naik" style={{ "--d": ".25s", margin: "0", fontFamily: "'Cinzel', serif", fontSize: "16px", letterSpacing: "0.16em" } as CSSProperties}>
        <span className="emas">
          {v.pasanganBesar}
        </span>
      </p>
      <svg className="goyang" style={{ position: "absolute", left: "-60px", bottom: "-30px", width: "200px", height: "250px", color: "#26473A", transformOrigin: "50% 100%" }} aria-hidden="true">
        <use href="#k-palem" />
      </svg>
      <svg className="goyang" style={{ position: "absolute", right: "-60px", bottom: "-40px", width: "210px", height: "270px", color: "#26473A", transformOrigin: "50% 100%", animationDelay: "-2.4s" }} aria-hidden="true">
        <use href="#k-palem" />
      </svg>
    </section>
  );
}

export function Progres() {
  return (
    <div style={{ position: "fixed", top: "0", left: "0", zIndex: "30", height: "3px", width: "calc(var(--progres, 0) * 100%)", background: "linear-gradient(90deg, #8A1E2D, #C6A35A)" }} aria-hidden="true" />
  );
}

export function Lightbox({ v }: { v: Vals }) {
  return v.fotoBuka ? (
      <>
        <div role="dialog" aria-modal="true" aria-label="Foto galeri" style={{ position: "fixed", inset: "0", zIndex: "40", background: "rgba(10,22,18,0.9)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px", padding: "20px" }}>
          <div className="masuk foto" style={{ width: "min(360px, 88vw)", height: "min(480px, 70vh)", borderRadius: "12px", border: "4px solid #FBF5E8", background: v.fotoWarna }}>
            {v.fotoSrc ? <Image key={v.fotoSrc} src={v.fotoSrc} alt={v.fotoLabel} fill sizes="(max-width: 430px) 88vw, 360px" style={{ objectFit: "contain" }} /> : null}
          </div>
          <p style={{ margin: "0", color: "#F4EBD8", fontSize: "13px", letterSpacing: "0.12em" }}>
            {v.fotoLabel}
          </p>
          <div style={{ display: "flex", gap: "10px" }}>
            <button type="button" onClick={v.fotoSebelum} aria-label="Foto sebelumnya" style={{ width: "46px", height: "46px", borderRadius: "50%", border: "1px solid #C6A35A", background: "transparent", color: "#F2D58C", fontSize: "20px", cursor: "pointer" }}>
              ‹
            </button>
            <button type="button" onClick={v.fotoTutup} data-tutup-foto style={{ minHeight: "46px", padding: "0 20px", borderRadius: "999px", border: "0", background: "#C6A35A", color: "#16302A", font: "600 13px 'Lora', serif", cursor: "pointer" }}>
              Tutup
            </button>
            <button type="button" onClick={v.fotoBerikut} aria-label="Foto berikutnya" style={{ width: "46px", height: "46px", borderRadius: "50%", border: "1px solid #C6A35A", background: "transparent", color: "#F2D58C", fontSize: "20px", cursor: "pointer" }}>
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
    <button type="button" onClick={v.toggleMusik} aria-label={v.musikLabel} style={{ position: "fixed", right: "16px", bottom: "20px", zIndex: "35", width: "50px", height: "50px", borderRadius: "50%", border: "2px solid #C6A35A", background: "#8A1E2D", color: "#F4EBD8", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 22px rgba(0,0,0,0.4)", cursor: "pointer", padding: "0" }}>
      {v.musikMain ? (
        <>
          <svg className="cakram" width="30" height="30" viewBox="0 0 30 30" aria-hidden="true">
            <circle cx="15" cy="15" r="14" fill="#1F1310" />
            <circle cx="15" cy="15" r="10" fill="none" stroke="#5A3A30" strokeWidth="0.8" />
            <circle cx="15" cy="15" r="6.5" fill="none" stroke="#5A3A30" strokeWidth="0.8" />
            <circle cx="15" cy="15" r="3.5" fill="#C6A35A" />
            <circle cx="15" cy="15" r="1" fill="#1F1310" />
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
