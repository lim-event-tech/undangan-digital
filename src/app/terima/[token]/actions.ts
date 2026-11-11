"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { getSession } from "@/lib/session";
import { acceptInvite } from "@/lib/team/service";
import { INVITE_COOKIE } from "@/lib/token";

export type TerimaState = { error: string } | null;

const PESAN: Record<string, string> = {
  "tidak-ada": "Tautan undangan tidak ditemukan.",
  kedaluwarsa: "Tautan undangan sudah kedaluwarsa. Minta pemilik undangan mengirim yang baru.",
  dipakai: "Tautan undangan ini sudah dipakai.",
  dicabut: "Tautan undangan ini sudah dibatalkan oleh pemilik undangan.",
  pemilik: "Anda adalah pemilik undangan ini, jadi tidak perlu bergabung sebagai anggota.",
  "sudah-anggota": "Anda sudah menjadi anggota tim ini.",
  "akun-admin": "Akun admin tidak bisa menjadi anggota tim. Masuk dengan akun pengguna.",
};

export async function terimaUndanganAction(token: string, _state: TerimaState, _formData: FormData): Promise<TerimaState> {
  void _formData;
  const session = await getSession();
  if (!session || session.user.status === "diblokir") redirect("/masuk");
  const result = await acceptInvite(db, token, { id: session.user.id, adminRole: session.user.adminRole });
  if (!result.ok) return { error: PESAN[result.error] ?? "Undangan gagal diterima." };
  (await cookies()).delete(INVITE_COOKIE);
  redirect(`/undangan/${result.invitationId}/tamu`);
}

export async function lewatiUndanganAction(): Promise<void> {
  (await cookies()).delete(INVITE_COOKIE);
  redirect("/undangan");
}
