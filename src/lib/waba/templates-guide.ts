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
    label: "Undangan Resmi & Formal (Sangat Direkomendasikan)",
    deskripsi:
      "Format baku untuk acara formal, pernikahan, atau dinas. Dilengkapi tombol tautan langsung ke undangan tamu.",
    payload: {
      name: "lim_undangan_resmi",
      category: "UTILITY",
      language: "id",
      headerFormat: "TEXT",
      headerContent: "Undangan Resmi",
      bodyText:
        "Yth. Bapak/Ibu/Saudara/i {{1}},\n\nKami mengundang Anda untuk menghadiri acara {{2}}.\n\nBatas konfirmasi kehadiran (RSVP): {{3}}.\nBuka tautan undangan digital Anda di bawah ini:\n{{4}}",
      footerText: "LIM-RSVP · Lingkar Ide Manajemen",
      buttons: [
        {
          type: "URL",
          text: "Buka Undangan",
          url: "https://event.lingkaridemanajemen.id/{{1}}",
          example: ["demo-token"],
        },
      ],
    },
  },
  {
    id: "undangan_gathering",
    label: "Undangan Semi-Formal / Gathering / Reuni",
    deskripsi:
      "Gaya sapaan hangat dan santai untuk pertemuan keluarga, temu alumni, atau internal perusahaan.",
    payload: {
      name: "lim_acara_gathering",
      category: "UTILITY",
      language: "id",
      headerFormat: "NONE",
      bodyText:
        "Halo {{1}},\n\nAnda diundang untuk hadir pada agenda {{2}}.\n\nMohon konfirmasi kehadiran sebelum {{3}} melalui tautan undangan berikut:\n{{4}}",
      footerText: "LIM-RSVP",
      buttons: [
        {
          type: "URL",
          text: "Lihat Undangan",
          url: "https://event.lingkaridemanajemen.id/{{1}}",
          example: ["demo-token"],
        },
      ],
    },
  },
  {
    id: "pengingat_rsvp",
    label: "Pengingat Konfirmasi Kehadiran (RSVP Reminder)",
    deskripsi:
      "Format pengingat ramah bagi tamu yang belum mengisi konfirmasi kehadiran.",
    payload: {
      name: "lim_pengingat_tamu",
      category: "UTILITY",
      language: "id",
      headerFormat: "TEXT",
      headerContent: "Pengingat Undangan",
      bodyText:
        "Halo {{1}},\n\nMengingatkan kembali terkait undangan acara {{2}}.\nBatas RSVP adalah {{3}}.\n\nMohon kesediaannya mengisi konfirmasi kehadiran melalui tautan berikut:\n{{4}}",
      footerText: "LIM-RSVP",
      buttons: [
        {
          type: "URL",
          text: "Konfirmasi Kehadiran",
          url: "https://event.lingkaridemanajemen.id/{{1}}",
          example: ["demo-token"],
        },
      ],
    },
  },
];

export type TemplateVariableContext = {
  guestName: string;
  eventTitle: string;
  deadlinePhrase: string;
  link: string;
  token: string;
};

/**
 * Memetakan variabel secara dinamis berdasarkan pola {{1}}, {{2}}, dst pada bodyText template Meta
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

  // Jika tidak ditemukan placeholder sama sekali, default ke 4 variabel standar jika string kosong
  if (maxVarIndex === 0) {
    maxVarIndex = 4;
  }

  // Urutan semantik variabel standar:
  // 1: Nama Tamu
  // 2: Nama Acara
  // 3: Batas RSVP
  // 4: Link Undangan
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
): { header?: string; body: string; footer?: string } {
  let renderedBody = bodyText;
  const params = buildWabaBodyParameters(bodyText, context);

  params.forEach((val, idx) => {
    renderedBody = renderedBody.replaceAll(`{{${idx + 1}}}`, val);
  });

  return {
    header: headerContent?.trim() || undefined,
    body: renderedBody,
    footer: footerText?.trim() || undefined,
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
