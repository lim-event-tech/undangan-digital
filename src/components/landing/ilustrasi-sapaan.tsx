"use client";

import type { CSSProperties } from "react";
import { useEffect, useState } from "react";

const TAMU = ["Ibu Sari & Keluarga", "Bapak Hendra Wijaya", "Kak Dimas Aditya", "Mbak Ayu & Keluarga"];

const naskah: CSSProperties = { fontFamily: "'Pinyon Script', cursive", fontSize: "46px", lineHeight: 1 };

export function IlustrasiSapaan() {
  const [i, setI] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setI((n) => (n + 1) % TAMU.length), 2200);
    return () => window.clearInterval(timer);
  }, []);

  const namaTamu = TAMU[i];

  return (
    <div style={{ position: "relative", width: "min(100%, 420px)", height: "560px" }} aria-hidden="true">
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "10px",
          width: "256px",
          marginLeft: "-128px",
          height: "520px",
          border: "1px solid #2A2622",
          borderRadius: "38px",
          padding: "9px",
          background: "#2A2622",
          boxShadow: "0 18px 40px -22px rgba(42,38,34,.32)",
        }}
      >
        <div
          style={{
            height: "100%",
            borderRadius: "29px",
            overflow: "hidden",
            background: "radial-gradient(120% 80% at 50% 12%, #FBF8F0, #E3DDCB)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            color: "#2E3B2A",
            textAlign: "center",
            padding: "20px",
          }}
        >
          <span style={{ font: "500 9px 'Jost', sans-serif", letterSpacing: ".3em" }}>THE WEDDING OF</span>
          <span style={naskah}>Raka</span>
          <span style={{ ...naskah, fontSize: "26px", color: "#B89A5E" }}>&amp;</span>
          <span style={naskah}>Nadia</span>
          <span style={{ font: "400 11px 'Jost', sans-serif", letterSpacing: ".14em" }}>12 · 12 · 2026</span>
          <span style={{ marginTop: "14px", font: "400 11px 'Jost', sans-serif" }}>Kepada Yth.</span>
          <span key={i} className="muncul" style={{ font: "600 15px 'Jost', sans-serif" }}>
            {namaTamu}
          </span>
          <span
            style={{
              marginTop: "6px",
              padding: "8px 16px",
              borderRadius: "999px",
              background: "#3E5239",
              color: "#FBF8F1",
              font: "500 10px 'Jost', sans-serif",
              letterSpacing: ".16em",
            }}
          >
            BUKA UNDANGAN
          </span>
        </div>
      </div>
      <div
        className="stiker"
        style={
          {
            "--d": ".3s",
            position: "absolute",
            top: "74px",
            left: 0,
            padding: "10px 12px",
            background: "#FFFFFF",
            textTransform: "none",
            letterSpacing: 0,
            fontSize: "13px",
            flexDirection: "column",
            alignItems: "flex-start",
            gap: "2px",
            borderRadius: "14px 14px 14px 4px",
          } as CSSProperties
        }
      >
        <span style={{ fontSize: "11px", color: "#6A6157" }}>WhatsApp · baru saja</span>
        <span>Kepada Yth. {namaTamu}</span>
      </div>
      <div
        className="stiker"
        style={
          {
            "--d": ".55s",
            position: "absolute",
            bottom: "70px",
            right: 0,
            padding: "10px 12px",
            background: "#EFE4CC",
            flexDirection: "column",
            alignItems: "flex-start",
            gap: "2px",
          } as CSSProperties
        }
      >
        <span style={{ fontSize: "11px" }}>RSVP masuk</span>
        <span style={{ fontSize: "15px" }}>2 dewasa · 1 anak</span>
      </div>
      <div
        className="stiker"
        style={
          { "--d": ".8s", position: "absolute", bottom: "14px", left: "18px", background: "#7D5F28", color: "#FFFFFF" } as CSSProperties
        }
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12.5l4.5 4.5L19 7" />
        </svg>
        Terkirim
      </div>
      <span className="melayang" style={{ position: "absolute", top: 0, right: "24px" }}>
        <svg width="64" height="64" viewBox="0 0 60 60" fill="none" stroke="#B08D4C" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
          <path d="M30 57V9" />
          <path d="M30 46c-7-2-12-7-14-14 7 1 12 6 14 14z" />
          <path d="M30 46c7-2 12-7 14-14-7 1-12 6-14 14z" />
          <path d="M30 31c-6-2-10-7-11-13 6 1 10 6 11 13z" />
          <path d="M30 31c6-2 10-7 11-13-6 1-10 6-11 13z" />
          <circle cx="30" cy="7" r="2.2" />
        </svg>
      </span>
      <span className="melayang" style={{ "--d": "-1.5s", position: "absolute", top: "300px", left: "-6px" } as CSSProperties}>
        <svg width="48" height="48" viewBox="0 0 60 60" fill="none" stroke="#B08D4C" strokeWidth="1">
          {[0, 60, 120, 180, 240, 300].map((sudut) => (
            <ellipse key={sudut} cx="30" cy="16" rx="6.5" ry="11" transform={`rotate(${sudut} 30 30)`} />
          ))}
          <circle cx="30" cy="30" r="4.5" />
          <circle cx="30" cy="30" r="1.4" fill="#B08D4C" stroke="none" />
        </svg>
      </span>
    </div>
  );
}
