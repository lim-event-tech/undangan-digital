import type { CSSProperties } from "react";
import type { BagianId } from "@/lib/invitations/content";
import type { WarnaKustom } from "@/lib/invitations/tampilan";
import type { TemplateKey } from "@/templates/registry";
import { paletBidang } from "./kustom";

const WARNA: Record<TemplateKey, string[]> = {
  melati: ["#38262c", "#463039", "#2f2228", "#54383d", "#7a5059", "#241b21"],
  keraton: ["#153d32", "#1c473a", "#102f27", "#214d3f", "#53775c", "#0c251f"],
  bintang: ["#111d32", "#182942", "#0b172b", "#21334c", "#63718b", "#091323"],
  pasundan: ["#f8f1e8", "#efe1d2", "#f4e9dc", "#e9d7c1", "#b9906f", "#372c26"],
};
const BIDANG: Record<BagianId, number> = { sampul: 0, tentang: 0, salam: 1, acara: 2, agenda: 0, pengisi: 1, rsvp: 3, penyelenggara: 0, kontak: 2, penutup: 2 };

export function gayaPanggung(tema: TemplateKey, bagian: BagianId, berikut?: BagianId, warna?: WarnaKustom | null, terang = false): CSSProperties {
  const palet = warna ? paletBidang(warna, terang) : WARNA[tema];
  return {
    "--bidang": palet[BIDANG[bagian]],
    "--bidang-berikut": palet[BIDANG[berikut ?? bagian]],
    "--panggung-jauh": palet[3],
    "--panggung-tengah": palet[4],
    "--panggung-dekat": palet[5],
  } as CSSProperties;
}

function LatarPaviliun({ lapis }: { lapis: number }) {
  return <svg viewBox="0 0 430 340" preserveAspectRatio="xMidYMax meet" fill="none" className="event-lukisan" aria-hidden="true">
    {lapis === 0 ? <><circle data-adegan-motif cx="307" cy="74" r="32" fill="currentColor" opacity=".18" /><path d="M35 108C89 118 108 95 162 103M253 128C300 111 335 138 395 120" stroke="currentColor" strokeWidth=".7" opacity=".3" /><path d="M-24 286Q215 250 454 286V600H-24Z" fill="var(--panggung-jauh)" /></> : lapis === 1 ? <g data-adegan-motif stroke="currentColor" strokeWidth=".8"><path d="M75 180L215 108L355 180ZM63 190H367L355 180H75Z" fill="var(--panggung-tengah)" /><path d="M108 170L215 121L322 170M84 197H346M106 302V197M122 302V197M308 302V197M324 302V197" /><path d="M94 197H122V307H94ZM308 197H336V307H308Z" fill="var(--panggung-tengah)" /><path d="M84 307H346V319H84ZM72 319H358V330H72Z" fill="var(--panggung-tengah)" /><path d="M144 213H286V293H144ZM154 223H276M154 239H276M154 255H276M154 271H276" opacity=".35" /></g> : <g fill="var(--panggung-dekat)"><path d="M-24 326Q90 310 158 323T300 322T454 326V600H-24Z" /><path data-adegan-motif d="M44 354C54 314 54 276 41 237C20 238 21 262 43 279C17 265 9 285 25 300L49 309C49 328 44 343 38 354ZM379 354C366 319 372 280 387 250C409 255 402 277 380 288C410 278 420 302 399 313L374 319C374 333 381 346 386 354Z" /></g>}
  </svg>;
}

