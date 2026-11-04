import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PilihTemplate } from "@/components/pilih-template";
import { kartu, judulHalaman } from "@/components/ui";
import { db } from "@/db";
import { listSelectableTemplates } from "@/lib/platform/templates";
import { loadInvitation, requireUser } from "@/lib/session";
import { keDaftarPilihan } from "@/templates/registry";
import { FormBaru } from "./form-baru";

export const metadata: Metadata = { title: "Buat undangan" };

export default async function UndanganBaruPage({ searchParams }: PageProps<"/undangan/baru">) {
  const user = await requireUser();
  const existing = await loadInvitation(user.id);
  if (existing) redirect("/undangan/tamu");

  const { template } = await searchParams;
  const katalog = keDaftarPilihan(await listSelectableTemplates(db));
  const dipilih = katalog.find((t) => t.key === template);

  if (!dipilih) {
    return (
      <div className="mx-auto max-w-310">
        <PilihTemplate
          templates={katalog}
          awal={katalog[0].key}
          aktif={null}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6 pt-6">
      <div>
        <h1 className={`m-0 ${judulHalaman}`}>Mulai undangan Anda</h1>
        <p className="mt-2 mb-0 text-[15px] leading-relaxed text-redup">
          Cukup judul event dulu. Tanggal, tempat, dan isi undangan bisa
          diisi nanti.
        </p>
        <p className="mt-2 mb-0 text-sm text-redup-2">
          Template <strong className="font-medium text-tinta">{dipilih.label}</strong>
          {" · "}
          <Link href="/undangan/baru" className="font-medium text-emas">
            Ganti
          </Link>
        </p>
      </div>
      <div className={`${kartu} p-6`}>
        <FormBaru template={dipilih.key} />
      </div>
    </div>
  );
}
