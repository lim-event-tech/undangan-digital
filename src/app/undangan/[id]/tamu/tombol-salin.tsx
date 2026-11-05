"use client";

import { useState } from "react";
import { Ikon } from "@/components/ikon";

export function TombolSalin({ path, nama }: { path: string; nama: string }) {
  const [status, setStatus] = useState<"diam" | "tersalin" | "gagal">("diam");

  async function salin() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${path}`);
      setStatus("tersalin");
    } catch {
      setStatus("gagal");
    }
    setTimeout(() => setStatus("diam"), 1800);
  }

  return (
    <button
      type="button"
      onClick={salin}
      aria-label={`Salin link ${nama}`}
      className={`inline-flex size-10 items-center justify-center rounded-md border bg-white transition-colors hover:bg-kertas focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emas-muda ${
        status === "tersalin"
          ? "border-hijau text-hijau"
          : status === "gagal"
            ? "border-galat text-galat"
            : "border-garis text-redup-2"
      }`}
    >
      <Ikon nama={status === "tersalin" ? "ceklis" : "tautan"} ukuran={16} />
      <span className="sr-only" role="status">
        {status === "tersalin"
          ? "Link tersalin"
          : status === "gagal"
            ? "Gagal menyalin"
            : ""}
      </span>
    </button>
  );
}
