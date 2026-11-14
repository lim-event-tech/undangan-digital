import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { looksLikeCheckinKey } from "@/lib/checkin/code";
import { checkinCounts, findInvitationByKey } from "@/lib/checkin/service";
import { looksLikeSlug } from "@/lib/token";
import { currentClientKey, tokenGuard } from "@/lib/token-guard-instance";
import { Pemindai } from "@/components/pemindai-checkin";
import { batalkanAction, cariAction, masukkanAction, pindaiAction } from "./actions";

export const metadata: Metadata = { title: "Check-in tamu", robots: { index: false, follow: false } };

export default async function PetugasPage({ params }: PageProps<"/petugas/[slug]/[kunci]">) {
  const { slug, kunci } = await params;
  const client = await currentClientKey();
  if (tokenGuard.isBlocked(client)) notFound();
  if (!looksLikeSlug(slug) || !looksLikeCheckinKey(kunci)) {
    tokenGuard.recordFailure(client);
    notFound();
  }
  const invitation = await findInvitationByKey(db, slug, kunci);
  if (!invitation) {
    tokenGuard.recordFailure(client);
    notFound();
  }
  const counts = await checkinCounts(db, invitation.id);

  return (
    <div className="min-h-screen bg-kertas px-4 py-6">
      <div className="mx-auto flex max-w-md flex-col gap-5">
        <header className="flex flex-col gap-1">
          <span className="text-xs tracking-[0.16em] text-emas uppercase">Petugas penerima tamu</span>
          <h1 className="m-0 font-judul text-[32px] leading-tight font-medium">
            {invitation.title}
          </h1>
          <p className="m-0 text-sm text-redup">
            {counts.inside} dari {counts.confirmed} tamu yang konfirmasi hadir sudah masuk
            {counts.other > 0 ? `, ditambah ${counts.other} tamu tanpa konfirmasi` : ""}.
          </p>
        </header>
        <Pemindai
          aksi={{
            pindai: pindaiAction.bind(null, invitation.slug, kunci),
            masukkan: masukkanAction.bind(null, invitation.slug, kunci),
            batalkan: batalkanAction.bind(null, invitation.slug, kunci),
            cari: cariAction.bind(null, invitation.slug, kunci),
          }}
        />
      </div>
    </div>
  );
}
