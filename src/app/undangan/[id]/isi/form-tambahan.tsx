"use client";

import { pesanGalat } from "@/components/ui";
import {
  type CheckinSettings,
  type HitungMundurSettings,
  type UcapanSettings,
} from "@/lib/invitations/content";
import {
  simpanCheckinAction,
  simpanHitungMundurAction,
  simpanUcapanAction,
} from "./actions";
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

export function FormHitungMundur({ pengaturan }: { pengaturan: HitungMundurSettings }) {
  const { formRef, status, formError, formProps } = useAutoSave(simpanHitungMundurAction);

  return (
    <KartuBagian
      id="hitung-mundur"
      judul="Hitung mundur"
      deskripsi="Menghitung mundur ke acara pertama yang sudah punya tanggal dan jam."
      aksi={<StatusSimpan status={status} />}
    >
      <form ref={formRef} {...formProps} className="flex flex-col divide-y divide-garis-halus">
        <Saklar label="Tampilkan hitung mundur" name="aktif" defaultChecked={pengaturan.aktif} />
        <Saklar label="Tampilkan detik" name="detik" defaultChecked={pengaturan.detik} />
        <GalatForm pesan={formError} />
      </form>
    </KartuBagian>
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

export function FormUcapan({ pengaturan }: { pengaturan: UcapanSettings }) {
  const { formRef, status, formError, formProps } = useAutoSave(simpanUcapanAction);

  return (
    <KartuBagian
      id="ucapan"
      judul="Pesan tamu"
      deskripsi="Tamu menulis pesan tamu di undangan, maksimal 300 karakter. Kelola, sembunyikan, dan unduh pesan tamu di halaman Pesan tamu."
      aksi={<StatusSimpan status={status} />}
    >
      <form ref={formRef} {...formProps} className="flex flex-col divide-y divide-garis-halus">
        <Saklar
          label="Tampilkan pesan tamu di undangan"
          hint="Bila dimatikan, tamu tidak bisa mengirim pesan tamu"
          name="tampil"
          defaultChecked={pengaturan.tampil}
        />
        <Saklar
          label="Tahan pesan tamu baru sampai saya setujui"
          hint="Pesan tamu baru tidak tampil sampai Anda menyetujuinya"
          name="tahan"
          defaultChecked={pengaturan.tahan}
        />
        <GalatForm pesan={formError} />
      </form>
    </KartuBagian>
  );
}
