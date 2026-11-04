"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { recordAudit } from "@/lib/admin/audit";
import { requireAdmin } from "@/lib/admin/guard";
import { getInvitationAdmin } from "@/lib/admin/queries";
import { ACTING_COOKIE, getActing } from "@/lib/session";
import { isUuid } from "@/lib/uuid";

const DELAPAN_JAM = 8 * 60 * 60;

export async function mulaiKelolaAction(formData: FormData): Promise<void> {
  const id = formData.get("id");
  if (typeof id !== "string" || !isUuid(id)) return;
  const admin = await requireAdmin("kelola-undangan");
  const detail = await getInvitationAdmin(db, id);
  if (!detail) return;

  const jar = await cookies();
  jar.set(ACTING_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: (process.env.BETTER_AUTH_URL ?? "").startsWith("https://"),
    path: "/",
    maxAge: DELAPAN_JAM,
  });
  await recordAudit(db, {
    actor: admin,
    category: "undangan",
    action: "Mulai mengelola undangan sebagai pengguna",
    target: `/u/${detail.slug}`,
    detail: `Pemilik ${detail.ownerEmail}`,
  });
  redirect("/undangan/isi");
}

export async function akhiriKelolaAction(): Promise<void> {
  const acting = await getActing();
  const jar = await cookies();
  jar.delete(ACTING_COOKIE);
  if (!acting) redirect("/admin");
  await recordAudit(db, {
    actor: acting.admin,
    category: "undangan",
    action: "Selesai mengelola undangan sebagai pengguna",
    target: `/u/${acting.invitation.slug}`,
  });
  redirect(`/admin/undangan/${acting.invitation.id}`);
}
