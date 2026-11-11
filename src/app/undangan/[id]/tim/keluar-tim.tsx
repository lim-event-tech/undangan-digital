"use client";

import { useInvitationAction } from "@/components/invitation-context";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { tombolBahaya } from "@/components/ui";
import { keluarDariTimAction } from "./actions";

export function KeluarTim() {
  const keluar = useInvitationAction(keluarDariTimAction);
  const router = useRouter();
  const [memproses, mulai] = useTransition();
  return (
    <button
      type="button"
      disabled={memproses}
      className={tombolBahaya}
      onClick={() => {
        if (!window.confirm("Keluar dari tim undangan ini? Tamu yang Anda tambahkan menjadi milik pemilik undangan dan Anda tidak bisa mengaksesnya lagi.")) return;
        mulai(async () => {
          await keluar();
          router.push("/undangan");
          router.refresh();
        });
      }}
    >
      {memproses ? "Memproses…" : "Keluar dari tim"}
    </button>
  );
}
