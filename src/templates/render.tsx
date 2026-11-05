import type { ReactElement } from "react";
import { siapkanData } from "./bersama/data";
import type { DataUndangan } from "./bersama/jenis";
import { UndanganBintang } from "./bintang";
import { UndanganKeraton } from "./keraton";
import { UndanganMelati } from "./melati";
import { UndanganPasundan } from "./pasundan";
import { isTemplateKey, DEFAULT_TEMPLATE, type TemplateKey } from "./registry";
import type { InvitationView } from "./types";

const SKRIP_JS = "document.documentElement.classList.add('js')";
const GAYA_TANPA_JS = "[data-anim]{opacity:1!important;transform:none!important}";

const KOMPONEN: Record<TemplateKey, (props: { data: DataUndangan }) => ReactElement> = {
  melati: UndanganMelati,
  keraton: UndanganKeraton,
  bintang: UndanganBintang,
  pasundan: UndanganPasundan,
};

export function renderTemplate(key: string, view: InvitationView): ReactElement {
  const Komponen = KOMPONEN[key as TemplateKey] ?? KOMPONEN.melati;
  const data = siapkanData(view, isTemplateKey(key) ? key : DEFAULT_TEMPLATE);
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: SKRIP_JS }} />
      <noscript>
        <style>{GAYA_TANPA_JS}</style>
      </noscript>
      <Komponen data={data} />
    </>
  );
}
