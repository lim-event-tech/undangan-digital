"use client";

import { pesanGalat } from "@/components/ui";
import type { CheckinSettings } from "@/lib/invitations/content";
import { simpanCheckinAction } from "./actions";
import { Saklar } from "./bidang";
import { KartuBagian } from "./kartu-bagian";
import { StatusSimpan, useAutoSave } from "./use-auto-save";

function GalatForm({ pesan }: { pesan?: string }) {
  if (!pesan) return null;
  return (
    <p role="alert" className={`m-0 ${pesanGalat}`}>
      {pesan}
    </p>
  );
}

export function FormCheckin({ pengaturan }: { pengaturan: CheckinSettings }) {
  const { formRef, status, formError, formProps } = useAutoSave(simpanCheckinAction);

  return (
    <KartuBagian
      id="checkin"
      judul="Check-in di lokasi"
      deskripsi="Bila aktif, tamu yang konfirmasi hadir mendapat kode QR untuk dipindai petugas penerima tamu. Bila nonaktif, tamu hanya melihat ucapan terima kasih dan kabar bahwa jawabannya sudah masuk."
      aksi={<StatusSimpan status={status} />}
    >
      <form ref={formRef} {...formProps} className="flex flex-col divide-y divide-garis-halus">
        <Saklar label="Aktifkan check-in dengan kode QR" name="aktif" defaultChecked={pengaturan.aktif} />
        <GalatForm pesan={formError} />
      </form>
    </KartuBagian>
  );
}
