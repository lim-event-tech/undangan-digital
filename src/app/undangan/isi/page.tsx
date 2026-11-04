import type { Metadata } from "next";
import Link from "next/link";
import { judulHalaman, tombolTerang } from "@/components/ui";
import { db } from "@/db";
import { dateFromDeadline } from "@/lib/datetime";
import { listEventDetails } from "@/lib/events/service";
import { countGuests, firstGuestToken } from "@/lib/guests/service";
import { readContent } from "@/lib/invitations/content";
import { findMissing, isSlugLocked } from "@/lib/invitations/editor";
import { getMusic } from "@/lib/music/service";
import { listPhotos } from "@/lib/photos/service";
import { requireInvitation } from "@/lib/session";
import { BagianAcara } from "./form-acara";
import {
  FormMempelai,
  FormPenutup,
  FormRsvp,
  FormSambutan,
} from "./form-bagian";
import { FormSusunan } from "./form-susunan";
import { FormAmplop, FormCerita, FormCheckin, FormHitungMundur, FormUcapan } from "./form-tambahan";
import { HapusUndangan } from "./hapus-undangan";
import { PanelTerbit } from "./panel-terbit";
import { templateInfo } from "@/templates/registry";
import { BagianCover, BagianFotoMempelai, BagianGaleri } from "./unggah-foto";
import { BagianMusik, FormLink, UnggahQris } from "./unggah-tambahan";

export const metadata: Metadata = { title: "Isi undangan" };

export default async function IsiUndanganPage() {
  const { invitation } = await requireInvitation();

  const [events, photos, jumlahTamu, tokenPratinjau, musik, slugTerkunci] = await Promise.all([
    listEventDetails(db, invitation.id),
    listPhotos(db, invitation.id),
    countGuests(db, invitation.id),
    firstGuestToken(db, invitation.id),
    getMusic(db, invitation.id),
    isSlugLocked(db, invitation.id),
  ]);
  const content = readContent(invitation.content);
  const missing = findMissing(events, photos);
  const cover = photos.find((p) => p.kind === "cover") ?? null;
  const galeri = photos.filter((p) => p.kind === "galeri");
  const qris = photos.find((p) => p.kind === "qris") ?? null;
  const fotoPria = photos.find((p) => p.kind === "pria") ?? null;
  const fotoWanita = photos.find((p) => p.kind === "wanita") ?? null;
  const template = templateInfo(invitation.templateKey);

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
            <Link href="/undangan/template" className="font-medium text-emas">
              Ganti
            </Link>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
        <a
          href={`/pratinjau/${template.key}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`${tombolTerang} no-underline`}
        >
          Pratinjau
        </a>
        {tokenPratinjau ? (
          <a
            href={`/${invitation.slug}/${tokenPratinjau}`}
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

      <BagianCover cover={cover} />
      <FormMempelai
        groomName={invitation.groomName}
        brideName={invitation.brideName}
        pria={content.pria}
        wanita={content.wanita}
      />
      <BagianFotoMempelai pria={fotoPria} wanita={fotoWanita} />
      <FormSambutan kutipan={content.kutipan} sambutan={content.sambutan} />
      <BagianAcara acara={events} />
      <FormHitungMundur pengaturan={content.hitungMundur} />
      <FormCerita cerita={content.cerita} />
      <BagianGaleri foto={galeri} />
      <FormRsvp
        batas={dateFromDeadline(invitation.rsvpDeadline)}
        maksDewasa={invitation.defaultMaxAdults}
        maksAnak={invitation.defaultMaxChildren}
      />
      <FormCheckin pengaturan={content.checkin} />
      <FormUcapan pengaturan={content.ucapan} />
      <FormAmplop amplop={content.amplop} qris={<UnggahQris qris={qris} />} />
      <BagianMusik aktif={content.musik.aktif} musik={musik} />
      <FormPenutup penutup={content.penutup} />
      <FormSusunan susunan={content.susunan} />

      <FormLink slug={invitation.slug} terkunci={slugTerkunci} />

      <HapusUndangan jumlahTamu={jumlahTamu} />
    </div>
  );
}
