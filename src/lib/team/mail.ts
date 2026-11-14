import { formatDate } from "@/lib/datetime";
import type { MailMessage } from "@/lib/mail/smtp";

type InviteMailInput = {
  to: string;
  title: string;
  ownerName: string;
  link: string;
  expiresAt: Date;
  role?: "anggota" | "pemilik";
};

const HTML_ESCAPES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => HTML_ESCAPES[c]);
}

function batasTanggal(expiresAt: Date): string {
  return formatDate(new Date(expiresAt.getTime() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10));
}

function peranTeks(role: "anggota" | "pemilik"): { ringkas: string; hak: string[] } {
  if (role === "pemilik") {
    return {
      ringkas: "pemilik tim",
      hak: [
        "Mengelola isi undangan, daftar tamu, dan pengiriman lewat WhatsApp",
        "Melihat ringkasan RSVP seluruh tamu",
        "Mengundang dan mengatur anggota tim lainnya",
      ],
    };
  }
  return {
    ringkas: "anggota tim",
    hak: [
      "Menambahkan daftar tamu Anda sendiri",
      "Mengirim undangan ke tamu Anda lewat WhatsApp",
      "Melihat RSVP tamu yang Anda tambahkan",
    ],
  };
}

export function inviteMail(input: InviteMailInput): MailMessage {
  const batas = batasTanggal(input.expiresAt);
  const peran = peranTeks(input.role ?? "anggota");
  const subject = `${input.ownerName} mengundang Anda ke tim "${input.title}"`;

  const text = [
    `Halo,`,
    ``,
    `${input.ownerName} mengundang Anda bergabung sebagai ${peran.ringkas} untuk undangan "${input.title}" di LIM-RSVP.`,
    ``,
    `Dengan bergabung, Anda dapat:`,
    ...peran.hak.map((item) => `- ${item}`),
    ``,
    `Bergabung sekarang (cukup masuk dengan Google, tanpa langkah tambahan):`,
    input.link,
    ``,
    `Tautan berlaku sampai ${batas} dan hanya bisa dipakai sekali. Abaikan surel ini bila Anda tidak merasa diundang.`,
    ``,
    `LIM-RSVP`,
  ].join("\n");

  const judul = escapeHtml(input.title);
  const pemilik = escapeHtml(input.ownerName);
  const link = escapeHtml(input.link);
  const hakHtml = peran.hak
    .map(
      (item) =>
        `<tr><td style="padding:0 10px 8px 0;vertical-align:top;color:#a8853f;font-size:15px;line-height:22px;">&#9670;</td><td style="padding:0 0 8px 0;font-size:15px;line-height:22px;color:#3d3731;">${escapeHtml(item)}</td></tr>`,
    )
    .join("");

  const html = `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only">
<title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background-color:#f3eddd;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${pemilik} mengundang Anda bergabung ke tim ${judul}. Masuk dengan Google dan langsung mulai.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f3eddd;">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">
<tr><td align="center" style="padding:0 0 20px 0;font-family:Georgia,'Times New Roman',serif;font-size:22px;letter-spacing:3px;color:#6b5122;font-weight:bold;">LIM-RSVP</td></tr>
<tr><td style="background-color:#ffffff;border:1px solid #e4dac7;border-radius:12px;overflow:hidden;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr><td style="height:4px;background-color:#a8853f;font-size:0;line-height:0;">&nbsp;</td></tr>
<tr><td style="padding:36px 36px 8px 36px;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
<p style="margin:0 0 6px 0;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#7d5f28;font-weight:600;">Undangan bergabung</p>
<h1 style="margin:0 0 18px 0;font-family:Georgia,'Times New Roman',serif;font-size:28px;line-height:34px;font-weight:normal;color:#2a2622;">${judul}</h1>
<p style="margin:0 0 20px 0;font-size:15px;line-height:24px;color:#3d3731;"><strong>${pemilik}</strong> mengundang Anda bergabung sebagai <strong>${escapeHtml(peran.ringkas)}</strong> untuk mengelola undangan ini.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f3ece0;border-radius:8px;margin:0 0 24px 0;">
<tr><td style="padding:18px 20px 10px 20px;">
<p style="margin:0 0 10px 0;font-size:13px;font-weight:600;color:#6b5122;">Yang bisa Anda lakukan</p>
<table role="presentation" cellpadding="0" cellspacing="0" border="0">${hakHtml}</table>
</td></tr>
</table>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 8px 0;">
<tr><td align="center" bgcolor="#2a2622" style="border-radius:8px;"><a href="${link}" style="display:inline-block;padding:14px 28px;font-family:'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">Bergabung ke tim</a></td></tr>
</table>
<p style="margin:0 0 24px 0;font-size:13px;line-height:20px;color:#6a6157;">Cukup masuk dengan akun Google Anda. Tidak ada langkah penerimaan lagi di dalam situs.</p>
</td></tr>
<tr><td style="padding:0 36px 32px 36px;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid #eee7da;">
<tr><td style="padding-top:18px;font-size:12px;line-height:19px;color:#6a6157;">Tautan berlaku sampai <strong>${escapeHtml(batas)}</strong> dan hanya bisa dipakai sekali. Bila tombol tidak berfungsi, salin tautan ini ke peramban Anda:<br><a href="${link}" style="color:#7d5f28;word-break:break-all;">${link}</a></td></tr>
</table>
</td></tr>
</table>
</td></tr>
<tr><td align="center" style="padding:20px 8px 0 8px;font-family:'Segoe UI',Helvetica,Arial,sans-serif;font-size:12px;line-height:19px;color:#6a6157;">Surel ini dikirim otomatis oleh LIM-RSVP. Abaikan bila Anda tidak merasa diundang.</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

  return { to: input.to, subject, text, html };
}
