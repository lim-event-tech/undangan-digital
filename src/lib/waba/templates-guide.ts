import type { CreateWabaTemplatePayload } from "./client";

export interface WabaTemplatePreset {
  id: string;
  label: string;
  deskripsi: string;
  payload: CreateWabaTemplatePayload;
}

export const WABA_TEMPLATE_PRESETS: WabaTemplatePreset[] = [
  {
    id: "undangan_resmi_tombol",
    label: "Undangan Resmi 4 Variabel + Tombol Link Pribadi (Direkomendasikan)",
    deskripsi:
      "Format resmi dengan Header Gambar, 4 variabel terstruktur ({{1}} s/d {{4}}), dan tombol URL undangan pribadi.",
    payload: {
      name: "lim_undangan_resmi_tombol",
      category: "UTILITY",
      language: "id",
      headerFormat: "IMAGE",
      bodyText:
        "Halo {{1}},\n\nKami bermaksud mengundang Bapak/Ibu di acara {{2}}.\n\nKonfirmasi kehadiran {{3}}.\n\n{{4}}. Semoga berkenan dan terimakasih.",
      footerText: "LIM-RSVP · Lingkar Ide Manajemen",
      buttons: [
        {
          type: "URL",
          text: "Buka Undangan",
          url: "https://rsvp.lingkaride.com/{{1}}",
          example: ["demo-token"],
        },
      ],
    },
  },
  {
    id: "undangan_resmi",
    label: "Undangan Resmi LIM-RSVP (Header Gambar & Tanpa Tombol)",
    deskripsi:
      "Format baku LIM-RSVP: 1 Header Gambar (poster/cover acara), tanpa tombol, dan 1 variabel konten gabungan {{1}} tanpa line break.",
    payload: {
      name: "lim_undangan_resmi",
      category: "UTILITY",
      language: "id",
      headerFormat: "IMAGE",
      bodyText: "{{1}}",
      footerText: "LIM-RSVP · Lingkar Ide Manajemen",
    },
  },
  {
    id: "pengingat_rsvp",
    label: "Pengingat Tamu LIM-RSVP (Header Gambar & Tanpa Tombol)",
    deskripsi:
      "Format pengingat konfirmasi RSVP resmi: 1 Header Gambar, tanpa tombol, dan 1 variabel konten {{1}} tanpa line break.",
    payload: {
      name: "lim_pengingat_tamu",
      category: "UTILITY",
      language: "id",
      headerFormat: "IMAGE",
      bodyText: "{{1}}",
      footerText: "LIM-RSVP · Lingkar Ide Manajemen",
    },
  },
  {
    id: "undangan_gathering",
    label: "Undangan Gathering LIM-RSVP (Header Gambar & Tanpa Tombol)",
    deskripsi:
      "Format temu/gathering santai dengan Header Gambar, tanpa tombol, dan 1 variabel konten {{1}} tanpa line break.",
    payload: {
      name: "lim_acara_gathering",
      category: "UTILITY",
      language: "id",
      headerFormat: "IMAGE",
      bodyText: "{{1}}",
      footerText: "LIM-RSVP",
    },
  },
];

export const WABA_APP_VARIABLES = [
  { key: "nama", label: "Nama tamu" },
  { key: "event", label: "Judul event" },
  { key: "batas_rsvp", label: "Batas RSVP" },
  { key: "link", label: "Link pribadi" },
  { key: "penyelenggara", label: "Penyelenggara" },
  { key: "jenis_acara", label: "Jenis acara" },
  { key: "grup", label: "Grup tamu" },
] as const;

export type TemplateVariableContext = {
  guestName: string;
  eventTitle: string;
  deadlinePhrase: string;
  link: string;
  token: string;
  organizerName?: string;
  eventType?: string;
  guestGroup?: string;
  variableMappings?: Record<string, string>;
  fullMessage?: string;
};

/**
 * Mengolah teks pesan menjadi 1 variabel konten gabungan untuk Meta WABA.
 * Menghilangkan seluruh line break (\r\n, \r, \n) dan menormalkan spasi
 * sehingga sesuai regulasi ketat Meta Cloud API untuk parameter variabel.
 */
