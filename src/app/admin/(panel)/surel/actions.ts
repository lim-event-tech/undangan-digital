"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { recordAudit } from "@/lib/admin/audit";
import { requireAdmin } from "@/lib/admin/guard";
import { isEmailAddress, parseSmtpForm } from "@/lib/mail/config";
import { sendMail } from "@/lib/mail/send";
import { getSmtpView, saveSmtpConfig } from "@/lib/mail/service";
import { SAVED, type SaveResult } from "@/lib/save-result";

export type UjiSurelResult = { ok: true } | { ok: false; error: string } | null;

export async function simpanSurelAction(_state: SaveResult | null, formData: FormData): Promise<SaveResult> {
  const admin = await requireAdmin("pengaturan");
  const parsed = parseSmtpForm(formData);
  if (!parsed.ok) return { ok: false, errors: parsed.errors };

  const before = await getSmtpView(db);
  const after = await saveSmtpConfig(db, parsed.input, { baru: parsed.password, hapus: parsed.hapusPassword });
  const changes: string[] = [];
  if (before.aktif !== after.aktif) changes.push(after.aktif ? "Surel diaktifkan" : "Surel dinonaktifkan");
  if (before.host !== after.host || before.port !== after.port || before.keamanan !== after.keamanan) changes.push(`Server ${after.host || "kosong"}:${after.port} (${after.keamanan})`);
  if (before.user !== after.user) changes.push("Nama pengguna SMTP diubah");
  if (parsed.password !== null || parsed.hapusPassword) changes.push(parsed.hapusPassword ? "Kata sandi SMTP dihapus" : "Kata sandi SMTP diganti");
  if (before.dariEmail !== after.dariEmail || before.dariNama !== after.dariNama) changes.push("Pengirim diubah");
  if (changes.length > 0) {
    await recordAudit(db, { actor: admin, category: "pengaturan", action: "Mengubah pengaturan surel (SMTP)", target: "Surel", detail: changes.join("; ") });
  }
  revalidatePath("/admin/surel");
  return SAVED;
}

export async function ujiSurelAction(_state: UjiSurelResult, formData: FormData): Promise<UjiSurelResult> {
  const admin = await requireAdmin("pengaturan");
  const raw = formData.get("tujuan");
  const tujuan = (typeof raw === "string" ? raw : "").trim().toLowerCase();
  if (!isEmailAddress(tujuan)) return { ok: false, error: "Alamat tujuan tidak valid." };
  const result = await sendMail(db, {
    to: tujuan,
    subject: "Surel uji LIM-RSVP",
    text: "Jika Anda menerima surel ini, pengaturan SMTP LIM-RSVP sudah benar.",
    html: "<p>Jika Anda menerima surel ini, pengaturan SMTP LIM-RSVP sudah benar.</p>",
  });
  await recordAudit(db, {
    actor: admin,
    category: "pengaturan",
    action: "Mengirim surel uji",
    target: "Surel",
    detail: result.ok ? "Berhasil" : `Gagal: ${result.error}`.slice(0, 200),
  });
  return result;
}
