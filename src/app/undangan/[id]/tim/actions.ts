"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { appBaseUrl } from "@/lib/app-url";
import { sendMail } from "@/lib/mail/send";
import { notFound } from "next/navigation";
import { requireInvitationAccess, requireInvitationById } from "@/lib/session";
import { parseCheckinAccess, parseMemberRole } from "@/lib/team/access";
import { createInvite, leaveInvitation, removeMember, revokeInvite, updateMember } from "@/lib/team/service";
import { inviteMail } from "@/lib/team/mail";
import { isUuid } from "@/lib/uuid";
import { user as userTable } from "@/db/schema";
import { eq } from "drizzle-orm";

export type UndangState =
  | { ok: true; email: string; link: string; surel: "terkirim" | "gagal" | "tidak-diatur"; galatSurel?: string }
  | { ok: false; error: string }
  | null;

const PESAN: Record<string, string> = {
  "email-tidak-valid": "Alamat email tidak valid.",
  pemilik: "Itu alamat email pemilik undangan.",
  "sudah-anggota": "Orang ini sudah menjadi anggota tim.",
  penuh: "Anggota tim sudah mencapai batas.",
};

export async function undangAnggotaAction(invitationId: string, _state: UndangState, formData: FormData): Promise<UndangState> {
  const { invitation, user } = await requireInvitationById(invitationId);
  const raw = formData.get("email");
  const peran = parseMemberRole(formData.get("peran"));
  const result = await createInvite(db, {
    invitationId: invitation.id,
    email: typeof raw === "string" ? raw : "",
    invitedBy: user.id,
    role: peran,
    checkinAccess: parseCheckinAccess(formData.get("checkin")),
  });
  if (!result.ok) return { ok: false, error: PESAN[result.error] ?? "Undangan gagal dibuat." };
  const link = `${appBaseUrl()}/terima/${result.token}`;
  const [pemilik] = await db.select({ name: userTable.name }).from(userTable).where(eq(userTable.id, user.id));
  const kirim = await sendMail(db, inviteMail({ to: result.email, title: invitation.title, ownerName: pemilik?.name ?? user.name, link, expiresAt: result.expiresAt, role: peran }));
  revalidatePath(`/undangan/${invitation.id}/tim`);
  if (kirim.ok) return { ok: true, email: result.email, link, surel: "terkirim" };
  const belumDiatur = kirim.error.includes("belum diaktifkan");
  return { ok: true, email: result.email, link, surel: belumDiatur ? "tidak-diatur" : "gagal", galatSurel: belumDiatur ? undefined : kirim.error };
}

export async function cabutUndanganAction(invitationId: string, formData: FormData): Promise<void> {
  const { invitation } = await requireInvitationById(invitationId);
  const id = formData.get("id");
  if (typeof id === "string" && isUuid(id)) await revokeInvite(db, invitation.id, id);
  revalidatePath(`/undangan/${invitation.id}/tim`);
}

export async function keluarkanAnggotaAction(invitationId: string, formData: FormData): Promise<void> {
  const { invitation } = await requireInvitationById(invitationId);
  const id = formData.get("id");
  if (typeof id === "string" && id) await removeMember(db, invitation.id, id);
  revalidatePath(`/undangan/${invitation.id}/tim`);
}

export async function ubahAnggotaAction(invitationId: string, formData: FormData): Promise<void> {
  const { invitation } = await requireInvitationById(invitationId);
  const id = formData.get("id");
  if (typeof id === "string" && id) {
    await updateMember(db, invitation.id, id, {
      role: parseMemberRole(formData.get("peran")),
      checkinAccess: parseCheckinAccess(formData.get("checkin")),
    });
  }
  revalidatePath(`/undangan/${invitation.id}/tim`);
  revalidatePath("/undangan", "layout");
}

export async function keluarDariTimAction(invitationId: string): Promise<void> {
  const { invitation, user, creator } = await requireInvitationAccess(invitationId);
  if (creator) notFound();
  await leaveInvitation(db, invitation.id, user.id);
  revalidatePath("/undangan", "layout");
}
