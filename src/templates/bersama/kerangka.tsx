"use client";

import dynamic from "next/dynamic";
import { useEffect, useId, useRef } from "react";
import { warnaTerang } from "@/lib/invitations/tampilan";
import { JANGKAR } from "./jangkar";
import type { DataUndangan, ModulTemplate } from "./jenis";
import { useUndangan } from "./use-undangan";
import { useGerak } from "./use-gerak";
import { useSampul } from "./use-sampul";
import "./sampul.css";
import { Panggung, Sambungan, gayaPanggung } from "./panggung";
import "./komposisi.css";
import { DefinisiDekorasi, DekorasiEvent } from "./dekorasi";
import "./dekorasi.css";
import { PALET_KUSTOM, gayaKustom } from "./kustom";
import "./kustom.css";

const FontKustom = dynamic(() => import("./font-kustom"));

export function Kerangka({ modul, data }: { modul: ModulTemplate; data: DataUndangan }) {
  const tampilan = data.tampilan;
  const v = useUndangan(data, tampilan.warna ? PALET_KUSTOM : modul.palet);
  const akar = useRef<HTMLElement>(null);
  const dekorasiId = useId();
  useEffect(() => { document.documentElement.classList.add("js"); }, []);
  useGerak(akar, v.undanganTerbuka);
  useSampul(akar);
  const { bagian, Progres } = modul;
  const urutan = data.urutan;
  const terang = tampilan.warna ? warnaTerang(tampilan.warna.kertas) : false;

  return (
    <main
      ref={akar}
      className={`undangan-template tpl-${modul.kunci} selalu-gerak`}
      data-terbuka={v.undanganTerbuka}
      data-mode={data.mode}
      data-hiasan={tampilan.hiasan ? "ada" : "mati"}
      data-warna={tampilan.warna ? "kustom" : undefined}
      style={{ ...modul.akar, ...gayaKustom(tampilan) }}
    >
      {tampilan.font !== "bawaan" ? <FontKustom /> : null}
      {tampilan.hiasan ? <DefinisiDekorasi tema={modul.kunci} id={dekorasiId} /> : null}
      {v.undanganTerbuka ? <Progres v={v} /> : null}
      <div className={modul.kertas.className} style={modul.kertas.style}>
        {urutan.map((id, i) => {
          const Bagian = bagian[id];
          const sesudah = urutan[i + 1];
          const elemen = (
            <Bagian
              key={id}
              v={v}
              berikut={JANGKAR[sesudah ?? id]}
              dekorasiId={dekorasiId}
            />
          );
          if (id === "sampul") return elemen;
          return (
            <div key={id} className="undangan-lanjutan event-lingkup-bagian" data-gerak-bagian data-bagian={id} style={gayaPanggung(modul.kunci, id, sesudah, tampilan.warna, terang)}>
              {tampilan.hiasan ? <><DekorasiEvent id={dekorasiId} bagian={id} /><Panggung tema={modul.kunci} bagian={id} /></> : null}
              {elemen}
              {tampilan.hiasan && sesudah ? <Sambungan tema={modul.kunci} variasi={i} bagian={id} /> : null}
            </div>
          );
        })}
      </div>
    </main>
  );
}
