"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Ikon, type NamaIkon } from "@/components/ikon";

export type ItemNav = {
  label: string;
  ikon: NamaIkon;
  href?: string;
  lencana?: number;
  tepat?: boolean;
  targetBlank?: boolean;
};

const dasar =
  "flex min-h-11 items-center gap-2.5 whitespace-nowrap rounded-lg px-3 text-[15px] font-medium";

export function SidebarNav({ items }: { items: ItemNav[] }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Menu undangan">
      <ul className="m-0 flex list-none gap-1 overflow-x-auto p-0 lg:flex-col lg:overflow-visible">
        {items.map((item) => {
          if (!item.href) {
            return (
              <li key={item.label} className="hidden lg:block">
                <span
                  aria-disabled="true"
                  className={`${dasar} cursor-not-allowed text-redup`}
                >
                  <Ikon nama={item.ikon} />
                  {item.label}
                  <span className="ml-auto rounded-full bg-krem-2 px-2 py-0.5 text-[11px] font-medium text-redup-2">
                    Segera
                  </span>
                </span>
              </li>
            );
          }
          const aktif = item.tepat
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.label}>
              <Link
                href={item.href}
                target={item.targetBlank ? "_blank" : undefined}
                rel={item.targetBlank ? "noopener noreferrer" : undefined}
                aria-current={aktif ? "page" : undefined}
                className={`${dasar} no-underline ${
                  aktif
                    ? "bg-krem text-emas-tua"
                    : "text-tinta-2 hover:bg-kertas"
                }`}
              >
                <Ikon nama={item.ikon} />
                {item.label}
                {item.targetBlank ? <span className="ml-auto text-xs text-redup">↗</span> : null}
                {item.lencana ? (
                  <span className="ml-auto rounded-full bg-galat px-2 py-0.5 text-[11px] font-medium text-white">
                    {item.lencana}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
