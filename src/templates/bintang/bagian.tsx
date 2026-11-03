import { Fragment, type CSSProperties } from "react";
import Image from "next/image";
import type { PropsBagian, Vals } from "@/templates/bersama/jenis";

export const GAYA_AKAR: CSSProperties = { minHeight: "100vh", background: "#0A1124", fontFamily: "'EB Garamond', Georgia, serif", color: "#F1EAD8" };

export const KERTAS: { className?: string; style: CSSProperties } = { className: "malam", style: { maxWidth: "430px", margin: "0 auto", position: "relative", overflow: "hidden" } };

export function Sampul({ v, berikut }: PropsBagian) {
  return (
    <section id="sampul" style={{ minHeight: "844px", boxSizing: "border-box", position: "relative", padding: "150px 26px 60px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "24px", overflow: "hidden" }}>
      <span className="bintang" style={{ top: "120px", left: "30px", width: "2px", height: "2px" }} />
      <span className="bintang" style={{ top: "200px", left: "360px", width: "3px", height: "3px", animationDelay: "-1s" }} />
      <span className="bintang" style={{ top: "420px", left: "20px", width: "2px", height: "2px", animationDelay: "-2s" }} />
      <span className="bintang" style={{ top: "520px", left: "370px", width: "2px", height: "2px", animationDelay: "-.6s" }} />
      <span className="meteor" style={{ top: "150px", right: "-60px" }} />
      <span className="kunang" style={{ top: "620px", left: "90px" }} />
      <span className="kunang" style={{ top: "660px", left: "300px", animationDelay: "-3s" }} />
      <div style={{ position: "absolute", top: "0", left: "0", right: "0", height: "280px", transform: "translateY(calc(var(--gulir, 0) * -0.3px))" }} aria-hidden="true">
        <svg className="ayun" style={{ position: "absolute", top: "-20px", left: "-6px", width: "30px", height: "240px", animationDelay: "-1s" }}>
          <use href="#b-willow" />
        </svg>
        <svg className="ayun" style={{ position: "absolute", top: "-20px", left: "20px", width: "28px", height: "200px", animationDelay: "-3s" }}>
          <use href="#b-willow" />
        </svg>
        <svg className="ayun" style={{ position: "absolute", top: "-20px", left: "46px", width: "30px", height: "260px", animationDelay: "-.4s" }}>
          <use href="#b-willow" />
        </svg>
        <svg className="ayun" style={{ position: "absolute", top: "-20px", left: "76px", width: "26px", height: "170px", animationDelay: "-2.2s" }}>
          <use href="#b-willow" />
        </svg>
        <svg className="ayun" style={{ position: "absolute", top: "-20px", left: "104px", width: "28px", height: "210px", animationDelay: "-4.1s" }}>
          <use href="#b-willow" />
        </svg>
        <svg className="ayun" style={{ position: "absolute", top: "-20px", left: "134px", width: "26px", height: "150px", animationDelay: "-1.6s" }}>
          <use href="#b-willow" />
        </svg>
        <svg className="ayun" style={{ position: "absolute", top: "-20px", right: "134px", width: "26px", height: "160px", animationDelay: "-3.4s" }}>
          <use href="#b-willow" />
        </svg>
        <svg className="ayun" style={{ position: "absolute", top: "-20px", right: "104px", width: "28px", height: "220px", animationDelay: "-.9s" }}>
          <use href="#b-willow" />
        </svg>
        <svg className="ayun" style={{ position: "absolute", top: "-20px", right: "76px", width: "26px", height: "180px", animationDelay: "-2.7s" }}>
          <use href="#b-willow" />
        </svg>
        <svg className="ayun" style={{ position: "absolute", top: "-20px", right: "46px", width: "30px", height: "250px", animationDelay: "-4.5s" }}>
          <use href="#b-willow" />
        </svg>
        <svg className="ayun" style={{ position: "absolute", top: "-20px", right: "20px", width: "28px", height: "200px", animationDelay: "-1.2s" }}>
          <use href="#b-willow" />
        </svg>
        <svg className="ayun" style={{ position: "absolute", top: "-20px", right: "-6px", width: "30px", height: "240px", animationDelay: "-3.8s" }}>
          <use href="#b-willow" />
        </svg>
        <svg style={{ position: "absolute", top: "-12px", left: "-10px", width: "240px", height: "67px" }} aria-hidden="true">
          <use href="#b-rimbun" />
        </svg>
        <svg style={{ position: "absolute", top: "-12px", right: "-10px", width: "240px", height: "67px", transform: "scaleX(-1)" }} aria-hidden="true">
          <use href="#b-rimbun" />
        </svg>
      </div>
      <div className="bangkit" style={{ position: "relative", width: "270px", height: "360px", borderRadius: "50%", background: "radial-gradient(ellipse at 50% 35%, #2A3A63 0%, #1E2B4F 70%)", boxShadow: "0 0 0 2px #C9AD72, 0 0 0 9px #1B2747, 0 0 0 10px rgba(201,173,114,0.6), inset 0 10px 30px rgba(0,0,0,0.45), 0 30px 60px rgba(0,0,0,0.45)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "8px", padding: "30px", boxSizing: "border-box" }}>
        <svg style={{ width: "46px", height: "46px", marginBottom: "4px" }} aria-hidden="true">
          <use href="#b-tangkai" />
        </svg>
        <p className="mata" style={{ fontSize: "10px", letterSpacing: "0.3em", color: "#F1EAD8" }}>
          The wedding of
        </p>
        <h1 style={{ margin: "6px 0 0", fontFamily: "'Marcellus', serif", fontWeight: "400", fontSize: "40px", letterSpacing: "0.06em", lineHeight: "1", color: "#F1EAD8" }}>
          {v.priaBesar}
        </h1>
        <span className="miring" style={{ fontSize: "24px", lineHeight: "1", color: "#C9AD72" }}>
          &amp;
        </span>
        <h1 style={{ margin: "0", fontFamily: "'Marcellus', serif", fontWeight: "400", fontSize: "40px", letterSpacing: "0.06em", lineHeight: "1", color: "#F1EAD8" }}>
          {v.wanitaBesar}
        </h1>
        <p className="miring" style={{ margin: "6px 0 0", fontSize: "15px", color: "#CFC6B1" }}>
          bersama keluarga besar
        </p>
      </div>
      <div className="masuk" style={{ animationDelay: ".6s", position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
        <p className="miring" style={{ margin: "0", fontSize: "16px", color: "#CFC6B1" }}>
          Kepada Bapak/Ibu/Saudara/i
        </p>
        <p style={{ margin: "0", fontFamily: "'Marcellus', serif", fontSize: "21px", letterSpacing: "0.04em" }}>
          {v.namaTamu}
        </p>
      </div>
      <div className="masuk" style={{ animationDelay: ".9s", position: "relative" }}>
        <a href={`#${berikut}`} onClick={v.bukaUndangan} className="denyut" style={{ display: "inline-flex", alignItems: "center", minHeight: "50px", padding: "0 32px", borderRadius: "999px", background: "#F1EAD8", color: "#1B2747", textDecoration: "none", fontFamily: "'Marcellus', serif", fontSize: "13px", letterSpacing: "0.24em", boxShadow: "0 0 0 4px rgba(241,234,216,0.15)" }}>
          BUKA UNDANGAN
        </a>
      </div>
      <svg style={{ position: "absolute", left: "0", right: "0", bottom: "0", width: "100%", height: "90px" }} viewBox="0 0 430 90" preserveAspectRatio="none" aria-hidden="true">
        <use href="#b-semak" />
      </svg>
      <svg className="goyang" style={{ position: "absolute", left: "-18px", bottom: "10px", width: "112px", height: "154px", transformOrigin: "50% 100%" }} aria-hidden="true">
        <use href="#b-guci" />
      </svg>
      <svg className="goyang" style={{ position: "absolute", right: "-18px", bottom: "10px", width: "112px", height: "154px", transformOrigin: "50% 100%", animationDelay: "-3s" }} aria-hidden="true">
        <use href="#b-guci" />
      </svg>
    </section>
  );
}

export function Pembuka({ v, berikut }: PropsBagian) {
  return (
    <section id="mulai" style={{ minHeight: "720px", boxSizing: "border-box", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "center", padding: "110px 28px 0", textAlign: "center", background: "linear-gradient(180deg, #26324F 0%, #0D1529 28%, #1B2747 65%, #26365E 100%)" }}>
      <span className="bintang" style={{ top: "60px", left: "50px", width: "2px", height: "2px" }} />
      <span className="bintang" style={{ top: "90px", left: "300px", width: "3px", height: "3px", animationDelay: "-1.4s" }} />
      <span className="bintang" style={{ top: "180px", left: "360px", width: "2px", height: "2px", animationDelay: "-2.2s" }} />
      <span className="bintang" style={{ top: "240px", left: "26px", width: "2px", height: "2px", animationDelay: "-.8s" }} />
      <span className="bintang" style={{ top: "320px", left: "330px", width: "3px", height: "3px", animationDelay: "-2.8s" }} />
      <span className="meteor" style={{ top: "80px", right: "-40px", animationDelay: "-5s" }} />
      <div data-anim="naik" style={{ position: "relative", width: "130px", height: "130px" }} aria-hidden="true">
        <div className="bulan" style={{ width: "130px", height: "130px", borderRadius: "50%", background: "radial-gradient(circle at 38% 36%, #FFF8E6 0%, #F1EAD8 55%, #D5CBB0 100%)" }} />
        <div style={{ position: "absolute", top: "-8px", left: "34px", width: "120px", height: "120px", borderRadius: "50%", background: "#121C36" }} />
      </div>
      <p className="mata" data-anim="naik" style={{ "--d": ".2s", marginTop: "30px" } as CSSProperties}>
        Kami menikah
      </p>
      <h2 data-anim="zoom" style={{ "--d": ".3s", margin: "12px 0 0", fontFamily: "'Marcellus', serif", fontWeight: "400", fontSize: "34px", letterSpacing: "0.1em" } as CSSProperties}>
        {v.inisialPria}{" "}
        <span className="miring" style={{ color: "#C9AD72" }}>
          &amp;
        </span>
        {" "}{v.inisialWanita}
      </h2>
      <p className="miring" data-anim="naik" style={{ "--d": ".4s", margin: "10px 0 0", fontSize: "21px", color: "#E3DAC4" } as CSSProperties}>
        {v.tglPanjang}
      </p>
      <div style={{ position: "absolute", left: "0", right: "0", bottom: "0", height: "260px" }} aria-hidden="true">
        <div style={{ position: "absolute", inset: "0", transform: "translateY(calc((var(--gulir, 844) - 844) * 0.12px))" }}>
          <svg viewBox="0 0 430 160" preserveAspectRatio="none" style={{ position: "absolute", left: "0", bottom: "70px", width: "100%", height: "160px" }}>
            <path d="M0 160 V90 C60 60 110 80 170 50 C230 20 290 60 350 40 C390 28 420 50 430 60 V160Z" fill="#2B3B66" />
          </svg>
        </div>
        <div style={{ position: "absolute", inset: "0", transform: "translateY(calc((var(--gulir, 844) - 844) * 0.06px))" }}>
          <svg viewBox="0 0 430 140" preserveAspectRatio="none" style={{ position: "absolute", left: "0", bottom: "30px", width: "100%", height: "140px" }}>
            <path d="M0 140 V90 C70 60 130 96 200 70 C270 44 330 84 430 66 V140Z" fill="#1E2B4F" />
          </svg>
        </div>
        <svg viewBox="0 0 430 90" preserveAspectRatio="none" style={{ position: "absolute", left: "0", bottom: "0", width: "100%", height: "90px" }}>
          <use href="#b-semak" />
        </svg>
        <span className="kunang" style={{ bottom: "120px", left: "80px" }} />
        <span className="kunang" style={{ bottom: "140px", left: "320px", animationDelay: "-2s" }} />
        <span className="kunang" style={{ bottom: "90px", left: "200px", animationDelay: "-4s" }} />
      </div>
      <a href={`#${berikut}`} className="pantul" style={{ position: "absolute", bottom: "24px", left: "50%", marginLeft: "-22px", width: "44px", height: "44px", display: "flex", alignItems: "center", justifyContent: "center", color: "#F1EAD8" }} aria-label="Gulir ke bawah">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </a>
    </section>
  );
}

export function Salam({ v, atas }: PropsBagian) {
  return (
    <section id="salam" style={{ minHeight: "560px", boxSizing: "border-box", padding: "76px 22px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
      <svg style={{ position: "absolute", top: "-1px", left: "0", width: "100%", height: "46px", color: atas, pointerEvents: "none" }} viewBox="0 0 430 60" preserveAspectRatio="none" aria-hidden="true">
        <use href="#b-awan" />
      </svg>
      <svg className="ayun" style={{ position: "absolute", top: "0", left: "6px", width: "26px", height: "200px" }} aria-hidden="true">
        <use href="#b-willow" />
      </svg>
      <svg className="ayun" style={{ position: "absolute", top: "0", right: "6px", width: "26px", height: "220px", animationDelay: "-2s" }} aria-hidden="true">
        <use href="#b-willow" />
      </svg>
      <svg style={{ position: "absolute", top: "-6px", left: "-10px", width: "150px", height: "42px" }} aria-hidden="true">
        <use href="#b-rimbun" />
      </svg>
      <svg style={{ position: "absolute", top: "-6px", right: "-10px", width: "150px", height: "42px", transform: "scaleX(-1)" }} aria-hidden="true">
        <use href="#b-rimbun" />
      </svg>
      <div className="kartu" data-anim="naik" style={{ width: "100%", boxSizing: "border-box", padding: "90px 30px 40px", display: "flex", flexDirection: "column", alignItems: "center", gap: "18px", textAlign: "center" }}>
        <svg style={{ position: "absolute", top: "26px", left: "50%", marginLeft: "-26px", width: "52px", height: "52px" }} aria-hidden="true">
          <use href="#b-tangkai" />
        </svg>
        {v.kutipanTampil ? (
          <p className="miring" style={{ whiteSpace: "pre-line", margin: "0", fontSize: "21px", lineHeight: "1.6", color: "#2B3B66" }}>
            {v.kutipanTampil}
          </p>
        ) : null}
        <svg style={{ width: "200px", height: "18px" }} aria-hidden="true">
          <use href="#b-pemisah" />
        </svg>
        {v.sambutan ? (
          <p style={{ whiteSpace: "pre-line", margin: "0", fontSize: "16px", lineHeight: "1.75", color: "#3A4664" }}>
            {v.sambutan}
          </p>
        ) : null}
      </div>
    </section>
  );
}

export function Mempelai({ v }: PropsBagian) {
  return (
    <section id="mempelai" style={{ minHeight: "1180px", boxSizing: "border-box", padding: "76px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: "30px", textAlign: "center", position: "relative", overflow: "hidden", background: "linear-gradient(180deg, transparent, rgba(13,21,41,0.5) 50%, transparent)" }}>
      <p className="mata" data-anim="naik">
        Mempelai
      </p>
      <h2 className="judul" data-anim="naik" style={{ "--d": ".1s", marginTop: "-14px" } as CSSProperties}>
        Kedua mempelai
      </h2>
      <div data-anim="kiri" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
        <div style={{ position: "relative", padding: "8px", borderRadius: "50%", background: "#F7F2E6", boxShadow: "0 0 0 1px #C9AD72, 0 20px 40px rgba(0,0,0,0.4)" }}>
          <div className="foto" style={{ width: "210px", height: "280px", borderRadius: "50%", background: "radial-gradient(ellipse at 40% 30%, #3A4C7E, #1B2747)", border: "1px solid #C9AD72", boxSizing: "border-box", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "6px", color: "#CFC6B1" }}>
            {v.fotoPria ? (
              <Image src={v.fotoPria} alt={v.altPria} fill sizes="240px" style={{ objectFit: "cover" }} />
            ) : (
              <span aria-hidden="true" style={{ fontFamily: "'Marcellus', serif", fontSize: "88px", lineHeight: "1", opacity: "0.8" }}>
                {v.inisialPria}
              </span>
            )}
          </div>
          <svg className="goyang" style={{ position: "absolute", left: "-18px", bottom: "-6px", width: "70px", height: "70px" }} aria-hidden="true">
            <use href="#b-tangkai" />
          </svg>
        </div>
        <h3 style={{ margin: "18px 0 0", fontFamily: "'Marcellus', serif", fontWeight: "400", fontSize: "26px", letterSpacing: "0.06em" }}>
          {v.priaLengkap}
        </h3>
        <p className="miring" style={{ whiteSpace: "pre-line", margin: "0", fontSize: "17px", lineHeight: "1.5", color: "#CFC6B1" }}>
          {v.priaOrtu}
        </p>
      </div>
      <span data-anim="zoom" className="miring" style={{ fontSize: "54px", lineHeight: "0.8" }}>
        <span className="emas">
          &amp;
        </span>
      </span>
      <div data-anim="kanan" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
        <div style={{ position: "relative", padding: "8px", borderRadius: "50%", background: "#F7F2E6", boxShadow: "0 0 0 1px #C9AD72, 0 20px 40px rgba(0,0,0,0.4)" }}>
          <div className="foto" style={{ width: "210px", height: "280px", borderRadius: "50%", background: "radial-gradient(ellipse at 40% 30%, #5B5A86, #26284F)", border: "1px solid #C9AD72", boxSizing: "border-box", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "6px", color: "#CFC6B1" }}>
            {v.fotoWanita ? (
              <Image src={v.fotoWanita} alt={v.altWanita} fill sizes="240px" style={{ objectFit: "cover" }} />
            ) : (
              <span aria-hidden="true" style={{ fontFamily: "'Marcellus', serif", fontSize: "88px", lineHeight: "1", opacity: "0.8" }}>
                {v.inisialWanita}
              </span>
            )}
          </div>
          <svg className="goyang" style={{ position: "absolute", right: "-18px", bottom: "-6px", width: "70px", height: "70px", animationDelay: "-3s" }} aria-hidden="true">
            <use href="#b-tangkai" />
          </svg>
        </div>
        <h3 style={{ margin: "18px 0 0", fontFamily: "'Marcellus', serif", fontWeight: "400", fontSize: "26px", letterSpacing: "0.06em" }}>
          {v.wanitaLengkap}
        </h3>
        <p className="miring" style={{ whiteSpace: "pre-line", margin: "0", fontSize: "17px", lineHeight: "1.5", color: "#CFC6B1" }}>
          {v.wanitaOrtu}
        </p>
      </div>
    </section>
  );
}

export function Hitung({ v, atas, bawah }: PropsBagian) {
  return (
    <section id="hitung" style={{ minHeight: "540px", boxSizing: "border-box", padding: "76px 22px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "22px", textAlign: "center", background: "#0D1529", position: "relative", overflow: "hidden" }}>
      <svg style={{ position: "absolute", top: "-1px", left: "0", width: "100%", height: "46px", color: atas, pointerEvents: "none" }} viewBox="0 0 430 60" preserveAspectRatio="none" aria-hidden="true">
        <use href="#b-awan" />
      </svg>
      <svg className="ayun" style={{ position: "absolute", top: "0", left: "4px", width: "28px", height: "230px", animationDelay: "-1s" }} aria-hidden="true">
        <use href="#b-willow" />
      </svg>
      <svg className="ayun" style={{ position: "absolute", top: "0", left: "30px", width: "24px", height: "150px", animationDelay: "-2.6s" }} aria-hidden="true">
        <use href="#b-willow" />
      </svg>
      <svg className="ayun" style={{ position: "absolute", top: "0", right: "30px", width: "24px", height: "160px", animationDelay: "-.4s" }} aria-hidden="true">
        <use href="#b-willow" />
      </svg>
      <svg className="ayun" style={{ position: "absolute", top: "0", right: "4px", width: "28px", height: "240px", animationDelay: "-3.4s" }} aria-hidden="true">
        <use href="#b-willow" />
      </svg>
      <svg style={{ position: "absolute", top: "-6px", left: "-10px", width: "170px", height: "47px" }} aria-hidden="true">
        <use href="#b-rimbun" />
      </svg>
      <svg style={{ position: "absolute", top: "-6px", right: "-10px", width: "170px", height: "47px", transform: "scaleX(-1)" }} aria-hidden="true">
        <use href="#b-rimbun" />
      </svg>
      <span className="meteor" style={{ top: "40px", right: "-60px", animationDelay: "-2s" }} />
      <p className="mata" data-anim="naik">
        Menghitung malam
      </p>
      <h2 className="judul" data-anim="naik" style={{ "--d": ".1s", fontSize: "26px" } as CSSProperties}>
        Menuju hari bahagia
      </h2>
      <div data-anim="zoom" style={{ "--d": ".2s", display: "grid", gridTemplateColumns: v.kolomHitung, gap: "10px", width: "100%", maxWidth: "330px" } as CSSProperties}>
        <div style={{ padding: "18px 0 12px", borderRadius: "999px 999px 12px 12px", border: "1px solid #C9AD72", background: "rgba(241,234,216,0.05)" }}>
          <div style={{ fontFamily: "'Marcellus', serif", fontSize: "30px", lineHeight: "1" }}>
            {v.hari}
          </div>
          <div style={{ fontSize: "10px", letterSpacing: "0.2em", marginTop: "6px", color: "#C9AD72" }}>
            HARI
          </div>
        </div>
        <div style={{ padding: "18px 0 12px", borderRadius: "999px 999px 12px 12px", border: "1px solid #C9AD72", background: "rgba(241,234,216,0.05)" }}>
          <div style={{ fontFamily: "'Marcellus', serif", fontSize: "30px", lineHeight: "1" }}>
            {v.jam}
          </div>
          <div style={{ fontSize: "10px", letterSpacing: "0.2em", marginTop: "6px", color: "#C9AD72" }}>
            JAM
          </div>
        </div>
        <div style={{ padding: "18px 0 12px", borderRadius: "999px 999px 12px 12px", border: "1px solid #C9AD72", background: "rgba(241,234,216,0.05)" }}>
          <div style={{ fontFamily: "'Marcellus', serif", fontSize: "30px", lineHeight: "1" }}>
            {v.menit}
          </div>
          <div style={{ fontSize: "10px", letterSpacing: "0.2em", marginTop: "6px", color: "#C9AD72" }}>
            MENIT
          </div>
        </div>
        {v.tampilDetik ? (
          <div style={{ padding: "18px 0 12px", borderRadius: "999px 999px 12px 12px", border: "1px solid #C9AD72", background: "rgba(241,234,216,0.05)" }}>
            <div style={{ fontFamily: "'Marcellus', serif", fontSize: "30px", lineHeight: "1" }}>
              {v.detik}
            </div>
            <div style={{ fontSize: "10px", letterSpacing: "0.2em", marginTop: "6px", color: "#C9AD72" }}>
              DETIK
            </div>
          </div>
        ) : null}
      </div>
      <p className="miring" data-anim="naik" style={{ "--d": ".3s", margin: "0", fontSize: "20px" } as CSSProperties}>
        {v.tglPanjang}
      </p>
      {v.kalender ? (
        <a href={v.kalender} download data-anim="naik" style={{ textDecoration: "none", "--d": ".4s", display: "inline-flex", alignItems: "center", minHeight: "46px", padding: "0 24px", borderRadius: "999px", border: "1px solid #F1EAD8", background: "transparent", color: "#F1EAD8", font: "400 12px 'Marcellus', serif", letterSpacing: "0.2em", cursor: "pointer" } as CSSProperties}>
          SIMPAN KE KALENDER
        </a>
      ) : null}
      <svg style={{ position: "absolute", bottom: "-1px", transform: "scaleY(-1)", left: "0", width: "100%", height: "46px", color: bawah, pointerEvents: "none" }} viewBox="0 0 430 60" preserveAspectRatio="none" aria-hidden="true">
        <use href="#b-awan" />
      </svg>
    </section>
  );
}

export function Acara({ v }: PropsBagian) {
  return (
    <section id="acara" style={{ minHeight: "1000px", boxSizing: "border-box", padding: "76px 22px", display: "flex", flexDirection: "column", alignItems: "center", gap: "26px", textAlign: "center", position: "relative" }}>
      <p className="mata" data-anim="naik">
        Waktu &amp; tempat
      </p>
      <h2 className="judul" data-anim="naik" style={{ "--d": ".1s", marginTop: "-14px" } as CSSProperties}>
        Rangkaian acara
      </h2>
      <div data-anim="naik" style={{ "--d": ".2s", width: "100%", display: "flex", flexDirection: "column", gap: "26px" } as CSSProperties}>
        {v.acara.map((a) => (
          <Fragment key={a.id}>
            <article className="kartu" style={{ padding: "80px 26px 34px", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
              <svg style={{ position: "absolute", top: "24px", left: "50%", marginLeft: "-22px", width: "44px", height: "44px" }} aria-hidden="true">
                <use href="#b-tangkai" />
              </svg>
              <h3 className="judul-gelap">
                {a.nama}
              </h3>
              <p className="miring" style={{ margin: "0", fontSize: "19px", color: "#2B3B66" }}>
                {a.tgl}
              </p>
              <p style={{ margin: "0", fontFamily: "'Marcellus', serif", fontSize: "15px", letterSpacing: "0.1em" }}>
                {a.jam}
              </p>
              <svg style={{ width: "140px", height: "14px", margin: "6px 0" }} aria-hidden="true">
                <use href="#b-pemisah" />
              </svg>
              <p style={{ margin: "0", fontSize: "18px", fontWeight: "500" }}>
                {a.tempat}
              </p>
              <p style={{ margin: "0", fontSize: "15px", lineHeight: "1.55", color: "#3A4664" }}>
                {a.alamat}
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "10px", marginTop: "12px" }}>
                {a.peta ? (
                  <a href={a.peta ?? undefined} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", minHeight: "44px", padding: "0 20px", borderRadius: "999px", background: "#1B2747", color: "#F1EAD8", textDecoration: "none", fontFamily: "'Marcellus', serif", fontSize: "11px", letterSpacing: "0.18em" }}>
                    BUKA PETA
                  </a>
                ) : null}
                {a.kalender ? (
                  <a href={a.kalender ?? undefined} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", minHeight: "44px", padding: "0 20px", borderRadius: "999px", border: "1px solid #1B2747", background: "transparent", color: "#1B2747", font: "400 11px 'Marcellus', serif", letterSpacing: "0.18em", cursor: "pointer" }}>
                    + KALENDER
                  </a>
                ) : null}
              </div>
            </article>
          </Fragment>
        ))}
      </div>
    </section>
  );
}

export function Cerita({ v }: PropsBagian) {
  return (
    <section id="cerita" style={{ minHeight: "820px", boxSizing: "border-box", padding: "76px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: "26px", textAlign: "center", background: "linear-gradient(180deg, rgba(13,21,41,0) 0%, rgba(13,21,41,0.55) 18%, rgba(13,21,41,0.55) 82%, rgba(13,21,41,0) 100%)" }}>
      <p className="mata" data-anim="naik">
        Cerita kami
      </p>
      <h2 className="judul" data-anim="naik" style={{ "--d": ".1s", marginTop: "-14px" } as CSSProperties}>
        Perjalanan cinta
      </h2>
      <div style={{ position: "relative", width: "100%", display: "flex", flexDirection: "column", gap: "22px", textAlign: "left" }}>
        {v.cerita.map((c) => (
          <div key={c.kunci} data-anim="naik" style={{ "--d": c.tunda, position: "relative", paddingLeft: "46px" } as CSSProperties}>
            {c.akhir ? null : (
              <span data-anim="garis" style={{ "--d": c.tundaGaris, position: "absolute", left: "15px", top: "34px", bottom: "-56px", width: "2px", background: "#C9AD72" } as CSSProperties} aria-hidden="true" />
            )}
            <span style={{ position: "absolute", left: "4px", top: "22px", width: "24px", height: "24px", boxSizing: "border-box", borderRadius: "50%", background: "#121C36", border: "2px solid #C9AD72", display: "flex", alignItems: "center", justifyContent: "center" }} aria-hidden="true">
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#C9AD72" }} />
            </span>
            <div className="kartu-kotak" style={{ padding: "22px 20px", display: "flex", flexDirection: "column", gap: "6px" }}>
              <p className="mata" style={{ color: "#8E7A4A" }}>
                {c.tahun}
              </p>
              <h3 style={{ margin: "0", fontFamily: "'Marcellus', serif", fontWeight: "400", fontSize: "20px", letterSpacing: "0.04em" }}>
                {c.judul}
              </h3>
              <p style={{ whiteSpace: "pre-line", margin: "0", fontSize: "15px", lineHeight: "1.65", color: "#3A4664" }}>
                {c.teks}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function Galeri({ v }: PropsBagian) {
  return (
    <section id="galeri" style={{ minHeight: "780px", boxSizing: "border-box", padding: "76px 18px", display: "flex", flexDirection: "column", alignItems: "center", gap: "24px", textAlign: "center" }}>
      <p className="mata" data-anim="naik">
        Galeri
      </p>
      <h2 className="judul" data-anim="naik" style={{ "--d": ".1s", marginTop: "-14px" } as CSSProperties}>
        Momen kami
      </h2>
      <div data-anim="zoom" style={{ "--d": ".15s", display: "flex", alignItems: "flex-start", gap: "12px", width: "100%" } as CSSProperties}>
        {v.lajurGaleri.map((lajur, n) => (
          <div key={n} style={{ flex: "1 1 0", minWidth: "0", display: "flex", flexDirection: "column", gap: "12px" }}>
            {lajur.map((g) => (
              <button key={g.id} type="button" className="foto" onClick={g.buka} aria-label={`Lihat ${g.label}`} style={{ display: "block", width: "100%", aspectRatio: g.rasio, border: "1px solid #C9AD72", padding: "0", borderRadius: "14px", background: g.warna, cursor: "zoom-in" }}>
                {g.src ? <Image src={g.src} alt="" fill sizes={g.sizes} style={{ objectFit: "contain" }} /> : null}
              </button>
            ))}
          </div>
        ))}
      </div>
      <p className="miring" style={{ margin: "0", fontSize: "15px", color: "#CFC6B1" }}>
        Ketuk foto untuk memperbesar
      </p>
    </section>
  );
}

export function Rsvp({ v }: PropsBagian) {
  return (
    <section id="rsvp" style={{ minHeight: "1180px", boxSizing: "border-box", padding: "76px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: "20px", textAlign: "center", position: "relative", overflow: "hidden", background: "linear-gradient(180deg, rgba(13,21,41,0) 0%, #0D1529 14%, #0D1529 86%, rgba(13,21,41,0) 100%)" }}>
      <span className="kunang" style={{ top: "120px", left: "40px" }} />
      <span className="kunang" style={{ top: "180px", left: "340px", animationDelay: "-3s" }} />
      <p className="mata" data-anim="naik">
        Konfirmasi kehadiran
      </p>
      <h2 className="judul" data-anim="naik" style={{ "--d": ".1s", marginTop: "-14px" } as CSSProperties}>
        RSVP
      </h2>
      <p className="miring" data-anim="naik" style={{ "--d": ".15s", margin: "0", fontSize: "17px", lineHeight: "1.5", color: "#CFC6B1" } as CSSProperties}>
        {v.teksBatas}
      </p>
      <div className="kartu-kotak" data-anim="naik" style={{ "--d": ".2s", width: "100%", boxSizing: "border-box", padding: "30px 20px", textAlign: "left" } as CSSProperties}>
        {v.showForm ? (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
              <div style={{ textAlign: "center" }}>
                <p className="mata" style={{ color: "#8E7A4A", letterSpacing: "0.22em" }}>
                  Undangan untuk
                </p>
                <p style={{ margin: "6px 0 0", fontFamily: "'Marcellus', serif", fontSize: "20px" }}>
                  {v.namaTamu}
                </p>
                <p style={{ margin: "6px 0 0", fontSize: "13px", lineHeight: "1.5", color: "#3A4664" }}>
                  {v.keteranganMaks}
                </p>
              </div>
              {v.rsvpAcara.map((r) => (
                <Fragment key={r.id}>
                  <fieldset style={{ margin: "0", padding: "16px", border: "1px solid #DCCFB0", borderRadius: "16px", display: "flex", flexDirection: "column", gap: "12px", background: "#FBF8F0" }}>
                    <legend style={{ padding: "0 8px", fontFamily: "'Marcellus', serif", fontSize: "16px", letterSpacing: "0.06em" }}>
                      {r.nama}
                    </legend>
                    <p style={{ margin: "-6px 0 0", fontSize: "13px", color: "#3A4664" }}>
                      {r.tgl} · {r.jam}
                    </p>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "8px" }}>
                      <button type="button" onClick={r.pilihYa} aria-pressed={r.ya} style={{ minHeight: "46px", borderRadius: "999px", border: `1.5px solid ${r.yaBd}`, background: r.yaBg, color: r.yaFg, font: "500 14px 'EB Garamond', serif", cursor: "pointer" }}>
                        Ya, akan hadir
                      </button>
                      <button type="button" onClick={r.pilihTidak} aria-pressed={r.tidak} style={{ minHeight: "46px", borderRadius: "999px", border: `1.5px solid ${r.tdBd}`, background: r.tdBg, color: r.tdFg, font: "500 14px 'EB Garamond', serif", cursor: "pointer" }}>
                        Tidak hadir
                      </button>
                    </div>
                    {r.tampilJumlah ? (
                      <>
                        <div className="masuk" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px", padding: "6px 6px 6px 16px", borderRadius: "999px", background: "#EFE8D6" }}>
                            <span style={{ display: "flex", flexDirection: "column", gap: "2px", textAlign: "left" }}>
                              <span style={{ fontSize: "14px" }}>
                                Dewasa
                              </span>
                              <span style={{ fontSize: "11px", opacity: "0.7" }}>
                                Maks. {r.maksD}
                              </span>
                            </span>
                            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                              <button type="button" onClick={r.kurangD} aria-label={`Kurangi dewasa ${r.nama}`} style={{ width: "32px", height: "32px", borderRadius: "50%", border: "1px solid #1B2747", background: "#FFFFFF", color: "#1B2747", cursor: "pointer", opacity: r.dMinOp }}>
                                −
                              </button>
                              <span style={{ minWidth: "18px", textAlign: "center", fontWeight: "500" }}>
                                {r.dewasa}
                              </span>
                              <button type="button" onClick={r.tambahD} aria-label={`Tambah dewasa ${r.nama}`} style={{ width: "32px", height: "32px", borderRadius: "50%", border: "1px solid #1B2747", background: "#FFFFFF", color: "#1B2747", cursor: "pointer", opacity: r.dMaxOp }}>
                                +
                              </button>
                            </span>
                          </div>
                          {r.showAnak ? (
                            <>
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px", padding: "6px 6px 6px 16px", borderRadius: "999px", background: "#EFE8D6" }}>
                                <span style={{ display: "flex", flexDirection: "column", gap: "2px", textAlign: "left" }}>
                                  <span style={{ fontSize: "14px" }}>
                                    Anak
                                  </span>
                                  <span style={{ fontSize: "11px", opacity: "0.7" }}>
                                    Maks. {r.maksA}
                                  </span>
                                </span>
                                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                  <button type="button" onClick={r.kurangA} aria-label={`Kurangi anak ${r.nama}`} style={{ width: "32px", height: "32px", borderRadius: "50%", border: "1px solid #1B2747", background: "#FFFFFF", color: "#1B2747", cursor: "pointer", opacity: r.aMinOp }}>
                                    −
                                  </button>
                                  <span style={{ minWidth: "18px", textAlign: "center", fontWeight: "500" }}>
                                    {r.anak}
                                  </span>
                                  <button type="button" onClick={r.tambahA} aria-label={`Tambah anak ${r.nama}`} style={{ width: "32px", height: "32px", borderRadius: "50%", border: "1px solid #1B2747", background: "#FFFFFF", color: "#1B2747", cursor: "pointer", opacity: r.aMaxOp }}>
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
              <button type="button" onClick={v.kirimRsvp} disabled={v.kirimNonaktif} style={{ minHeight: "52px", borderRadius: "999px", border: "0", background: "#1B2747", color: "#F1EAD8", font: "400 12px 'Marcellus', serif", letterSpacing: "0.24em", cursor: "pointer", opacity: v.kirimOpacity }}>
                KIRIM KONFIRMASI
              </button>
            </div>
          </>
        ) : null}
        {v.showTerima ? (
          <>
            <div className="masuk" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", textAlign: "center", padding: "10px 0" }}>
              <svg width="56" height="56" aria-hidden="true">
                <use href="#b-tangkai" />
              </svg>
              <h3 className="judul-gelap">
                Terima kasih
              </h3>
              <p style={{ margin: "0", fontSize: "16px", lineHeight: "1.6" }}>
                {v.ringkasan}
              </p>
              <p className="miring" style={{ margin: "0", fontSize: "15px", color: "#3A4664" }}>
                {v.teksUbah}
              </p>
              {v.bisaUbah ? (
                <button type="button" onClick={v.ubahRsvp} style={{ minHeight: "44px", padding: "0 20px", borderRadius: "999px", border: "1px solid #1B2747", background: "transparent", color: "#1B2747", font: "500 14px 'EB Garamond', serif", cursor: "pointer" }}>
                  Ubah jawaban
                </button>
              ) : null}
              {v.qrTampil ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", marginTop: "6px" }}>
                  <Image src={v.qrTampil} alt="Kode QR check-in" width={168} height={168} unoptimized style={{ borderRadius: "12px", background: "#FFFFFF", padding: "8px", boxSizing: "content-box" }} />
                  <p style={{ margin: "0", fontSize: "15px", color: "#3A4664", textAlign: "center" }}>
                    Tunjukkan kode ini kepada penerima tamu di lokasi acara.
                  </p>
                </div>
              ) : null}
            </div>
          </>
        ) : null}
        {v.showTutup ? (
          <p style={{ margin: "0", fontSize: "15px", color: "#3A4664", textAlign: "center", padding: "10px 0" }}>
            Formulir konfirmasi sudah ditutup. Hubungi mempelai bila rencana Anda berubah.
          </p>
        ) : null}
        {v.pesanRsvp ? (
          <p role="status" style={{ margin: "0", fontSize: "15px", color: "#3A4664", textAlign: "center", marginTop: "14px" }}>
            {v.pesanRsvp}
          </p>
        ) : null}
      </div>
    </section>
  );
}

export function Ucapan({ v, atas, bawah }: PropsBagian) {
  return (
    <section id="ucapan" style={{ position: "relative", minHeight: "1120px", boxSizing: "border-box", padding: "76px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: "20px", textAlign: "center", background: "#F1EAD8", color: "#1B2747" }}>
      <svg style={{ position: "absolute", top: "-1px", left: "0", width: "100%", height: "46px", color: atas, pointerEvents: "none" }} viewBox="0 0 430 60" preserveAspectRatio="none" aria-hidden="true">
        <use href="#b-awan" />
      </svg>
      <p className="mata" data-anim="naik" style={{ color: "#8E7A4A" }}>
        Ucapan &amp; doa
      </p>
      <h2 className="judul-gelap" data-anim="naik" style={{ "--d": ".1s", marginTop: "-14px" } as CSSProperties}>
        Kirim ucapan
      </h2>
      <div data-anim="naik" style={{ "--d": ".2s", width: "100%", boxSizing: "border-box", padding: "22px 18px", borderRadius: "20px", background: "#1B2747", color: "#F1EAD8", display: "flex", flexDirection: "column", gap: "12px", textAlign: "left", boxShadow: "0 0 0 1px #C9AD72" } as CSSProperties}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ width: "38px", height: "38px", borderRadius: "50%", background: "#F1EAD8", color: "#1B2747", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Marcellus', serif", fontSize: "17px" }} aria-hidden="true">
            {v.inisialTamu}
          </span>
          <span style={{ fontSize: "16px" }}>
            {v.namaTamu}
          </span>
        </div>
        <label style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "14px" }}>
          Ucapan dan doa
          <textarea rows={3} value={v.teksUcapan} onChange={v.ketikUcapan} maxLength={v.maksUcapan} placeholder="Tuliskan ucapan & doa Anda" style={{ font: "400 15px/1.5 'EB Garamond', serif", padding: "12px", borderRadius: "12px", border: "1px solid rgba(201,173,114,0.6)", background: "#121C36", color: "#F1EAD8", resize: "vertical" }} />
        </label>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
          <span style={{ fontSize: "13px", color: "#A9B0C6" }}>
            {v.sisaKarakter} karakter tersisa
          </span>
          <button type="button" onClick={v.kirimUcapan} disabled={v.ucapanNonaktif} style={{ minHeight: "44px", padding: "0 20px", borderRadius: "999px", border: "0", background: "#F1EAD8", color: "#1B2747", font: "400 11px 'Marcellus', serif", letterSpacing: "0.2em", cursor: "pointer", opacity: v.ucapanOpacity }}>
            KIRIM UCAPAN
          </button>
        </div>
        {v.pesanUcapan ? (
          <p role="status" style={{ fontSize: "13px", color: "#A9B0C6", margin: "0" }}>
            {v.pesanUcapan}
          </p>
        ) : null}
      </div>
      <div data-anim="naik" style={{ "--d": ".25s", width: "100%", display: "flex", flexDirection: "column", gap: "12px" } as CSSProperties}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span style={{ fontFamily: "'Marcellus', serif", fontSize: "17px" }}>
            {v.jumlahUcapan} ucapan
          </span>
          <span style={{ fontSize: "13px", color: "#3A4664" }}>
            Halaman {v.halamanKe} dari {v.totalHalaman}
          </span>
        </div>
        <ul style={{ listStyle: "none", margin: "0", padding: "4px 6px 4px 0", maxHeight: "470px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px", textAlign: "left" }}>
          {v.adaUcapan ? null : (
            <li style={{ padding: "14px 16px", borderRadius: "16px", background: "#FBF8F0", border: "1px solid #DCCFB0", display: "flex", flexDirection: "column", gap: "6px" }}>
              <p style={{ margin: "0", fontSize: "15px", lineHeight: "1.6", color: "#2B3B66", textAlign: "center" }}>
                Belum ada ucapan. Jadilah yang pertama mendoakan {v.pasangan}.
              </p>
            </li>
          )}
          {v.ucapan.map((u) => (
            <Fragment key={u.id}>
              <li className="masuk" style={{ padding: "14px 16px", borderRadius: "16px", background: "#FBF8F0", border: "1px solid #DCCFB0", display: "flex", flexDirection: "column", gap: "6px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ width: "34px", height: "34px", borderRadius: "50%", background: u.avatar, color: "#F1EAD8", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Marcellus', serif", flexShrink: "0" }} aria-hidden="true">
                    {u.inisial}
                  </span>
                  <div style={{ flex: "1", minWidth: "0" }}>
                    <p style={{ margin: "0", fontWeight: "500", fontSize: "15px" }}>
                      {u.nama}
                    </p>
                    <p style={{ margin: "0", fontSize: "12px", color: "#5A6480" }}>
                      {u.waktu}
                    </p>
                  </div>
                  <span style={{ padding: "3px 9px", borderRadius: "999px", background: u.badgeBg, color: u.badgeFg, fontSize: "12px", whiteSpace: "nowrap" }}>
                    {u.badge}
                  </span>
                </div>
                <p style={{ margin: "0", fontSize: "15px", lineHeight: "1.6", color: "#2B3B66" }}>
                  {u.teks}
                </p>
              </li>
            </Fragment>
          ))}
        </ul>
        <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
          <button type="button" onClick={v.halSebelum} disabled={v.sebelumNonaktif} style={{ minHeight: "40px", padding: "0 16px", borderRadius: "999px", border: "1px solid #1B2747", background: "transparent", color: "#1B2747", font: "500 14px 'EB Garamond', serif", cursor: "pointer", opacity: v.sebelumOp }}>
            Sebelumnya
          </button>
          <button type="button" onClick={v.halBerikut} disabled={v.berikutNonaktif} style={{ minHeight: "40px", padding: "0 16px", borderRadius: "999px", border: "1px solid #1B2747", background: "transparent", color: "#1B2747", font: "500 14px 'EB Garamond', serif", cursor: "pointer", opacity: v.berikutOp }}>
            Berikutnya
          </button>
        </div>
      </div>
      <svg style={{ position: "absolute", bottom: "-1px", transform: "scaleY(-1)", left: "0", width: "100%", height: "46px", color: bawah, pointerEvents: "none" }} viewBox="0 0 430 60" preserveAspectRatio="none" aria-hidden="true">
        <use href="#b-awan" />
      </svg>
    </section>
  );
}

export function Amplop({ v }: PropsBagian) {
  return (
    <section id="amplop" style={{ minHeight: "640px", boxSizing: "border-box", padding: "76px 22px", display: "flex", flexDirection: "column", alignItems: "center", gap: "18px", textAlign: "center", position: "relative", overflow: "hidden" }}>
      <span className="bintang" style={{ top: "80px", left: "40px", width: "2px", height: "2px" }} />
      <span className="bintang" style={{ top: "140px", left: "350px", width: "3px", height: "3px", animationDelay: "-1.5s" }} />
      <p className="mata" data-anim="naik">
        Tanda kasih
      </p>
      <h2 className="judul" data-anim="naik" style={{ "--d": ".1s", marginTop: "-14px" } as CSSProperties}>
        Amplop digital
      </h2>
      <p className="miring" data-anim="naik" style={{ "--d": ".15s", margin: "0", fontSize: "17px", lineHeight: "1.6", color: "#CFC6B1" } as CSSProperties}>
        Doa restu Anda adalah hadiah terindah. Jika ingin memberi tanda kasih, dapat melalui:
      </p>
      {v.rekening.map((r) => (
        <div key={r.kunci} className="kartu-kotak" data-anim={r.arah} style={{ "--d": r.tunda, width: "100%", boxSizing: "border-box", padding: "26px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" } as CSSProperties}>
          <span className="mata" style={{ color: "#8E7A4A" }}>
            {r.bank}
          </span>
          <span style={{ fontFamily: "'Marcellus', serif", fontSize: "24px", letterSpacing: "0.08em" }}>
            {r.nomor}
          </span>
          {r.atasNama ? (
            <span className="miring" style={{ fontSize: "16px" }}>
              a.n. {r.atasNama}
            </span>
          ) : null}
          <button type="button" onClick={r.salin} style={{ marginTop: "10px", minHeight: "40px", padding: "0 18px", borderRadius: "999px", border: "1px solid #1B2747", background: "transparent", color: "#1B2747", font: "400 11px 'Marcellus', serif", letterSpacing: "0.18em", cursor: "pointer" }}>
            {r.label}
          </button>
        </div>
      ))}
      {v.qris ? (
        <div className="kartu-kotak" data-anim="naik" style={{ "--d": ".4s", width: "100%", boxSizing: "border-box", padding: "26px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" } as CSSProperties}>
          <span className="mata" style={{ color: "#8E7A4A" }}>
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
    <section id="penutup" style={{ minHeight: "720px", boxSizing: "border-box", padding: "100px 30px 180px", display: "flex", flexDirection: "column", alignItems: "center", gap: "18px", textAlign: "center", position: "relative", overflow: "hidden", background: "linear-gradient(180deg, transparent, #0D1529)" }}>
      <div data-anim="naik" style={{ position: "relative", width: "90px", height: "90px" }} aria-hidden="true">
        <div className="bulan" style={{ width: "90px", height: "90px", borderRadius: "50%", background: "radial-gradient(circle at 38% 36%, #FFF8E6 0%, #F1EAD8 55%, #D5CBB0 100%)" }} />
        <div style={{ position: "absolute", top: "-6px", left: "24px", width: "84px", height: "84px", borderRadius: "50%", background: "#18233F" }} />
      </div>
      <p className="miring" data-anim="naik" style={{ whiteSpace: "pre-line", "--d": ".1s", margin: "6px 0 0", fontSize: "19px", lineHeight: "1.6", color: "#E3DAC4" } as CSSProperties}>
        {v.penutup}
      </p>
      <h2 className="judul" data-anim="zoom" style={{ "--d": ".2s", fontSize: "30px" } as CSSProperties}>
        Terima kasih
      </h2>
      <p data-anim="naik" style={{ "--d": ".3s", margin: "0", fontFamily: "'Marcellus', serif", fontSize: "18px", letterSpacing: "0.16em" } as CSSProperties}>
        <span className="emas">
          {v.pasanganBesar}
        </span>
      </p>
      <svg style={{ position: "absolute", left: "0", right: "0", bottom: "0", width: "100%", height: "90px" }} viewBox="0 0 430 90" preserveAspectRatio="none" aria-hidden="true">
        <use href="#b-semak" />
      </svg>
      <svg className="goyang" style={{ position: "absolute", left: "-18px", bottom: "10px", width: "112px", height: "154px", transformOrigin: "50% 100%" }} aria-hidden="true">
        <use href="#b-guci" />
      </svg>
      <svg className="goyang" style={{ position: "absolute", right: "-18px", bottom: "10px", width: "112px", height: "154px", transformOrigin: "50% 100%", animationDelay: "-3s" }} aria-hidden="true">
        <use href="#b-guci" />
      </svg>
      <span className="kunang" style={{ bottom: "140px", left: "140px" }} />
      <span className="kunang" style={{ bottom: "170px", left: "260px", animationDelay: "-2.5s" }} />
    </section>
  );
}

export function Progres() {
  return (
    <div style={{ position: "fixed", top: "0", left: "0", zIndex: "30", height: "3px", width: "calc(var(--progres, 0) * 100%)", background: "linear-gradient(90deg, #9AA46F, #F1EAD8)" }} aria-hidden="true" />
  );
}

export function Lightbox({ v }: { v: Vals }) {
  return v.fotoBuka ? (
      <>
        <div role="dialog" aria-modal="true" aria-label="Foto galeri" style={{ position: "fixed", inset: "0", zIndex: "40", background: "rgba(6,10,22,0.92)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px", padding: "20px" }}>
          <div className="masuk foto" style={{ width: "min(360px, 88vw)", height: "min(480px, 70vh)", borderRadius: "180px 180px 18px 18px", border: "1px solid #C9AD72", background: v.fotoWarna }}>
            {v.fotoSrc ? <Image key={v.fotoSrc} src={v.fotoSrc} alt={v.fotoLabel} fill sizes="(max-width: 430px) 88vw, 360px" style={{ objectFit: "contain" }} /> : null}
          </div>
          <p className="miring" style={{ margin: "0", color: "#F1EAD8", fontSize: "17px" }}>
            {v.fotoLabel}
          </p>
          <div style={{ display: "flex", gap: "10px" }}>
            <button type="button" onClick={v.fotoSebelum} aria-label="Foto sebelumnya" style={{ width: "46px", height: "46px", borderRadius: "50%", border: "1px solid #C9AD72", background: "transparent", color: "#F1EAD8", fontSize: "20px", cursor: "pointer" }}>
              ‹
            </button>
            <button type="button" onClick={v.fotoTutup} data-tutup-foto style={{ minHeight: "46px", padding: "0 20px", borderRadius: "999px", border: "0", background: "#F1EAD8", color: "#1B2747", font: "400 12px 'Marcellus', serif", letterSpacing: "0.18em", cursor: "pointer" }}>
              TUTUP
            </button>
            <button type="button" onClick={v.fotoBerikut} aria-label="Foto berikutnya" style={{ width: "46px", height: "46px", borderRadius: "50%", border: "1px solid #C9AD72", background: "transparent", color: "#F1EAD8", fontSize: "20px", cursor: "pointer" }}>
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
    <button type="button" onClick={v.toggleMusik} aria-label={v.musikLabel} style={{ position: "fixed", right: "16px", bottom: "20px", zIndex: "35", width: "50px", height: "50px", borderRadius: "50%", border: "2px solid #C9AD72", background: "#F1EAD8", color: "#1B2747", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 22px rgba(241,234,216,0.35)", cursor: "pointer", padding: "0" }}>
      {v.musikMain ? (
        <>
          <svg className="cakram" width="30" height="30" viewBox="0 0 30 30" aria-hidden="true">
            <circle cx="15" cy="15" r="14" fill="#121C36" />
            <circle cx="15" cy="15" r="10" fill="none" stroke="#3A4C7E" strokeWidth="0.8" />
            <circle cx="15" cy="15" r="6.5" fill="none" stroke="#3A4C7E" strokeWidth="0.8" />
            <circle cx="15" cy="15" r="3.5" fill="#C9AD72" />
            <circle cx="15" cy="15" r="1" fill="#121C36" />
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
