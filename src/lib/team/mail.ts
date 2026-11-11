import { formatDate } from "@/lib/datetime";
import type { MailMessage } from "@/lib/mail/smtp";

function escapeHtml(value: string): string {
  return value.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] as string);
}

export function inviteMail(input: { to: string; title: string; ownerName: string; link: string; expiresAt: Date }): MailMessage {
  const batas = formatDate(new Date(input.expiresAt.getTime() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10));
  const text = [
    `Halo,`,
    ``,
    `${input.ownerName} mengundang Anda bergabung ke tim undangan "${input.title}" di UndanganDigital. Anda akan bisa menambahkan daftar undangan Anda sendiri, mengirimnya lewat WhatsApp, dan melakukan check-in. Anda hanya melihat tamu yang Anda tambahkan.`,
    ``,
    `Terima undangan: ${input.link}`,
    ``,
    `Tautan berlaku sampai ${batas} dan hanya bisa dipakai sekali. Abaikan surel ini bila Anda tidak merasa diundang.`,
  ].join("\n");
  const html = `<p>Halo,</p><p><strong>${escapeHtml(input.ownerName)}</strong> mengundang Anda bergabung ke tim undangan <strong>${escapeHtml(input.title)}</strong> di UndanganDigital. Anda akan bisa menambahkan daftar undangan Anda sendiri, mengirimnya lewat WhatsApp, dan melakukan check-in. Anda hanya melihat tamu yang Anda tambahkan.</p><p><a href="${escapeHtml(input.link)}">Terima undangan</a></p><p>Tautan berlaku sampai ${batas} dan hanya bisa dipakai sekali. Abaikan surel ini bila Anda tidak merasa diundang.</p>`;
  return { to: input.to, subject: `Undangan bergabung ke tim "${input.title}"`, text, html };
}
