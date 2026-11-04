"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { APIError } from "better-auth/api";
import { db } from "@/db";
import { auth } from "@/lib/auth";
import { authMessage } from "@/lib/auth-messages";
import { MAX_PASSWORD_LENGTH } from "@/lib/auth-options-constants";
import { changeOwnEmail, getAccountMethods } from "@/lib/account-settings/service";
import { parseAccountPassword } from "@/lib/account-settings/shared";
import { requireOwnAccount } from "@/lib/session";
import { SAVED, type SaveResult } from "@/lib/save-result";
import { TokenGuard } from "@/lib/token-guard";

const attempts = new TokenGuard({ maxFailures: 5, windowMs: 15 * 60 * 1000, maxTracked: 5000 });
const LIMITED: SaveResult = { ok: false, formError: "Terlalu banyak percobaan. Tunggu 15 menit lalu coba lagi." };

export async function ubahEmailAction(formData: FormData): Promise<SaveResult> {
  const current = await requireOwnAccount();
  const key = current.user.id;
  if (attempts.isBlocked(key)) return LIMITED;
  attempts.recordFailure(key);
  try {
    const result = await changeOwnEmail(db, { userId: key, sessionId: current.session.id }, formData);
    if (result.ok) {
      attempts.reset(key);
      revalidatePath("/undangan", "layout");
    }
    return result;
  } catch {
    return { ok: false, formError: "Email belum berhasil diubah. Silakan coba lagi." };
  }
}

export async function ubahKataSandiAction(formData: FormData): Promise<SaveResult> {
  const current = await requireOwnAccount();
  const key = current.user.id;
  const parsed = parseAccountPassword(formData);
  if (!parsed.ok) return parsed;
  if (attempts.isBlocked(key)) return LIMITED;
  attempts.recordFailure(key);
  try {
    const methods = await getAccountMethods(db, key);
    const requestHeaders = await headers();
    if (methods.hasPassword) {
      if (!parsed.currentPassword || parsed.currentPassword.length > MAX_PASSWORD_LENGTH) {
        return { ok: false, errors: { currentPassword: "Masukkan kata sandi saat ini." } };
      }
      await auth.api.changePassword({
        headers: requestHeaders,
        body: { currentPassword: parsed.currentPassword, newPassword: parsed.password, revokeOtherSessions: true },
      });
    } else {
      if (!methods.googleConnected || Date.now() - current.session.createdAt.getTime() >= 24 * 60 * 60 * 1000) {
        return { ok: false, formError: "Silakan keluar lalu masuk kembali dengan Google sebelum membuat kata sandi." };
      }
      await auth.api.setPassword({ headers: requestHeaders, body: { newPassword: parsed.password } });
      await auth.api.revokeOtherSessions({ headers: requestHeaders });
    }
    attempts.reset(key);
    revalidatePath("/undangan/akun");
    return SAVED;
  } catch (error) {
    if (error instanceof APIError) {
      if (error.body?.code === "INVALID_PASSWORD") {
        return { ok: false, errors: { currentPassword: "Kata sandi saat ini salah." } };
      }
      if (error.body?.code === "PASSWORD_ALREADY_SET") {
        return { ok: false, formError: "Kata sandi sudah dibuat. Muat ulang halaman untuk mengubahnya." };
      }
      if (error.status === "UNAUTHORIZED") {
        return { ok: false, formError: "Sesi Anda telah berakhir. Silakan masuk kembali." };
      }
      return { ok: false, formError: authMessage(error.body) };
    }
    return { ok: false, formError: "Kata sandi belum berhasil disimpan. Silakan coba lagi." };
  }
}
