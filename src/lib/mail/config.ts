import type { FieldErrors } from "@/lib/save-result";

export const SMTP_SECURITY = ["ssl", "starttls", "tanpa"] as const;
export type SmtpSecurity = (typeof SMTP_SECURITY)[number];

export const SMTP_LIMITS = { host: 253, user: 254, password: 512, name: 80, email: 254 } as const;

export type SmtpConfig = {
  aktif: boolean;
  host: string;
  port: number;
  keamanan: SmtpSecurity;
  user: string;
  password: string;
  dariNama: string;
  dariEmail: string;
};

export const DEFAULT_SMTP: SmtpConfig = {
  aktif: false,
  host: "",
  port: 587,
  keamanan: "starttls",
  user: "",
  password: "",
  dariNama: "LIM-RSVP",
  dariEmail: "",
};

const HOST = /^[a-z0-9]([a-z0-9.-]*[a-z0-9])?$/i;
const EMAIL = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/;

export function isEmailAddress(value: string): boolean {
  return value.length <= SMTP_LIMITS.email && EMAIL.test(value);
}

export function isSmtpReady(config: SmtpConfig): boolean {
  return config.aktif && config.host !== "" && isEmailAddress(config.dariEmail);
}

export type StoredSmtp = Omit<SmtpConfig, "password"> & { passwordEnc: string };

export function readStoredSmtp(raw: unknown): StoredSmtp {
  const source = typeof raw === "object" && raw !== null && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const text = (value: unknown, max: number) => (typeof value === "string" ? value.slice(0, max) : "");
  const port = typeof source.port === "number" && Number.isInteger(source.port) && source.port >= 1 && source.port <= 65535 ? source.port : DEFAULT_SMTP.port;
  return {
    aktif: source.aktif === true,
    host: text(source.host, SMTP_LIMITS.host),
    port,
    keamanan: (SMTP_SECURITY as readonly unknown[]).includes(source.keamanan) ? (source.keamanan as SmtpSecurity) : DEFAULT_SMTP.keamanan,
    user: text(source.user, SMTP_LIMITS.user),
    dariNama: text(source.dariNama, SMTP_LIMITS.name) || DEFAULT_SMTP.dariNama,
    dariEmail: text(source.dariEmail, SMTP_LIMITS.email),
    passwordEnc: text(source.passwordEnc, 2000),
  };
}

export type ParsedSmtpForm =
  | { ok: true; input: Omit<SmtpConfig, "password">; password: string | null; hapusPassword: boolean }
  | { ok: false; errors: FieldErrors };

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export function parseSmtpForm(formData: FormData): ParsedSmtpForm {
  const errors: FieldErrors = {};
  const host = field(formData, "host").toLowerCase();
  if (host && (host.length > SMTP_LIMITS.host || !HOST.test(host))) errors.host = "Nama server tidak valid, contoh: smtp.example.com";

  const portText = field(formData, "port");
  const port = /^\d{1,5}$/.test(portText) ? Number(portText) : NaN;
  if (!(port >= 1 && port <= 65535)) errors.port = "Port harus 1 sampai 65535";

  const keamananRaw = field(formData, "keamanan");
  if (!(SMTP_SECURITY as readonly string[]).includes(keamananRaw)) errors.keamanan = "Pilih jenis koneksi";

  const user = field(formData, "user");
  if (user.length > SMTP_LIMITS.user || /[\r\n]/.test(user)) errors.user = "Nama pengguna tidak valid";

  const passwordRaw = formData.get("password");
  const password = typeof passwordRaw === "string" ? passwordRaw : "";
  if (password.length > SMTP_LIMITS.password || /[\r\n]/.test(password)) errors.password = "Kata sandi tidak valid";

  const dariNama = field(formData, "dariNama").replace(/[\r\n"<>]/g, " ").trim().slice(0, SMTP_LIMITS.name);
  const dariEmail = field(formData, "dariEmail").toLowerCase();
  if (dariEmail && !isEmailAddress(dariEmail)) errors.dariEmail = "Alamat pengirim tidak valid";

  const aktif = formData.get("aktif") !== null;
  if (aktif && !host) errors.host = "Isi nama server sebelum mengaktifkan";
  if (aktif && !dariEmail) errors.dariEmail = "Isi alamat pengirim sebelum mengaktifkan";

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return {
    ok: true,
    input: { aktif, host, port, keamanan: keamananRaw as SmtpSecurity, user, dariNama: dariNama || DEFAULT_SMTP.dariNama, dariEmail },
    password: password === "" ? null : password,
    hapusPassword: formData.get("hapusPassword") !== null,
  };
}
