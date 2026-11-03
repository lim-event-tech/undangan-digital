import { tombolTerang } from "@/components/ui";

function dengan(href: string, format: "xlsx" | "csv"): string {
  return `${href}${href.includes("?") ? "&" : "?"}format=${format}`;
}

export function TombolUnduh({ href, keterangan }: { href: string; keterangan?: string }) {
  const akhiran = keterangan ? ` (${keterangan})` : "";
  return (
    <span className="inline-flex flex-wrap gap-2">
      <a href={dengan(href, "xlsx")} download className={`${tombolTerang} no-underline`}>
        Unduh Excel{akhiran}
      </a>
      <a href={dengan(href, "csv")} download className={`${tombolTerang} no-underline`}>
        CSV
      </a>
    </span>
  );
}
