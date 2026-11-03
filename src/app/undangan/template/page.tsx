import type { Metadata } from "next";
import { PilihTemplate } from "@/components/pilih-template";
import { db } from "@/db";
import { listSelectableTemplates } from "@/lib/platform/templates";
import { requireInvitation } from "@/lib/session";
import { keDaftarPilihan } from "@/templates/registry";
import { gantiTemplateAction } from "./actions";

export const metadata: Metadata = { title: "Ganti template" };

export default async function GantiTemplatePage() {
  const { invitation } = await requireInvitation();
  const katalog = await listSelectableTemplates(db, invitation.templateKey);

  return (
    <div className="mx-auto max-w-310">
      <PilihTemplate
        templates={keDaftarPilihan(katalog)}
        awal={invitation.templateKey}
        aktif={invitation.templateKey}
        aksi={gantiTemplateAction}
      />
    </div>
  );
}
