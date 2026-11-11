import type { Metadata } from "next";
import Link from "next/link";
import { judulHalaman } from "@/components/ui";
import { db } from "@/db";
import { getImportContext } from "@/lib/guests/service";
import { requireInvitationAccess } from "@/lib/session";
import { ImportClient } from "./import-client";

export const metadata: Metadata = { title: "Impor daftar undangan" };

export default async function ImporPage({ params }: PageProps<"/undangan/[id]/tamu/impor">) {
  const { invitation, scope } = await requireInvitationAccess((await params).id);
  const context = await getImportContext(db, invitation.id, scope ?? undefined);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <Link href={`/undangan/${invitation.id}/tamu`} className="text-sm font-medium text-emas">
          ← Daftar undangan
        </Link>
        <h1 className={`mt-2 mb-0 ${judulHalaman}`}>Impor daftar undangan</h1>
      </div>
      <ImportClient context={context} />
    </div>
  );
}