export function formatWabaSingleVariableContent(rawMessage: string): string {
  return rawMessage
    .split(/\r\n|\r|\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

export function extractWabaVariableIndices(bodyText: string): number[] {
  const found = new Set<number>();
  for (const m of bodyText.matchAll(/\{\{(\d+)\}\}/g)) {
    const idx = parseInt(m[1], 10);
    if (idx >= 1 && idx <= 20) found.add(idx);
  }
  return Array.from(found).sort((a, b) => a - b);
}

const DEFAULT_MULTI_VAR_EXPRESSIONS = [
  "{nama}",
  "{event}",
  "{batas_rsvp}",
  "{link}",
];

export function defaultWabaVariableMappings(maxVarIndex: number): Record<string, string> {
  if (maxVarIndex <= 1) return {};
  const result: Record<string, string> = {};
  for (let i = 1; i <= maxVarIndex; i++) {
    result[String(i)] = DEFAULT_MULTI_VAR_EXPRESSIONS[i - 1] ?? "{link}";
  }
  return result;
}

export function renderWabaVariableExpression(
  expression: string,
  context: TemplateVariableContext,
): string {
  const replacements: Record<string, string> = {
    nama: context.guestName,
    event: context.eventTitle,
    batas_rsvp: context.deadlinePhrase || "secepatnya",
    link: context.link,
    penyelenggara: context.organizerName || "",
    jenis_acara: context.eventType || "",
    grup: context.guestGroup || "",
  };
  const replaced = expression.replace(
    /\{(nama|event|batas_rsvp|link|penyelenggara|jenis_acara|grup)\}/g,
    (_m, key: string) => replacements[key] ?? "",
  );
  return formatWabaSingleVariableContent(replaced) || "-";
}

/**
 * Memetakan variabel secara dinamis berdasarkan pola {{1}}, {{2}}, dst pada bodyText template Meta.
 * Jika hanya ada 1 variabel {{1}}, otomatis menggunakan format gabungan 1 variabel tanpa line break
 * (kecuali pemilik mengisi mapping variabel {{1}} secara khusus).
 */
export function buildWabaBodyParameters(
  bodyText: string,
  context: TemplateVariableContext,
): string[] {
  const indices = extractWabaVariableIndices(bodyText);
  const maxVarIndex = indices.length > 0 ? indices[indices.length - 1] : 0;

  // Jika template hanya memiliki 1 variabel {{1}} (standar LIM-RSVP)
  if (maxVarIndex <= 1) {
    const customSingle = context.variableMappings?.["1"]?.trim();
    if (customSingle) {
      return [renderWabaVariableExpression(customSingle, context)];
    }
    const baseText =
      context.fullMessage ||
      `Yth. ${context.guestName}, Kami mengundang Anda untuk menghadiri ${context.eventTitle}. Detail acara dan konfirmasi kehadiran di link pribadi: ${context.link}. Mohon konfirmasi kehadiran ${context.deadlinePhrase}. Terima kasih.`;
    return [formatWabaSingleVariableContent(baseText)];
  }

  // Multi-variabel: gunakan mapping dari pemilik undangan bila ada, atau fallback ke default
  const defaults = defaultWabaVariableMappings(maxVarIndex);
  const result: string[] = [];
  for (let i = 1; i <= maxVarIndex; i++) {
    const key = String(i);
    const expr = context.variableMappings?.[key]?.trim() || defaults[key] || "{link}";
    result.push(renderWabaVariableExpression(expr, context));
  }

  return result;
}

/**
 * Merender simulasi tampilan pesan WhatsApp
 */
export function renderTemplatePreview(
  bodyText: string,
  context: TemplateVariableContext,
  headerContent?: string,
  footerText?: string,
  headerFormat?: "NONE" | "TEXT" | "IMAGE" | "DOCUMENT",
  buttonText?: string,
): { header?: string; body: string; footer?: string; isImageHeader?: boolean; buttonText?: string } {
  let renderedBody = bodyText;
  const params = buildWabaBodyParameters(bodyText, context);

  params.forEach((val, idx) => {
    renderedBody = renderedBody.replaceAll(`{{${idx + 1}}}`, val);
  });

  const isImage = headerFormat === "IMAGE" || (!headerContent && headerFormat !== "NONE" && headerFormat !== "TEXT");

  return {
    header: headerFormat === "TEXT" ? headerContent?.trim() || undefined : undefined,
    body: renderedBody,
    footer: footerText?.trim() || undefined,
    isImageHeader: isImage,
    buttonText: buttonText?.trim() || undefined,
  };
}

/**
 * Validasi nama template Meta
 * Aturan: hanya huruf kecil, angka, dan underscore, panjang 1 - 512 karakter
 */
export function validateTemplateName(name: string): { ok: true; name: string } | { ok: false; error: string } {
  const trimmed = name.trim().toLowerCase();
  if (!trimmed) {
    return { ok: false, error: "Nama template wajib diisi." };
  }
  if (!/^[a-z0-9_]+$/.test(trimmed)) {
    return {
      ok: false,
      error: "Nama template hanya boleh menggunakan huruf kecil (a-z), angka (0-9), dan garis bawah (_).",
    };
  }
  if (trimmed.length > 512) {
    return { ok: false, error: "Nama template maksimal 512 karakter." };
  }
  return { ok: true, name: trimmed };
}
