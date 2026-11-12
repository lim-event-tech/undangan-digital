import nodemailer from "nodemailer";
import { isEmailAddress, type SmtpConfig } from "./config";

export type MailMessage = { to: string; subject: string; text: string; html?: string };
export type MailResult = { ok: true } | { ok: false; error: string };

const TIMEOUT_MS = 20_000;

function clean(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim();
}

export function createTransport(config: SmtpConfig, domain: string) {
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.keamanan === "ssl",
    requireTLS: config.keamanan === "starttls",
    ignoreTLS: config.keamanan === "tanpa",
    auth: config.user ? { user: config.user, pass: config.password } : undefined,
    name: domain,
    connectionTimeout: TIMEOUT_MS,
    greetingTimeout: TIMEOUT_MS,
    socketTimeout: TIMEOUT_MS,
  });
}

export async function sendViaSmtp(config: SmtpConfig, message: MailMessage, options: { domain?: string } = {}): Promise<MailResult> {
  if (!config.host) return { ok: false, error: "Server SMTP belum diisi" };
  if (!isEmailAddress(message.to)) return { ok: false, error: "Alamat tujuan tidak valid" };
  const transport = createTransport(config, options.domain ?? "localhost");
  try {
    await transport.sendMail({
      from: { name: clean(config.dariNama), address: clean(config.dariEmail) },
      to: clean(message.to),
      subject: clean(message.subject),
      text: message.text,
      html: message.html,
    });
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message.slice(0, 300) : "Gagal mengirim surel" };
  } finally {
    transport.close();
  }
}
