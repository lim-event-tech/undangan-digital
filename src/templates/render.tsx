import type { ReactElement } from "react";
import { siapkanData } from "./bersama/data";
import type { DataUndangan } from "./bersama/jenis";
import { UndanganBintang } from "./bintang";
import { UndanganKeraton } from "./keraton";
import { UndanganMelati } from "./melati";
import { UndanganPasundan } from "./pasundan";
import type { TemplateKey } from "./registry";
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
  const data = siapkanData(view);
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: SKRIP_JS }} />
      <noscript>
        <style>{GAYA_TANPA_JS}</style>
      </noscript>
      {view.mode === "tamu" ? null : (
        <p
          role="status"
          style={{
            position: "sticky",
            top: 0,
            zIndex: 45,
            margin: 0,
            padding: "10px 16px",
            background: "#2A2622",
            color: "#FAF7F0",
            fontFamily: "'Jost', system-ui, sans-serif",
            fontSize: "13px",
            textAlign: "center",
          }}
        >
          {view.mode === "contoh"
            ? "Contoh tampilan dengan data contoh. RSVP dan pesan tamu tidak disimpan."
            : "Pratinjau. RSVP dan pesan tamu tidak disimpan, dan hanya Anda yang melihat halaman ini."}
        </p>
      )}
      <Komponen data={data} />
    </>
  );
}
