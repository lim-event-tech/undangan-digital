"use client";

import { useRouter } from "next/navigation";
import { tombolGelap, tombolTerang } from "@/components/ui";
import { tandaiDiingatkanAction, tandaiTerkirimAction } from "./actions";

export function TombolKirim({
  guestId,
  href,
  nama,
  terkirim,
  pengingat = false,
}: {
  guestId: string;
  href: string;
  nama: string;
  terkirim: boolean;
  pengingat?: boolean;
}) {
  const router = useRouter();

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${pengingat ? (terkirim ? "Ingatkan lagi" : "Ingatkan") : terkirim ? "Kirim ulang ke" : "Kirim ke"} ${nama} lewat WhatsApp`}
      onClick={() => {
        const tandai = pengingat ? tandaiDiingatkanAction : tandaiTerkirimAction;
        void tandai(guestId).then(() => router.refresh());
      }}
      className={`${terkirim ? tombolTerang : tombolGelap} min-h-10 px-3.5 no-underline`}
    >
      {pengingat
        ? terkirim
          ? "Ingatkan lagi"
          : "Ingatkan via WhatsApp"
        : terkirim
          ? "Kirim ulang"
          : "Kirim via WhatsApp"}
    </a>
  );
}
