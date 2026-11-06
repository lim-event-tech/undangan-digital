"use client";

import { useCallback, useEffect, useRef } from "react";

export function useGulirHalus() {
  const frame = useRef(0);
  const bersihkan = useRef<() => void>(() => {});
  useEffect(() => () => { cancelAnimationFrame(frame.current); bersihkan.current(); }, []);
  return useCallback((id: string, dariAwal: boolean) => {
    cancelAnimationFrame(frame.current);
    bersihkan.current();
    frame.current = requestAnimationFrame(() => {
      frame.current = requestAnimationFrame(() => {
        const tujuan = document.getElementById(id);
        if (!tujuan) return;
        const halaman = tujuan.closest<HTMLElement>(".undangan-template");
        const awal = dariAwal ? 0 : window.scrollY;
        window.scrollTo({ top: awal, behavior: "instant" });
        const akhir = Math.max(0, Math.min(tujuan.getBoundingClientRect().top + window.scrollY, document.documentElement.scrollHeight - window.innerHeight));
        let sebelumnya = 0;
        let berlalu = 0;
        const durasi = Math.min(1400, Math.max(1000, Math.abs(akhir - awal) * .75));
        const henti = () => { cancelAnimationFrame(frame.current); bersihkan.current(); };
        bersihkan.current = () => {
          window.removeEventListener("wheel", henti);
          window.removeEventListener("touchstart", henti);
          window.removeEventListener("keydown", henti);
          halaman?.removeAttribute("data-membuka");
        };
        window.addEventListener("wheel", henti, { passive: true });
        window.addEventListener("touchstart", henti, { passive: true });
        window.addEventListener("keydown", henti);
        halaman?.setAttribute("data-membuka", "true");
        const langkah = (waktu: number) => {
          if (sebelumnya) berlalu += Math.min(64, waktu - sebelumnya);
          sebelumnya = waktu;
          const kemajuan = Math.min(1, berlalu / durasi);
          const halus = .5 - Math.cos(kemajuan * Math.PI) / 2;
          window.scrollTo({ top: awal + (akhir - awal) * halus, behavior: "instant" });
          if (kemajuan < 1) frame.current = requestAnimationFrame(langkah);
          else bersihkan.current();
        };
        frame.current = requestAnimationFrame(langkah);
      });
    });
  }, []);
}
