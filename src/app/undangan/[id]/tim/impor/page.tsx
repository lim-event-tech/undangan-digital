import type { Metadata } from "next";
import Link from "next/link";
import { judulHalaman } from "@/components/ui";
import { db } from "@/db";
import { requireInvitationById } from "@/lib/session";
import { getTeamImportContext } from "@/lib/team/service";
import { TeamImportClient } from "./import-client";

export const metadata: Metadata = { title: "Impor anggota tim" };

export default async function TimImporPage({ params }: PageProps<"/undangan/[id]/tim/impor">) {
  const { invitation } = await requireInvitationById((await params).id);
  const context = await getTeamImportContext(db, invitation.id);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-5">
      <div>
        <Link href={`/undangan/${invitation.id}/tim`} className="text-sm font-medium text-emas">
          ← Tim
        </Link>
        <h1 className={`mt-2 mb-0 ${judulHalaman}`}>Impor anggota tim</h1>
      </div>
      <TeamImportClient context={context} />
    </div>
  );
}
