import type { CreateWabaTemplatePayload } from "./client";

export interface WabaTemplatePreset {
  id: string;
  label: string;
  deskripsi: string;
  payload: CreateWabaTemplatePayload;
}

export const WABA_TEMPLATE_PRESETS: WabaTemplatePreset[] = [
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

export type TemplateVariableContext = {
  guestName: string;
  eventTitle: string;
  deadlinePhrase: string;
  link: string;
  token: string;
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

/**
 * Memetakan variabel secara dinamis berdasarkan pola {{1}}, {{2}}, dst pada bodyText template Meta.
 * Jika hanya ada 1 variabel {{1}}, otomatis menggunakan format gabungan 1 variabel tanpa line break.
 */
export function buildWabaBodyParameters(
  bodyText: string,
  context: TemplateVariableContext,
): string[] {
  // Hitung index variabel terbesar di dalam teks (misal {{1}}, {{2}}, {{3}}, {{4}})
  const matches = bodyText.matchAll(/\{\{(\d+)\}\}/g);
  let maxVarIndex = 0;
  for (const m of matches) {
    const idx = parseInt(m[1], 10);
    if (idx > maxVarIndex) maxVarIndex = idx;
  }

  // Jika template hanya memiliki 1 variabel {{1}} (standar LIM-RSVP)
  if (maxVarIndex <= 1) {
    const baseText =
      context.fullMessage ||
      `Yth. ${context.guestName}, Kami mengundang Anda untuk menghadiri ${context.eventTitle}. Detail acara dan konfirmasi kehadiran di link pribadi: ${context.link}. Mohon konfirmasi kehadiran ${context.deadlinePhrase}. Terima kasih.`;
    return [formatWabaSingleVariableContent(baseText)];
  }

  // Multi-variabel (format khusus / lama dengan placeholder terpisah)
  const values: string[] = [
    context.guestName,
    context.eventTitle,
    context.deadlinePhrase || "Mohon konfirmasi kehadiran",
    context.link,
  ];

  const result: string[] = [];
  for (let i = 0; i < maxVarIndex; i++) {
    result.push(values[i] ?? context.link);
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
): { header?: string; body: string; footer?: string; isImageHeader?: boolean } {
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
