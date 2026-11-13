"use client";

import { useTransition } from "react";
import { useInvitationAction } from "@/components/invitation-context";
import { useRouter } from "next/navigation";
import { tombolEmas, tombolGelap, tombolTerang } from "@/components/ui";
import {
  kirimWabaTamuAction,
  tandaiDiingatkanAction,
  tandaiTerkirimAction,
} from "./actions";

export function TombolKirim({
  guestId,
  href,
  nama,
  terkirim,
  pengingat = false,
  wabaAllowed = false,
  gatewayAktif = false,
  wabaQuota = 0,
}: {
  guestId: string;
  href: string;
  nama: string;
  terkirim: boolean;
  pengingat?: boolean;
  wabaAllowed?: boolean;
  gatewayAktif?: boolean;
  wabaQuota?: number;
}) {
  const tandaiDiingatkanActionForInvitation = useInvitationAction(tandaiDiingatkanAction);
  const tandaiTerkirimActionForInvitation = useInvitationAction(tandaiTerkirimAction);
  const kirimWabaAction = useInvitationAction(kirimWabaTamuAction);

  const router = useRouter();
  const [isWabaPending, startWabaTransition] = useTransition();

  const handleKirimWaba = () => {
    if (!gatewayAktif) {
      alert("Koneksi Gateway WABA belum diaktifkan oleh Administrator di Admin Panel.");
      return;
    }
    if (wabaQuota <= 0) {
      alert("Kredit pesan WABA Anda sudah habis. Silakan hubungi admin.");
      return;
    }
    startWabaTransition(async () => {
      try {
        const res = await kirimWabaAction(guestId);
        if (!res.ok) {
          alert(res.error || "Gagal mengirim via WABA.");
        } else {
          router.refresh();
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Gagal mengirim via WABA.";
        alert(msg);
      }
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {wabaAllowed ? (
        <button
          type="button"
          onClick={handleKirimWaba}
          disabled={isWabaPending || !gatewayAktif || wabaQuota <= 0}
          title={
            !gatewayAktif
              ? "Gateway WABA sistem belum diaktifkan oleh Admin di Admin Panel"
              : wabaQuota <= 0
              ? "Kredit WABA habis"
              : `Kirim ke ${nama} via WhatsApp Business API Resmi (Kurangi 1 kredit)`
          }
          className={`${tombolEmas} min-h-10 px-3 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50`}
        >
          {isWabaPending ? "Mengirim..." : "Kirim WABA Resmi"}
        </button>
      ) : null}

      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${pengingat ? (terkirim ? "Ingatkan lagi" : "Ingatkan") : terkirim ? "Kirim ulang ke" : "Kirim ke"} ${nama} lewat WhatsApp`}
        onClick={() => {
          const tandai = pengingat ? tandaiDiingatkanActionForInvitation : tandaiTerkirimActionForInvitation;
          void tandai(guestId).then(() => router.refresh());
        }}
        className={`${terkirim ? tombolTerang : tombolGelap} min-h-10 px-3.5 no-underline text-xs`}
      >
        {pengingat
          ? terkirim
            ? "Ingatkan lagi"
            : "WhatsApp Biasa"
          : terkirim
            ? "Kirim ulang WA"
            : "WhatsApp Biasa"}
      </a>
    </div>
  );
}
