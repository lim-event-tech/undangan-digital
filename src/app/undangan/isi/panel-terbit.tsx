"use client";

import { useActionState } from "react";
import { Ikon } from "@/components/ikon";
import { kartu, pesanGalat, tombolGelap, tombolTerang } from "@/components/ui";
import type { MissingItem } from "@/lib/invitations/editor";
import type { SaveResult } from "@/lib/save-result";
import { terbitkanAction, tarikTerbitAction } from "./actions";

type Status = "draf" | "terbit" | "ditangguhkan";

function Galat({ hasil }: { hasil: SaveResult | null }) {
  if (!hasil || hasil.ok || !hasil.formError) return null;
  return (
    <p role="alert" className={`m-0 ${pesanGalat}`}>
      {hasil.formError}
    </p>
  );
}

export function PanelTerbit({
  status,
  missing,
}: {
  status: Status;
  missing: MissingItem[];
}) {
  const [hasilTerbit, terbitkan, menerbitkan] = useActionState<SaveResult | null, FormData>(
    terbitkanAction,
    null,
  );
  const [hasilTarik, tarik, menarik] = useActionState<SaveResult | null, FormData>(
    tarikTerbitAction,
    null,
  );

  if (status === "ditangguhkan") {
    return (
      <div role="status" className="flex items-start gap-3 rounded-[10px] bg-jingga-bg p-4 text-sm text-jingga">
        <Ikon nama="awas" className="mt-0.5 shrink-0" />
        <p className="m-0 leading-relaxed">
          Undangan ini sedang ditangguhkan, jadi link tamu tidak bisa dibuka dan tidak bisa
          diterbitkan. Hubungi bantuan untuk mengaktifkannya kembali.
        </p>
      </div>
    );
  }

  if (status === "terbit") {
    return (
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[10px] bg-hijau-bg p-4 text-hijau">
        <p className="m-0 flex items-start gap-2.5 text-sm leading-relaxed font-medium">
          <Ikon nama="ceklis" tebal={2.2} className="mt-0.5 shrink-0" />
          Sudah terbit. Perubahan berikutnya langsung terlihat di link tamu, tanpa perlu kirim
          ulang.
        </p>
        <form action={tarik} className="flex flex-col items-start gap-2">
          <button type="submit" disabled={menarik} className={tombolTerang}>
            {menarik ? "Memproses…" : "Tarik ke draf"}
          </button>
          <Galat hasil={hasilTarik} />
        </form>
      </div>
    );
  }

  const lengkap = missing.length === 0;

  return (
    <div className={`${kartu} flex flex-col gap-3 p-5`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="m-0 font-judul text-2xl font-medium">
          {lengkap ? "Siap diterbitkan" : "Belum bisa terbit"}
        </h2>
        <form action={terbitkan}>
          <button
            type="submit"
            disabled={!lengkap || menerbitkan}
            aria-describedby={lengkap ? undefined : "daftar-belum-lengkap"}
            className={tombolGelap}
          >
            {menerbitkan ? "Menerbitkan…" : "Terbitkan"}
          </button>
        </form>
      </div>
      {lengkap ? (
        <p className="m-0 text-sm leading-relaxed text-redup-2">
          Semua isian wajib sudah lengkap. Setelah terbit, link tamu langsung bisa dibuka.
        </p>
      ) : (
        <div id="daftar-belum-lengkap" className="flex flex-col gap-2">
          <p className="m-0 text-sm text-redup-2">Lengkapi dulu:</p>
          <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
            {missing.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.anchor}`}
                  className="inline-flex min-h-9 items-center rounded-full bg-jingga-bg px-3 text-[13px] font-medium text-jingga no-underline hover:bg-krem focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emas-muda"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
      <Galat hasil={hasilTerbit} />
    </div>
  );
}
