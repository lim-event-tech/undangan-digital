import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { kartu, judulHalaman } from "@/components/ui";
import { loadInvitation, requireUser } from "@/lib/session";
import { FormBaru } from "./form-baru";

export const metadata: Metadata = { title: "Buat undangan" };

export default async function UndanganBaruPage() {
  const user = await requireUser();
  const existing = await loadInvitation(user.id);
  if (existing) redirect("/undangan/tamu");

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6 pt-6">
      <div>
        <h1 className={`m-0 ${judulHalaman}`}>Mulai undangan Anda</h1>
        <p className="mt-2 mb-0 text-[15px] leading-relaxed text-redup">
          Cukup nama panggilan dulu. Tanggal, tempat, dan isi undangan bisa
          diisi nanti.
        </p>
      </div>
      <div className={`${kartu} p-6`}>
        <FormBaru />
      </div>
    </div>
  );
}