function LatarKeraton({ lapis }: { lapis: number }) {
  return <svg viewBox="0 0 430 340" preserveAspectRatio="xMidYMax meet" fill="none" className="event-lukisan" aria-hidden="true">
    {lapis === 0 ? <>
      <path d="M75 420V180C75 84 135 38 215 20C295 38 355 84 355 180V420" fill="var(--panggung-jauh)" stroke="currentColor" strokeWidth="1" />
      <path d="M89 420V180C89 96 145 54 215 37C285 54 341 96 341 180V420" stroke="currentColor" strokeWidth=".7" opacity=".5" />
      <path d="M-24 252H454V600H-24Z" fill="var(--panggung-jauh)" />
      <g className="event-gantung-istana" stroke="currentColor" opacity=".6"><path d="M34 0V104M396 0V104" />{[34,396].map(x=><g key={x}><path d={`M${x} 102l9 15-9 15-9-15Z`} /><circle cx={x} cy="146" r="3" fill="currentColor" /></g>)}</g>
    </> : lapis === 1 ? <>
      {[0, 1].map(i => <g key={i} transform={i ? "translate(430 0) scale(-1 1)" : undefined}>
        <path d="M-18 600V189H-2V162H17V138H36V115H55V162H72V600Z" fill="var(--panggung-tengah)" />
        <path d="M0 189H64M18 164H56M27 215V600M45 215V600" stroke="currentColor" strokeWidth=".7" opacity=".65" />
      </g>)}
      <path d="M45 295H385V600H45Z" fill="var(--panggung-tengah)" />
      <path d="M70 304H360M92 315H338" stroke="currentColor" strokeWidth=".7" opacity=".45" />
    </> : <>
      <path d="M-24 326C89 306 147 330 215 316C283 330 341 306 454 326V600H-24Z" fill="var(--panggung-dekat)" />
      <path d="M-24 327C90 307 146 331 215 317C284 331 340 307 454 327" stroke="currentColor" strokeWidth=".8" />
      {[64, 366].map((x,i)=><g data-adegan-motif className="event-feuille" key={x} transform={`translate(${x} 280) scale(${i ? -1 : 1} 1)`} fill="var(--panggung-dekat)"><path d="M0 80Q18 15 0-55Q-30-62-20-29Q-48-40-42-10Q-20 10-6 5Q-4 40-15 65Z" /></g>)}
    </>}
  </svg>;
}

function LatarLangit({ lapis }: { lapis: number }) {
  return <svg viewBox="0 0 430 340" preserveAspectRatio="xMidYMax meet" fill="none" className={`event-lukisan${lapis === 0 ? " event-langit-beredar" : ""}`} aria-hidden="true">
    {lapis === 0 ? <>
      <path data-adegan-motif d="M146 34C110 26 78 53 78 88C78 127 117 153 151 136C119 135 99 107 103 78C106 58 121 43 146 34Z" transform="translate(190 5) scale(.8)" stroke="currentColor" strokeWidth=".8" fill="currentColor" fillOpacity=".08" />
      {Array.from({length:12},(_,i)=><circle key={i} className="event-bintang-kecil" cx={20+i*71%390} cy={20+i*43%190} r={i%3?1:1.7} fill="currentColor" style={{"--i":i} as CSSProperties} />)}
    </> : lapis === 1 ? <>
      <path d="M-40 340C60 218 370 218 470 340V600H-40Z" fill="var(--panggung-tengah)" opacity=".45" />
      <path d="M-40 340C60 218 370 218 470 340" stroke="currentColor" strokeWidth=".8" opacity=".65" />
      <path d="M38 176L96 137L146 167L217 104L282 131L365 74" stroke="currentColor" strokeWidth=".6" opacity=".55" />
      {[38,96,146,217,282,365].map((x,i)=><circle key={x} cx={x} cy={[176,137,167,104,131,74][i]} r="2.2" fill="currentColor" />)}
    </> : <>
      <path d="M-30 360C120 265 310 265 460 360V600H-30Z" fill="var(--panggung-dekat)" />
      <path d="M-30 360C120 265 310 265 460 360" stroke="currentColor" strokeWidth="1" />
      <circle className="event-bintang-kecil" cx="333" cy="233" r="3" fill="currentColor" />
    </>}
  </svg>;
}

function LatarTembaga({ lapis }: { lapis: number }) {
  return <svg viewBox="0 0 430 340" preserveAspectRatio="xMidYMax meet" fill="none" className="event-lukisan" aria-hidden="true">
    {lapis === 0 ? <><path d="M-24 302H454V600H-24Z" fill="var(--panggung-jauh)" opacity=".45" /><g stroke="currentColor" strokeWidth=".7" opacity=".4"><circle data-adegan-motif cx="306" cy="102" r="35" fill="var(--panggung-jauh)" /><circle data-adegan-motif cx="306" cy="102" r="43" strokeDasharray="1 6" /><path d="M-24 302H454" opacity=".5" /></g></> : <g data-adegan-motif stroke="currentColor" strokeWidth=".9"><path d="M104 269A96 96 0 0 1 296 269Z" fill="var(--panggung-jauh)" fillOpacity=".35" /><path d="M112 269A88 88 0 0 1 288 269" />{Array.from({length:9},(_,i)=><path key={i} d="M112 269H200" transform={`rotate(${i*22.5} 200 269)`} opacity=".55" />)}<circle cx="200" cy="269" r="4" fill="currentColor" /><path d="M95 279H305M120 287H280" opacity=".6" /></g>}
  </svg>;
}

