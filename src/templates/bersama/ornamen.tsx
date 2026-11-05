import type { CSSProperties } from "react";
import type { TemplateKey } from "@/templates/registry";

function Ranting({ balik = false }: { balik?: boolean }) {
  return <g transform={balik ? "translate(240 180) rotate(180)" : undefined}><g className="event-ranting">
    <path d="M20 174C43 131 39 72 110 12" fill="none" stroke="currentColor" strokeWidth="1.2" />
    {Array.from({ length: 8 }, (_, i) => <g key={i} transform={`translate(${28 + i * 8} ${157 - i * 18}) rotate(${-29 + i * 4})`}>
      <path d="M0 0C-36-2-34-27-27-37C-7-30 2-15 0 0Z" fill="currentColor" fillOpacity={i % 2 ? ".17" : ".27"} stroke="currentColor" strokeWidth=".65" />
      <path d="M0 0L-24-32M5-8C34-30 41-12 40-3C25 8 13 5 5-8Z" fill="none" stroke="currentColor" strokeWidth=".7" />
      <path d="M8-8L35-5" stroke="currentColor" strokeWidth=".55" />
    </g>)}
  </g></g>;
}

export function HiasanEvent({ tema }: { tema: TemplateKey }) {
  return <svg className={`event-hiasan event-hiasan-${tema}`} viewBox="0 0 240 180" fill="none" aria-hidden="true">
    {tema === "melati" ? <>
      <Ranting /><Ranting balik />
      <g className="event-bunga" stroke="currentColor" strokeWidth=".9">
        {Array.from({ length: 8 }, (_, i) => <ellipse key={i} cx="120" cy="72" rx="7" ry="18" transform={`rotate(${i * 45} 120 90)`} fill="currentColor" fillOpacity=".07" />)}
        <circle cx="120" cy="90" r="8" /><circle cx="120" cy="90" r="3" fill="currentColor" />
      </g>
    </> : tema === "keraton" ? <g stroke="currentColor">
      <g className="event-gerbang-garis" strokeWidth=".8">
        {[0, 1, 2, 3, 4].map(i => <path key={i} d={`M${25 + i * 15} 164V${68 + i * 14}L120 ${12 + i * 24}L${215 - i * 15} ${68 + i * 14}V164`} />)}
        <path d="M12 164H228M17 170H223M25 68L15 61M215 68L225 61M120 12V2" />
      </g>
      <g className="event-gerbang-pintu" strokeWidth="1.2"><path d="M92 164V115L120 96L148 115V164M120 96V164" /><path d="M101 157V120L115 111V157ZM125 111L139 120V157H125Z" fill="currentColor" fillOpacity=".09" /></g>
      <g strokeWidth=".7">{[40, 200].map(x => <g key={x}><path d={`M${x} 81l7 11-7 11-7-11Z`} /><path d={`M${x} 109v37M${x-4} 127h8`} /></g>)}</g>
    </g> : tema === "bintang" ? <>
      <g className="event-orbit" stroke="currentColor" strokeWidth=".65"><circle cx="120" cy="90" r="59" /><circle cx="120" cy="90" r="76" strokeDasharray="1 7" /><ellipse cx="120" cy="90" rx="108" ry="28" transform="rotate(-28 120 90)" /><circle cx="23" cy="135" r="3" fill="currentColor" /></g>
      <path className="event-bintang-utama" d="M120 45L129 79L163 90L129 101L120 135L111 101L77 90L111 79Z" stroke="currentColor" strokeWidth="1" fill="currentColor" fillOpacity=".14" />
      {Array.from({ length: 18 }, (_, i) => <circle className="event-bintang-kecil" key={i} cx={13 + (i * 61) % 214} cy={9 + (i * 43) % 162} r={i % 3 === 0 ? 1.8 : .9} fill="currentColor" style={{ "--i": i } as CSSProperties} />)}
    </> : <>
      <circle className="event-matahari" cx="125" cy="61" r="32" fill="currentColor" fillOpacity=".12" />
      <g className="event-awan" stroke="currentColor" strokeWidth=".9">{Array.from({ length: 5 }, (_, i) => <path key={i} d={`M-10 ${125 + i * 10}C25 ${125 + i * 10} 30 ${66 + i * 10} 67 ${66 + i * 10}S109 ${133 + i * 5} 148 ${133 + i * 5}S184 ${96 + i * 10} 250 ${96 + i * 10}`} />)}</g>
      <g stroke="currentColor" strokeWidth=".8"><path d="M17 56C41 32 62 40 70 59C47 80 25 78 17 56ZM171 34C183 14 207 15 221 27C208 48 184 53 171 34Z" fill="currentColor" fillOpacity=".1" /><path d="M20 57L66 59M174 34L217 27" /></g>
    </>}
  </svg>;
}

export function OrnamenEvent({ tema }: { tema: TemplateKey }) {
  return <div className={`event-ornamen event-ornamen-${tema}`} aria-hidden="true">
    <span className="event-ornamen-sudut event-ornamen-atas"><HiasanEvent tema={tema} /></span>
    <span className="event-ornamen-sudut event-ornamen-bawah"><HiasanEvent tema={tema} /></span>
    {tema === "keraton" ? <span className="event-kisi" /> : null}
    {tema === "bintang" ? <span className="event-langit">{Array.from({ length: 24 }, (_, i) => <i key={i} style={{ left: `${(i * 37) % 98}%`, top: `${(i * 53) % 96}%`, "--i": i } as CSSProperties} />)}</span> : null}
    {tema === "melati" || tema === "pasundan" ? <span className="event-serpih">{Array.from({ length: 6 }, (_, i) => <i key={i} style={{ left: `${i % 2 ? 91 + i % 3 : 2 + i % 4}%`, "--i": i } as CSSProperties} />)}</span> : null}
  </div>;
}
