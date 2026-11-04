import type { TemplateKey } from "@/templates/registry";

export function HiasanEvent({ tema }: { tema: TemplateKey }) {
  return (
    <svg className="event-hiasan" viewBox="0 0 240 180" fill="none" aria-hidden="true">
      {tema === "melati" ? (
        <g stroke="currentColor" strokeWidth="1.2">
          <circle cx="120" cy="90" r="61" opacity=".25" />
          <path d="M48 159C112 129 147 88 179 22M73 145C88 109 67 89 59 82C47 104 51 126 73 145ZM103 120C139 120 153 136 153 146C129 149 111 140 103 120ZM118 99C117 73 98 61 89 61C86 83 100 96 118 99ZM144 67C165 80 187 77 196 69C183 52 164 54 144 67ZM161 47C156 28 142 21 133 22C131 38 144 46 161 47Z" />
          <path d="M38 46h22M49 35v22M193 123h16M201 115v16" opacity=".4" />
          <circle cx="53" cy="63" r="2" fill="currentColor" stroke="none" />
          <circle cx="189" cy="109" r="2" fill="currentColor" stroke="none" />
        </g>
      ) : tema === "keraton" ? (
        <g stroke="currentColor" strokeWidth="1.1">
          <path d="M41 151V70L120 21L199 70V151H41ZM53 139V77L120 36L187 77V139H53ZM66 139V85L120 51L174 85V139" />
          <path d="M85 139V95L120 73L155 95V139M103 139V105L120 94L137 105V139M26 151H214M120 8V21M33 65L41 70M207 65L199 70" />
          <path d="M28 102l7 7-7 7-7-7 7-7ZM212 102l7 7-7 7-7-7 7-7ZM113 160l7-7 7 7-7 7-7-7Z" fill="currentColor" fillOpacity=".18" />
        </g>
      ) : tema === "bintang" ? (
        <g stroke="currentColor" strokeWidth=".9">
          <circle cx="120" cy="90" r="57" opacity=".6" />
          <circle cx="120" cy="90" r="72" strokeDasharray="2 8" opacity=".45" />
          <ellipse cx="120" cy="90" rx="105" ry="31" transform="rotate(-28 120 90)" />
          <path d="M120 55l7 27 27 8-27 8-7 27-7-27-27-8 27-8 7-27Z" fill="currentColor" fillOpacity=".1" />
          <path d="M49 28v14M42 35h14M194 133v18M185 142h18M182 27v10M177 32h10" />
          <circle cx="45" cy="122" r="3" fill="currentColor" stroke="none" />
          <circle cx="182" cy="54" r="3" fill="currentColor" stroke="none" />
        </g>
      ) : (
        <g stroke="currentColor" strokeWidth="1.2">
          <circle cx="120" cy="61" r="27" fill="currentColor" fillOpacity=".12" stroke="none" />
          <path d="M16 126C41 126 48 78 78 78C109 78 114 126 145 126C174 126 178 101 208 101H225M16 139C48 139 55 91 78 91C102 91 111 139 145 139C177 139 182 114 208 114H225M16 152C56 152 62 104 78 104C94 104 108 152 145 152C181 152 186 127 208 127H225" />
          <path d="M28 71C42 57 56 61 63 71C49 82 35 80 28 71ZM174 53C182 37 198 36 210 41C203 58 186 63 174 53Z" fill="currentColor" fillOpacity=".12" />
          <path d="M35 71H61M179 51L207 42" />
        </g>
      )}
    </svg>
  );
}
