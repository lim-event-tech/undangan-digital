import { z } from "zod";
import { passwordProblem } from "@/lib/auth-messages";
import { MAX_PASSWORD_LENGTH } from "@/lib/auth-options-constants";
import type { SaveResult } from "@/lib/save-result";

export function parseAccountEmail(formData: FormData):
  | { ok: true; email: string; password: string }
  | Extract<SaveResult, { ok: false }> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const errors: Record<string, string> = {};
  if (email.length > 254 || !z.email().safeParse(email).success) errors.email = "Format email tidak valid.";
  if (!password || password.length > MAX_PASSWORD_LENGTH) errors.password = "Masukkan kata sandi saat ini.";
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, email, password };
}

export function parseAccountPassword(formData: FormData):
  | { ok: true; password: string; currentPassword: string }
  | Extract<SaveResult, { ok: false }> {
  const password = String(formData.get("password") ?? "");
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const confirmation = String(formData.get("confirmation") ?? "");
  const errors: Record<string, string> = {};
  const problem = passwordProblem(password);
  if (problem) errors.password = problem;
  if (password !== confirmation) errors.confirmation = "Konfirmasi kata sandi tidak sama.";
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, password, currentPassword };
}

export function googleLinkMessage(error: string | undefined): string {
  switch (error) {
    case "email_does_not_match":
    case "LINKING_DIFFERENT_EMAILS_NOT_ALLOWED":
      return "Pilih akun Google dengan email yang sama dengan email akun Anda.";
    case "account_already_linked_to_different_user":
    case "SOCIAL_ACCOUNT_ALREADY_LINKED":
      return "Akun Google tersebut sudah terhubung ke pengguna lain.";
    case "access_denied":
      return "Penautan Google dibatalkan. Anda dapat mencoba lagi.";
    case "UNAUTHORIZED":
    case "session_not_found":
      return "Sesi Anda telah berakhir. Silakan masuk kembali.";
    default:
      return "Akun Google belum berhasil dihubungkan. Silakan coba lagi.";
  }
}
