export function phoneToJid(phone: string): string {
  return `${phone.replace(/\D/g, "")}@s.whatsapp.net`;
}
