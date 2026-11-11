import type { Metadata } from "next";
import Link from "next/link";
import { judulHalaman, tombolTerang } from "@/components/ui";
import { db } from "@/db";
import { dateFromDeadline, todayInZone } from "@/lib/datetime";
import { listEventDetails } from "@/lib/events/service";
import { countGuests, firstGuestToken } from "@/lib/guests/service";
import { readContent } from "@/lib/invitations/content";
import { findMissing } from "@/lib/invitations/editor";
import { listPhotos } from "@/lib/photos/service";
import { requireInvitationById } from "@/lib/session";
import { FormFormal, FormPengisi } from "./form-formal";
import { KartuBagian } from "./kartu-bagian";
import { BagianAcara } from "./form-acara";
import {
  FormTitle,
  FormPenutup,
  FormRsvp,
  FormSambutan,
} from "./form-bagian";
import { FormSusunan } from "./form-susunan";
import { FormCheckin } from "./form-tambahan";
import { FormTampilan } from "./form-tampilan";
import { HapusUndangan } from "./hapus-undangan";
import { PanelTerbit } from "./panel-terbit";
import { templateInfo } from "@/templates/registry";
import { BagianPoster } from "./unggah-foto";
import { UnggahLogo } from "./unggah-tambahan";

export const metadata: Metadata = { title: "Isi undangan" };

export default async function IsiUndanganPage({ params }: PageProps<"/undangan/[id]/isi">) {
  const { invitation } = await requireInvitationById((await params).id);

  const [events, photos, jumlahTamu, tokenPratinjau] = await Promise.all([
    listEventDetails(db, invitation.id),
    listPhotos(db, invitation.id),
    countGuests(db, invitation.id),
    firstGuestToken(db, invitation.id),
  ]);
  const content = readContent(invitation.content);
  const missing = findMissing(events, photos, invitation);
  const poster = photos.find((p) => p.kind === "cover") ?? null;
  const template = templateInfo(invitation.templateKey);
  const sekarang = new Date();
  const tanggalMinimal = {
    WIB: todayInZone("WIB", sekarang),
    WITA: todayInZone("WITA", sekarang),
    WIT: todayInZone("WIT", sekarang),
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className={`m-0 ${judulHalaman}`}>Isi undangan</h1>
          <p className="mt-1 mb-0 text-sm text-redup">
            Perubahan tersimpan otomatis dan langsung terlihat di link tamu.
          </p>
          <p className="mt-1 mb-0 text-sm text-redup-2">
            Template <strong className="font-medium text-tinta">{template.label}</strong>
            {" · "}
            <Link href={`/undangan/${invitation.id}/template`} className="font-medium text-emas">
              Ganti
            </Link>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
        <a
          href={`/pratinjau/${template.key}?undangan=${invitation.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`${tombolTerang} no-underline`}
        >
          Pratinjau
        </a>
        {tokenPratinjau ? (
          <a
            href={`/${tokenPratinjau}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`${tombolTerang} no-underline`}
          >
            Lihat sebagai tamu
          </a>
        ) : (
          <span className="text-[13px] text-redup">
            Tambah tamu untuk melihat undangan dari link tamu.
          </span>
        )}
        </div>
      </div>

      <PanelTerbit status={invitation.status} missing={missing} />

      <BagianPoster poster={poster} sampul={content.sampul} />
      <FormTampilan tampilan={content.tampilan} />
      <FormTitle title={invitation.title} />
      <FormFormal group="identitas" value={content.identitas} />
      <FormFormal group="penyelenggara" value={content.penyelenggara} />
      <KartuBagian id="logo" judul="Logo penyelenggara dan EO" deskripsi="Kedua logo opsional dan tampil utuh pada undangan.">
        <div className="grid gap-4 sm:grid-cols-2">
          <UnggahLogo jenis="logo_penyelenggara" foto={photos.find((p) => p.kind === "logo_penyelenggara") ?? null} />
          <UnggahLogo jenis="logo_eo" foto={photos.find((p) => p.kind === "logo_eo") ?? null} />
        </div>
      </KartuBagian>
      <FormSambutan sambutan={content.sambutan} />
      <BagianAcara acara={events} tanggalMinimal={tanggalMinimal} />
      <FormPengisi pengisi={content.pengisiAcara} photos={photos} />
      <FormFormal group="kontak" value={content.kontak} />
      <FormRsvp
        batas={dateFromDeadline(invitation.rsvpDeadline)}
        hariIni={tanggalMinimal.WIB}
        maksPeserta={invitation.defaultMaxAttendees}
      />
      <FormCheckin pengaturan={content.checkin} />
      <FormPenutup penutup={content.penutup} />
      <FormSusunan susunan={content.susunan} />

      <HapusUndangan invitationId={invitation.id} jumlahTamu={jumlahTamu} />
    </div>
  );
}
