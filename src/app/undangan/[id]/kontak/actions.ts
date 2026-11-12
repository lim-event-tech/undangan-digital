"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { normalizePhone } from "@/lib/phone";
import { requireInvitationAccess } from "@/lib/session";
import { saveMemberContact } from "@/lib/team/service";

export type SimpanKontakState =
  | { ok: true; message: string }
  | { ok: false; error: string; errors?: Record<string, string> }
  | null;

export async function simpanKontakSayaAction(
  invitationId: string,
  _state: SimpanKontakState,
  formData: FormData,
): Promise<SimpanKontakState> {
  const { invitation, user, role } = await requireInvitationAccess(invitationId);
  if (role !== "anggota") {
    return { ok: false, error: "Hanya anggota tim yang dapat mengatur narahubung kustom." };
  }

  const rawNama = formData.get("nama");
  const rawTelepon = formData.get("telepon");
  const rawEmail = formData.get("email");

  const nama = typeof rawNama === "string" ? rawNama.trim() : "";
  const telepon = typeof rawTelepon === "string" ? rawTelepon.trim() : "";
  const email = typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";

  const errors: Record<string, string> = {};

  let normalizedPhone: string | null = null;
  if (telepon) {
    const res = normalizePhone(telepon);
    if (!res.ok) errors.telepon = "Nomor WhatsApp tidak valid. Gunakan format nomor yang benar.";
    else normalizedPhone = res.value;
  }

  if (email && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254)) {
    errors.email = "Format alamat email tidak valid.";
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, error: "Periksa kembali isian formulir.", errors };
  }

  await saveMemberContact(db, invitation.id, user.id, {
    name: nama || null,
    phone: normalizedPhone,
    email: email || null,
  });

  revalidatePath(`/undangan/${invitation.id}/kontak`);
  return { ok: true, message: "Pengaturan narahubung Anda berhasil disimpan." };
}

