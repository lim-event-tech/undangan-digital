import type { ReactNode } from "react";
import { kartu } from "@/components/ui";

export function KartuBagian({
  id,
  judul,
  deskripsi,
  aksi,
  children,
}: {
  id: string;
  judul: string;
  deskripsi?: string;
  aksi?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-judul`}
      className={`${kartu} flex scroll-mt-6 flex-col gap-4 p-5 sm:p-6`}
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id={`${id}-judul`} className="m-0 font-judul text-2xl font-medium">
            {judul}
          </h2>
          {deskripsi ? (
            <p className="mt-1 mb-0 text-sm leading-relaxed text-redup">{deskripsi}</p>
          ) : null}
        </div>
        {aksi}
      </header>
      {children}
    </section>
  );
}
