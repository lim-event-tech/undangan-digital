"use client";

import { useEffect, useId, useRef } from "react";
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

export function Kerangka({ modul, data }: { modul: ModulTemplate; data: DataUndangan }) {
  const v = useUndangan(data, modul.palet);
  const akar = useRef<HTMLElement>(null);
  const dekorasiId = useId();
  useEffect(() => { document.documentElement.classList.add("js"); }, []);
  useGerak(akar, v.undanganTerbuka);
  useSampul(akar);
  const { bagian, Progres, Lightbox, Musik } = modul;
  const urutan = data.urutan;

  return (
    <main ref={akar} className={`undangan-template tpl-${modul.kunci} selalu-gerak`} data-terbuka={v.undanganTerbuka} data-mode={data.mode} style={modul.akar}>
      <DefinisiDekorasi tema={modul.kunci} id={dekorasiId} />
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
          return id === "sampul" ? elemen : <div key={id} className="undangan-lanjutan event-lingkup-bagian" data-gerak-bagian data-bagian={id} style={gayaPanggung(modul.kunci, id, sesudah)}><DekorasiEvent id={dekorasiId} bagian={id} /><Panggung tema={modul.kunci} bagian={id} />{elemen}{sesudah ? <Sambungan tema={modul.kunci} variasi={i} bagian={id} /> : null}</div>;
        })}
      </div>
      {v.undanganTerbuka ? <Lightbox v={v} /> : null}
      {v.undanganTerbuka ? <Musik v={v} /> : null}
    </main>
  );
}
