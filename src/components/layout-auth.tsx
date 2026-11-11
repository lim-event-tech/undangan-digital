import type { ReactNode } from "react";
import { kartu } from "@/components/ui";
import { BrandLogo } from "@/components/brand-logo";

export function LayoutAuth({
  judul,
  deskripsi,
  children,
}: {
  judul: string;
  deskripsi: string;
  children: ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <section className="hidden flex-col justify-between border-r border-garis bg-krem-2/60 p-12 lg:flex">
        <BrandLogo className="self-start" />
        <div className="flex max-w-md flex-col gap-4">
          <h2 className="font-judul text-[52px] leading-[1.08] font-semibold">
            Semua tamu,{" "}
            <span className="font-medium text-emas italic">satu dashboard.</span>
          </h2>
          <p className="m-0 text-base leading-relaxed text-redup-2">
            Susun daftar undangan, bagikan link pribadi untuk tiap tamu, dan lihat siapa saja yang
            sudah menjawab.
          </p>
        </div>
        <span aria-hidden="true" />
      </section>

      <main className="flex items-center justify-center p-5 sm:p-10">
        <div
          className={`${kartu} flex w-full max-w-md flex-col gap-6 p-7 shadow-[0_1px_2px_rgba(42,38,34,0.04),0_12px_32px_-18px_rgba(42,38,34,0.22)]`}
        >
          <BrandLogo className="self-start lg:hidden" />
          <div className="flex flex-col gap-1.5">
            <h1 className="m-0 font-judul text-[34px] leading-tight font-semibold">{judul}</h1>
            <p className="m-0 text-sm text-redup">{deskripsi}</p>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
