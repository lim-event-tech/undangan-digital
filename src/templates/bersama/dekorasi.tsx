import { memo } from "react";
import type { BagianId } from "@/lib/invitations/content";
import type { TemplateKey } from "@/templates/registry";

export const DefinisiDekorasi = memo(function DefinisiDekorasi({ tema, id }: { tema: TemplateKey; id: string }) {
  return <svg className="event-definisi-dekorasi" width="0" height="0" aria-hidden="true" focusable="false"><defs>
    <symbol id={`${id}-untai`} viewBox="0 0 80 180" fill="none" stroke="currentColor" strokeWidth="1">
      {tema === "melati" ? <><path d="M40 0V73M40 141V160" /><circle cx="40" cy="53" r="4" /><path d="M24 102C24 86 31 78 40 73C49 78 56 86 56 102V133H24ZM18 133H62M22 140H58M40 85V129M31 96H49M31 110H49" /><path d="M40 160l5 7-5 7-5-7Z" fill="currentColor" fillOpacity=".25" /></> : tema === "keraton" ? <><path d="M40 0V66M40 126V153" /><path d="M40 66L61 96L40 126L19 96ZM40 77L53 96L40 115L27 96Z" /><circle cx="40" cy="49" r="4" /><path d="M30 146V165M40 146V174M50 146V165M30 146Q40 140 50 146" /><circle cx="40" cy="96" r="3" fill="currentColor" /></> : tema === "bintang" ? <><path d="M27 35V47M21 41H33M53 105V119M46 112H60" strokeLinecap="round" /><circle cx="58" cy="22" r="1.6" fill="currentColor" /><circle cx="20" cy="78" r="1.1" fill="currentColor" /><circle cx="62" cy="75" r="1.8" fill="currentColor" /><circle cx="28" cy="148" r="1.4" fill="currentColor" /></> : <><path d="M40 0V76M40 131V156" /><circle cx="40" cy="53" r="9" /><circle cx="40" cy="53" r="4" /><path d="M14 119A26 26 0 0 1 66 119ZM20 119A20 20 0 0 1 60 119M40 93V119M22 101L40 119L58 101M12 126H68M24 133H56" /><path d="M40 156l6 8-6 8-6-8Z" fill="currentColor" fillOpacity=".15" /></>}
    </symbol>
    <symbol id={`${id}-ragam`} viewBox="0 0 160 160" fill="none" stroke="currentColor" strokeWidth="1">
      {tema === "melati" ? <><path d="M34 135C36 82 74 34 130 25M43 105C20 103 15 86 18 73C36 74 45 85 43 105ZM54 83C43 60 49 43 62 36C75 54 72 69 54 83ZM75 61C71 41 82 24 97 20C102 41 95 55 75 61ZM46 99C65 79 83 84 89 96C75 112 59 114 46 99ZM69 70C89 56 108 62 111 77C94 88 80 85 69 70ZM101 40C112 23 131 20 143 30C134 47 119 53 101 40Z" /><path d="M45 118C70 118 85 131 94 144" opacity=".45" /></> : tema === "keraton" ? <><path d="M80 22L138 80L80 138L22 80Z" opacity=".45" /><ellipse cx="80" cy="55" rx="15" ry="26" /><ellipse cx="80" cy="105" rx="15" ry="26" /><ellipse cx="55" cy="80" rx="26" ry="15" /><ellipse cx="105" cy="80" rx="26" ry="15" /><path d="M80 69l11 11-11 11-11-11Z" fill="currentColor" fillOpacity=".18" /><path d="M80 9V17M80 143V151M9 80H17M143 80H151" /></> : tema === "bintang" ? <><path d="M22 116L52 85L77 99L113 53L140 35" opacity=".45" /><circle cx="22" cy="116" r="2" fill="currentColor" /><circle cx="52" cy="85" r="2.8" fill="currentColor" /><circle cx="77" cy="99" r="1.7" fill="currentColor" /><circle cx="113" cy="53" r="2.4" fill="currentColor" /><circle cx="140" cy="35" r="1.5" fill="currentColor" /><path d="M39 36V48M33 42H45M124 115V125M119 120H129" strokeLinecap="round" /></> : <><circle cx="80" cy="80" r="58" opacity=".45" /><path d="M28 111A52 52 0 0 1 132 111ZM36 111A44 44 0 0 1 124 111M80 60V111M44 75L80 111L116 75M30 91L80 111L130 91M80 111l-19-45M80 111l19-45M23 120H137" /><circle cx="80" cy="111" r="4" fill="currentColor" /><path d="M80 13l5 7-5 7-5-7Z" /></>}
    </symbol>
  </defs></svg>;
});

export const DekorasiEvent = memo(function DekorasiEvent({ id, bagian }: { id: string; bagian: BagianId }) {
  const tengah = ["sampul", "salam", "acara", "pengisi", "rsvp", "penyelenggara", "penutup"].includes(bagian);
  const jenis = ["tentang", "agenda", "pengisi", "penyelenggara", "kontak"].includes(bagian) ? "ragam" : "untai";
  const sisi = tengah ? ["kiri", "kanan"] : ["kanan"];
  const lebar = jenis === "untai" ? 80 : 160;
  return <div className={`event-dekorasi event-dekorasi-${tengah ? "tengah" : "tepi"}`} aria-hidden="true">
    {sisi.map(arah => <svg key={arah} className={`event-dekorasi-${jenis} event-dekorasi-${arah}`} viewBox={`0 0 ${lebar} ${jenis === "untai" ? 180 : 160}`} focusable="false" data-sisi={arah}><use href={`#${id}-${jenis}`} transform={arah === "kiri" ? `translate(${lebar} 0) scale(-1 1)` : undefined} /></svg>)}
  </div>;
});
