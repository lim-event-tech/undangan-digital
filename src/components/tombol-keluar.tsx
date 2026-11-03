"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Ikon } from "@/components/ikon";
import { authClient } from "@/lib/auth-client";
import { tombolTerang } from "@/components/ui";

export function TombolKeluar({ tujuan = "/masuk" }: { tujuan?: string }) {
  const router = useRouter();
  const [memproses, setMemproses] = useState(false);

  async function keluar() {
    setMemproses(true);
    await authClient.signOut();
    router.replace(tujuan);
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={keluar}
      disabled={memproses}
      className={`${tombolTerang} shrink-0 lg:w-full`}
    >
      <Ikon nama="keluar" ukuran={16} />
      {memproses ? "Keluar…" : "Keluar"}
    </button>
  );
}
