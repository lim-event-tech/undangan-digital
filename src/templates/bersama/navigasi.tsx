import type { BagianId } from "@/lib/invitations/content";
import { JANGKAR } from "./jangkar";

export function Navigasi({ urutan, mode }: { urutan: BagianId[]; mode: "tamu" | "contoh" | "pratinjau" }) {
  const pilihan: { id: BagianId; label: string }[] = [
    { id: "acara", label: "Acara" },
    { id: "agenda", label: "Agenda" },
    { id: "informasi", label: "Info" },
    { id: "kontak", label: "Kontak" },
  ];
  const links = pilihan.filter(item => urutan.includes(item.id));
  if (!links.length && !urutan.includes("rsvp")) return null;
  return <nav className="event-navigasi undangan-lanjutan" aria-label="Navigasi undangan">
    {mode !== "tamu" ? <p className="event-mode" role="status">{mode === "contoh" ? "Contoh" : "Pratinjau"} · Tidak menyimpan jawaban</p> : null}
    <div className="event-navigasi-baris">
    <div className="event-navigasi-tautan">{links.map(item => <a key={item.id} href={`#${JANGKAR[item.id]}`}>{item.label}</a>)}</div>
    {urutan.includes("rsvp") ? <a className="event-navigasi-rsvp" href="#rsvp">RSVP <span aria-hidden="true">↗</span></a> : null}
    </div>
  </nav>;
}
