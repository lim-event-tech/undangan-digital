"use client";

import { useRef } from "react";
import { JANGKAR } from "./jangkar";
import type { DataUndangan, ModulTemplate } from "./jenis";
import { useGerak, useUndangan } from "./use-undangan";
import { useSampul } from "./use-sampul";
import "./sampul.css";

export function Kerangka({ modul, data }: { modul: ModulTemplate; data: DataUndangan }) {
  const v = useUndangan(data, modul.palet);
  const akar = useRef<HTMLElement>(null);
  useGerak(akar, v.undanganTerbuka);
  useSampul(akar);
  const { bagian, Progres, Lightbox, Musik } = modul;
  const urutan = data.urutan;

  return (
    <main ref={akar} className={`undangan-template tpl-${modul.kunci} selalu-gerak`} data-terbuka={v.undanganTerbuka} style={modul.akar}>
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
            />
          );
          return id === "sampul" ? elemen : <div key={id} className="undangan-lanjutan">{elemen}</div>;
        })}
      </div>
      {v.undanganTerbuka ? <Lightbox v={v} /> : null}
      {v.undanganTerbuka ? <Musik v={v} /> : null}
    </main>
  );
}
