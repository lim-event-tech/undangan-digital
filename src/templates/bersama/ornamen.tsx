import type { CSSProperties } from "react";
import type { TemplateKey } from "@/templates/registry";

export function HiasanEvent({ tema }: { tema: TemplateKey }) {
  return <svg className={`event-hiasan event-hiasan-${tema}`} viewBox="0 0 240 180" fill="none" aria-hidden="true">
    {tema === "melati" ? <g stroke="currentColor" strokeWidth="1">
      <path d="M31 100L120 48L209 100ZM24 108H216M48 112H192M56 112V151M70 112V151M170 112V151M184 112V151M43 153H197M35 160H205" />
      <path d="M83 119H157V146H83Z" fill="currentColor" fillOpacity=".06" /><path d="M91 128H149M91 137H149" opacity=".45" />
    </g> : tema === "keraton" ? <g stroke="currentColor">
      <g className="event-gerbang-garis" strokeWidth=".8">
        {[0, 1, 2, 3, 4].map(i => <path key={i} d={`M${25 + i * 15} 164V${68 + i * 14}L120 ${12 + i * 24}L${215 - i * 15} ${68 + i * 14}V164`} />)}
        <path d="M12 164H228M17 170H223M25 68L15 61M215 68L225 61M120 12V2" />
      </g>
      <g className="event-gerbang-pintu" strokeWidth="1.2"><path d="M92 164V115L120 96L148 115V164M120 96V164" /><path d="M101 157V120L115 111V157ZM125 111L139 120V157H125Z" fill="currentColor" fillOpacity=".09" /></g>
      <g strokeWidth=".7">{[40, 200].map(x => <g key={x}><path d={`M${x} 81l7 11-7 11-7-11Z`} /><path d={`M${x} 109v37M${x-4} 127h8`} /></g>)}</g>
    </g> : tema === "bintang" ? <>
      <path d="M146 34C110 26 78 53 78 88C78 127 117 153 151 136C119 135 99 107 103 78C106 58 121 43 146 34Z" stroke="currentColor" strokeWidth="1.1" fill="currentColor" fillOpacity=".12" />
      <path d="M170 47V59M164 53H176M53 103V111M49 107H57" stroke="currentColor" strokeWidth=".8" strokeLinecap="round" />
      {[0,1,2,3,4,5].map(i => <circle className="event-bintang-kecil" key={i} cx={[48,179,194,164,57,119][i]} cy={[53,94,127,158,145,16][i]} r={i%2 ? 1.3 : .8} fill="currentColor" style={{"--i":i} as CSSProperties} />)}
    </> : <g stroke="currentColor" strokeWidth=".9">
      <path d="M40 128A80 80 0 0 1 200 128ZM48 128A72 72 0 0 1 192 128" fill="currentColor" fillOpacity=".04" />
      {Array.from({length:9},(_,i)=><path key={i} d="M48 128H120" transform={`rotate(${i*22.5} 120 128)`} />)}
      <path d="M35 138H205M56 146H184" /><circle cx="120" cy="128" r="5" fill="currentColor" />
    </g>}
  </svg>;
}

export function OrnamenEvent({ tema }: { tema: TemplateKey }) {
  if (tema === "melati") return <div className="event-ornamen event-ornamen-senja" aria-hidden="true"><svg className="event-senja-sampul" viewBox="0 0 430 240" fill="none" stroke="currentColor" strokeWidth="1"><path d="M75 128L215 58L355 128ZM62 138H368M94 145H336M108 145V211M124 145V211M306 145V211M322 145V211M83 215H347M70 224H360" /><path d="M147 158H283V202H147ZM157 172H273M157 186H273" opacity=".5" /><circle cx="330" cy="53" r="22" fill="currentColor" fillOpacity=".15" /></svg></div>;
  if (tema === "pasundan") return <div className="event-ornamen event-ornamen-tembaga" aria-hidden="true"><svg className="event-kipas-sampul" viewBox="0 0 430 400" fill="none" stroke="currentColor" strokeWidth="1"><path d="M51 316A164 164 0 0 1 379 316ZM67 316A148 148 0 0 1 363 316" fill="currentColor" fillOpacity=".03" />{Array.from({length:13},(_,i)=><path key={i} d="M67 316H215" transform={`rotate(${i*15} 215 316)`} />)}<path d="M44 330H386M70 341H360" /><circle cx="215" cy="316" r="8" fill="currentColor" /></svg></div>;
  if (tema === "bintang") return <div className="event-ornamen event-ornamen-bintang" aria-hidden="true"><span className="event-langit">{Array.from({length:12},(_,i)=><i key={i} style={{left:`${(i*37)%98}%`,top:`${(i*53)%96}%`,"--i":i} as CSSProperties} />)}</span></div>;
  return <div className={`event-ornamen event-ornamen-${tema}`} aria-hidden="true">
    <span className="event-ornamen-sudut event-ornamen-atas"><HiasanEvent tema={tema} /></span>
    <span className="event-ornamen-sudut event-ornamen-bawah"><HiasanEvent tema={tema} /></span>
    {tema === "keraton" ? <span className="event-kisi" /> : null}
  </div>;
}
