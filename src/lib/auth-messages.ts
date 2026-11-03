import { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from "@/lib/auth-options-constants";

export type AuthError = { code?: string; status?: number; message?: string } | null | undefined;

export function authMessage(error: AuthError): string {
  if (!error) return "";
  if (error.status === 429) {
    return "Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.";
  }
  if (error.code?.startsWith("USER_ALREADY_EXISTS")) {
    return "Email ini sudah terdaftar. Silakan masuk, atau daftar dengan email lain.";
  }
  switch (error.code) {
    case "PENDAFTARAN_DITUTUP":
      return "Pendaftaran akun baru sedang ditutup. Coba lagi nanti.";
    case "INVALID_EMAIL_OR_PASSWORD":
      return "Email atau kata sandi salah.";
    case "PASSWORD_TOO_SHORT":
      return `Kata sandi minimal ${MIN_PASSWORD_LENGTH} karakter.`;
    case "PASSWORD_TOO_LONG":
      return `Kata sandi maksimal ${MAX_PASSWORD_LENGTH} karakter.`;
    case "INVALID_EMAIL":
      return "Format email tidak valid.";
    default:
      return "Terjadi kesalahan. Coba lagi sebentar.";
  }
}

export function passwordProblem(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Kata sandi minimal ${MIN_PASSWORD_LENGTH} karakter.`;
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    return `Kata sandi maksimal ${MAX_PASSWORD_LENGTH} karakter.`;
  }
  return null;
}