export function Panggung({ tema, bagian }: { tema: TemplateKey; bagian: BagianId }) {
  if (bagian !== "tentang" && bagian !== "penutup") return null;
  const Latar = { melati: LatarPaviliun, keraton: LatarKeraton, bintang: LatarLangit, pasundan: LatarTembaga }[tema];
  const kecepatan = tema === "pasundan" ? [.14, -.08] : [.22, .06, -.14];
  return <div className={`event-panggung event-panggung-${tema}`} aria-hidden="true">
    <div className="event-adegan" data-adegan>{kecepatan.map((speed,i)=><div className={`event-kedalaman event-kedalaman-${i}`} key={i} data-parallax={speed} style={{"--kedalaman":speed} as CSSProperties}><Latar lapis={i} /></div>)}</div>
  </div>;
}

export function Sambungan({ tema, variasi, bagian }: { tema: TemplateKey; variasi: number; bagian: BagianId }) {
  const pola = ["acara", "agenda", "rsvp"].includes(bagian) ? 0 : ["salam", "pengisi"].includes(bagian) ? 1 : 2;
  const ragam = ({
    melati: ["serambi", "kisi", "teras"],
    keraton: ["gerbang", "tumpal", "pilar"],
    bintang: ["orbit", "rasi", "prisma"],
    pasundan: ["faset", "kipas", "jenjang"],
  } as const)[tema][pola];
  const bentuk = {
    serambi: "M0 106H66V88H122V72H308V88H364V106H430V150H0Z",
    kisi: "M0 110H430V150H0Z",
    teras: "M0 114H38V102H70V90H360V102H392V114H430V150H0Z",
    gerbang: "M0 112H78V80H130V54L215 18L300 54V80H352V112H430V150H0Z",
    tumpal: "M0 104L43 62L86 104L129 62L172 104L215 62L258 104L301 62L344 104L387 62L430 104V150H0Z",
    pilar: "M0 56H30V98H58V112H372V98H400V56H430V150H0Z",
    orbit: "M-20 105Q215-46 450 105V150H-20Z",
    rasi: "M0 110H430V150H0Z",
    prisma: "M0 108L112 56L215 102L320 56L430 108V150H0Z",
    faset: "M0 108L88 44L215 92L342 44L430 108V150H0Z",
    kipas: "M0 104H144A71 71 0 0 1 286 104H430V150H0Z",
    jenjang: "M0 112H88V96H132V80H176V64H254V80H298V96H342V112H430V150H0Z",
  }[ragam]!;
  const lembut = ragam === "kisi" || ragam === "rasi";
  const gradasi = `sambungan-${tema}-${variasi}`;
  return <svg className={`event-sambungan event-sambungan-${tema}`} data-bentuk={ragam} viewBox="0 0 430 150" preserveAspectRatio="none" aria-hidden="true">
    {lembut ? <><defs><linearGradient id={gradasi} x2="0" y2="1"><stop stopColor="var(--bidang-berikut)" stopOpacity="0" /><stop offset="1" stopColor="var(--bidang-berikut)" /></linearGradient></defs><path d="M0 0H430V112H0Z" fill={`url(#${gradasi})`} /></> : null}
    <path d={bentuk} fill="var(--bidang-berikut)" className="event-sambungan-dasar" />
    {!lembut ? <path d={bentuk.split("V150")[0]} fill="none" stroke="currentColor" strokeWidth=".65" opacity=".35" /> : null}
    {tema === "melati" ? <g stroke="currentColor" strokeWidth=".7" opacity=".4" fill="none"><path d="M20 128H410M42 138H388" />{[90,170,250,330].map(x=><path key={x} d={`M${x} 94l7 10-7 10-7-10Z`} />)}</g> : null}
    {tema === "keraton" ? <g fill="none" stroke="currentColor" strokeWidth=".8" opacity=".4"><path d="M12 134H418" /><path d="M207 112l8-8 8 8-8 8Z" /></g> : null}
    {tema === "bintang" ? <g stroke="currentColor" strokeWidth=".7" opacity=".6"><path d="M36 101L114 67L183 96L264 50L328 82L399 61" fill="none" />{[36,114,183,264,328,399].map((x,i)=><circle key={x} cx={x} cy={[101,67,96,50,82,61][i]} r="1.8" fill="currentColor" />)}</g> : null}
    {tema === "pasundan" ? <g stroke="currentColor" strokeWidth=".7" opacity=".4" fill="none">{ragam === "kipas" ? <>{Array.from({length:7},(_,i)=><path key={i} d="M157 104H215" transform={`rotate(${i*30} 215 104)`} />)}</> : <path d="M24 129H144L215 108L286 129H406M42 139H388" />}</g> : null}
  </svg>;
}
