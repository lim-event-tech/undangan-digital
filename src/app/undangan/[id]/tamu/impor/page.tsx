import type { Metadata } from "next";
import Link from "next/link";
import { judulHalaman } from "@/components/ui";
import { db } from "@/db";
import { getImportContext } from "@/lib/guests/service";
import { requireInvitationById } from "@/lib/session";
import { ImportClient } from "./import-client";

export const metadata: Metadata = { title: "Impor daftar tamu" };

export default async function ImporPage({ params }: PageProps<"/undangan/[id]/tamu/impor">) {
  const { invitation } = await requireInvitationById((await params).id);
  const context = await getImportContext(db, invitation.id);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <Link href={`/undangan/${invitation.id}/tamu`} className="text-sm font-medium text-emas">
          ← Daftar tamu
        </Link>
        <h1 className={`mt-2 mb-0 ${judulHalaman}`}>Impor daftar tamu</h1>
      </div>
      <ImportClient context={context} />
    </div>
  );
}
