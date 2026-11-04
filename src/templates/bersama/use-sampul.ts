"use client";

import { useEffect, type RefObject } from "react";

export function useSampul(akar: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const sampul = akar.current?.querySelector<HTMLElement>(".sampul-undangan");
    const konten = sampul?.querySelector<HTMLElement>(".sampul-konten");
    if (!sampul || !konten) return;

    const sesuaikan = () => {
      const tinggi = window.visualViewport?.height ?? window.innerHeight;
      sampul.style.setProperty("--tinggi-sampul", `${tinggi}px`);
      const gaya = getComputedStyle(sampul);
      const ruangTinggi = sampul.clientHeight - parseFloat(gaya.paddingTop) - parseFloat(gaya.paddingBottom);
      const ruangLebar = sampul.clientWidth - parseFloat(gaya.paddingLeft) - parseFloat(gaya.paddingRight);
      const skala = Math.max(0, Math.min(1, ruangTinggi / Math.max(1, konten.offsetHeight), ruangLebar / Math.max(1, konten.scrollWidth)));
      konten.style.setProperty("--skala-sampul", String(skala));
    };

    const pengamat = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(sesuaikan);
    pengamat?.observe(sampul);
    pengamat?.observe(konten);
    window.addEventListener("resize", sesuaikan);
    window.visualViewport?.addEventListener("resize", sesuaikan);
    sesuaikan();

    return () => {
      pengamat?.disconnect();
      window.removeEventListener("resize", sesuaikan);
      window.visualViewport?.removeEventListener("resize", sesuaikan);
      sampul.style.removeProperty("--tinggi-sampul");
      konten.style.removeProperty("--skala-sampul");
    };
  }, [akar]);
}
