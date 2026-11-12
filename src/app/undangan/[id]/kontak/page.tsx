import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { judulHalaman, kartu } from "@/components/ui";
import { db } from "@/db";
import { readContent } from "@/lib/invitations/content";
import { requireInvitationAccess } from "@/lib/session";
import { getMemberContact } from "@/lib/team/service";
import { FormKontak } from "./form-kontak";

export const metadata: Metadata = { title: "Narahubung Saya" };

export default async function KontakPage({ params }: PageProps<"/undangan/[id]">) {
  const { invitation, user, role } = await requireInvitationAccess((await params).id);
  if (role !== "anggota") {
    notFound();
  }

  const [memberContact] = await Promise.all([
    getMemberContact(db, invitation.id, user.id),
  ]);

  const defaultContact = readContent(invitation.content).kontak;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5">
      <div>
        <h1 className={`m-0 ${judulHalaman}`}>Narahubung Saya</h1>
        <p className="mt-1 mb-0 text-sm leading-relaxed text-redup">
          Atur kontak narahubung khusus untuk tamu yang Anda tambahkan. Tamu yang membuka link undangan Anda akan melihat kontak ini di bagian Narahubung, bukan kontak utama acara.
        </p>
      </div>

      <section aria-labelledby="judul-kontak-bawaan" className={`${kartu} flex flex-col gap-2 p-5`}>
        <h2 id="judul-kontak-bawaan" className="m-0 text-sm font-medium">
          Kontak Bawaan Acara (Fallback)
        </h2>
        <p className="m-0 text-xs leading-relaxed text-redup">
          Bila kolom di bawah dikosongkan, tamu Anda akan melihat kontak bawaan acara ini:
        </p>
        <div className="mt-1 flex flex-wrap gap-4 text-xs text-redup-2">
          <span>
            <strong>Nama:</strong> {defaultContact.nama || "—"}
          </span>
          <span>
            <strong>Telepon:</strong> {defaultContact.telepon || "—"}
          </span>
          <span>
            <strong>Email:</strong> {defaultContact.email || "—"}
          </span>
        </div>
      </section>

      <section aria-labelledby="judul-form-kontak" className={`${kartu} flex flex-col gap-4 p-5 sm:p-6`}>
        <h2 id="judul-form-kontak" className="m-0 font-judul text-2xl font-medium">
          Pengaturan Kontak Anda
        </h2>
        <FormKontak
          invitationId={invitation.id}
          awal={{
            name: memberContact?.name ?? "",
            phone: memberContact?.phone ?? "",
            email: memberContact?.email ?? "",
          }}
        />
      </section>
    </div>
  );
}

