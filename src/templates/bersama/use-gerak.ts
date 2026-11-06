"use client";

import { useEffect, type RefObject } from "react";

export function useGerak(akar: RefObject<HTMLElement | null>, aktif = true) {
  useEffect(() => {
    const halaman = akar.current;
    if (!halaman) return;
    const visibilitas = () => halaman.toggleAttribute("data-jeda-gerak", document.hidden);
    visibilitas();
    document.addEventListener("visibilitychange", visibilitas);
    return () => {
      document.removeEventListener("visibilitychange", visibilitas);
      halaman.removeAttribute("data-jeda-gerak");
    };
  }, [akar]);
  useEffect(() => {
    const halaman = akar.current;
    if (!aktif || !halaman) return;
    const bagian = Array.from(halaman.querySelectorAll<HTMLElement>("[data-gerak-bagian], #sampul"));
    const adegan = Array.from(halaman.querySelectorAll<HTMLElement>("[data-adegan]"));
    const progres = halaman.querySelector<HTMLElement>(".event-progres span");
    const terlihat = new Set<HTMLElement>();
    let raf = 0;
    const gulir = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const tinggi = window.innerHeight;
        const scroll = document.scrollingElement || document.documentElement;
        const kemajuan = Math.min(1, scroll.scrollTop / Math.max(1, scroll.scrollHeight - tinggi));
        const posisi = [...terlihat].map(el => {
          const kotak = el.getBoundingClientRect();
          return { el, jarak: Math.max(-320, Math.min(320, tinggi / 2 - kotak.top - kotak.height / 2)) };
        });
        for (const { el, jarak } of posisi) el.style.setProperty("--adegan-gulir", `${jarak.toFixed(1)}px`);
        if (progres) progres.style.transform = `scaleX(${kemajuan})`;
      });
    };
    const observerBagian = typeof IntersectionObserver === "undefined" ? null : new IntersectionObserver(daftar => {
      for (const item of daftar) item.target.classList.toggle("dalam-layar", item.isIntersecting);
    }, { rootMargin: "60px 0px", threshold: 0 });
    for (const el of bagian) {
      if (observerBagian) observerBagian.observe(el);
      else el.classList.add("dalam-layar");
    }
    const observerAdegan = typeof IntersectionObserver === "undefined" ? null : new IntersectionObserver(daftar => {
      for (const item of daftar) {
        const el = item.target as HTMLElement;
        el.classList.toggle("dalam-layar", item.isIntersecting);
        if (item.isIntersecting) terlihat.add(el);
        else terlihat.delete(el);
      }
      gulir();
    }, { rootMargin: "60px 0px", threshold: 0 });
    for (const el of adegan) {
      if (observerAdegan) observerAdegan.observe(el);
      else {
        terlihat.add(el);
        el.classList.add("dalam-layar");
      }
    }
    const elemen = Array.from(halaman.querySelectorAll<HTMLElement>("[data-anim]"));
    const observerMasuk = typeof IntersectionObserver === "undefined" ? null : new IntersectionObserver(daftar => {
      for (const item of daftar) {
        if (!item.isIntersecting) continue;
        item.target.classList.add("tampil");
        observerMasuk?.unobserve(item.target);
      }
    }, { threshold: 0.01, rootMargin: "0px 0px -18px 0px" });
    elemen.forEach((el, i) => {
      el.style.setProperty("--jeda-masuk", `${i % 3 * 80}ms`);
      if (observerMasuk) observerMasuk.observe(el);
      else el.classList.add("tampil");
    });
    const ukuran = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(gulir);
    ukuran?.observe(halaman);
    window.addEventListener("scroll", gulir, { passive: true });
    window.addEventListener("resize", gulir);
    gulir();
    return () => {
      window.removeEventListener("scroll", gulir);
      window.removeEventListener("resize", gulir);
      cancelAnimationFrame(raf);
      observerBagian?.disconnect();
      observerAdegan?.disconnect();
      observerMasuk?.disconnect();
      ukuran?.disconnect();
      bagian.forEach(el => el.classList.remove("dalam-layar"));
      adegan.forEach(el => { el.classList.remove("dalam-layar"); el.style.removeProperty("--adegan-gulir"); });
      elemen.forEach(el => el.style.removeProperty("--jeda-masuk"));
      progres?.style.removeProperty("transform");
    };
  }, [akar, aktif]);
}
