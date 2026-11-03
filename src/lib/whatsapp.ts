export const MAX_MESSAGE_LENGTH = 1000;

export const MESSAGE_PLACEHOLDERS = [
  { key: "nama", label: "Nama tamu" },
  { key: "link", label: "Link pribadi" },
  { key: "batas_rsvp", label: "Batas RSVP" },
  { key: "mempelai", label: "Nama mempelai" },
] as const;

export type MessageVars = {
  nama: string;
  link: string;
  batas_rsvp: string;
  mempelai: string;
};

export const DEFAULT_MESSAGE = `Yth. {nama},

Dengan penuh syukur, kami mengundang Bapak/Ibu/Saudara/i ke pernikahan {mempelai}. Detail acara dan konfirmasi kehadiran ada di link pribadi berikut:
{link}

Mohon konfirmasi kehadiran {batas_rsvp}.

Terima kasih.`;

export const DEFAULT_REMINDER_MESSAGE = `Yth. {nama},

Kami mengingatkan dengan hormat bahwa konfirmasi kehadiran Bapak/Ibu/Saudara/i di pernikahan {mempelai} belum kami terima. Mohon berkenan mengisinya {batas_rsvp} lewat link pribadi berikut:
{link}

Terima kasih.`;

export function renderMessage(template: string, vars: MessageVars): string {
  return template.replace(
    /\{(nama|link|batas_rsvp|mempelai)\}/g,
    (_match, key: keyof MessageVars) => vars[key],
  );
}

export function deadlinePhrase(deadlineText: string | null): string {
  return deadlineText ? `sebelum ${deadlineText}` : "secepatnya";
}

export function whatsappLink(phone: string, message: string): string {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export type MessageCheck = { ok: true; template: string } | { ok: false; error: string };

export function checkMessageTemplate(input: string): MessageCheck {
  const template = input.replace(/\r\n?/g, "\n").trim();
  if (template.length === 0) return { ok: true, template: "" };
  if (template.length > MAX_MESSAGE_LENGTH) {
    return { ok: false, error: `Pesan maksimal ${MAX_MESSAGE_LENGTH} karakter` };
  }
  if (!template.includes("{link}")) {
    return { ok: false, error: "Pesan harus memuat {link} supaya tamu bisa membuka undangannya" };
  }
  return { ok: true, template };
}
