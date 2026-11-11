import type { AppDb } from "@/db/types";
import { appBaseUrl } from "@/lib/app-url";
import { isSmtpReady } from "./config";
import { getSmtpConfig } from "./service";
import { sendViaSmtp, type MailMessage, type MailResult } from "./smtp";

export async function sendMail(db: AppDb, message: MailMessage): Promise<MailResult> {
  const config = await getSmtpConfig(db);
  if (!isSmtpReady(config)) return { ok: false, error: "Pengiriman surel belum diaktifkan oleh admin." };
  return sendViaSmtp(config, message, { domain: new URL(appBaseUrl()).hostname });
}

export async function isMailReady(db: AppDb): Promise<boolean> {
  return isSmtpReady(await getSmtpConfig(db));
}
