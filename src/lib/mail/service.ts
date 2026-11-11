import { eq } from "drizzle-orm";
import { platformSetting } from "@/db/schema";
import type { AppDb } from "@/db/types";
import { DEFAULT_SMTP, readStoredSmtp, type SmtpConfig, type StoredSmtp } from "./config";
import { decryptSecret, encryptSecret } from "./secret";

const KEY = "smtp";

async function readRow(db: AppDb): Promise<StoredSmtp> {
  const [row] = await db.select({ value: platformSetting.value }).from(platformSetting).where(eq(platformSetting.key, KEY));
  return readStoredSmtp(row?.value);
}

export type SmtpView = Omit<SmtpConfig, "password"> & { adaPassword: boolean };

export async function getSmtpView(db: AppDb): Promise<SmtpView> {
  const { passwordEnc, ...rest } = await readRow(db);
  return { ...rest, adaPassword: passwordEnc !== "" };
}

export async function getSmtpConfig(db: AppDb): Promise<SmtpConfig> {
  const { passwordEnc, ...rest } = await readRow(db);
  return { ...DEFAULT_SMTP, ...rest, password: passwordEnc ? (decryptSecret(passwordEnc) ?? "") : "" };
}

export async function saveSmtpConfig(
  db: AppDb,
  input: Omit<SmtpConfig, "password">,
  password: { baru: string | null; hapus: boolean },
): Promise<SmtpView> {
  const current = await readRow(db);
  const passwordEnc = password.hapus ? "" : password.baru !== null ? encryptSecret(password.baru) : current.passwordEnc;
  const next: StoredSmtp = { ...input, passwordEnc };
  await db
    .insert(platformSetting)
    .values({ key: KEY, value: next })
    .onConflictDoUpdate({ target: platformSetting.key, set: { value: next } });
  return getSmtpView(db);
}
