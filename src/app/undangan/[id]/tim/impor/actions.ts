"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { user as userTable } from "@/db/schema";
import { appBaseUrl } from "@/lib/app-url";
import { sendMail } from "@/lib/mail/send";
import { requireInvitationById } from "@/lib/session";
import type { Role } from "@/lib/team/access";
import {
  MAX_TEAM_IMPORT_BYTES,
  MAX_TEAM_IMPORT_ROWS,
  validateTeamImportRows,
  type RawTeamRow,
} from "@/lib/team/import";
import { inviteMail } from "@/lib/team/mail";
import { createInvite, getTeamImportContext } from "@/lib/team/service";
import { readXlsx } from "@/lib/xlsx";

const rowSchema = z.object({
  row: z.number().int().min(2).max(1_000_000),
  email: z.string().max(320),
  peran: z.string().max(50),
  hak_checkin: z.string().max(50),
});

const payloadSchema = z.object({
  rows: z.array(rowSchema).min(1).max(MAX_TEAM_IMPORT_ROWS),
  skipProblems: z.boolean(),
});

export type BacaXlsxTimResult =
  | { ok: true; table: string[][] }
  | { ok: false; error: string };

export async function bacaXlsxTimAction(
  invitationId: string,
  formData: FormData,
): Promise<BacaXlsxTimResult> {
  await requireInvitationById(invitationId);
  const file = formData.get("file");
  if (!(file instanceof File)) return { ok: false, error: "File tidak terbaca." };
  if (file.size > MAX_TEAM_IMPORT_BYTES) {
    return {
      ok: false,
      error: `File terlalu besar (maks. ${Math.round(MAX_TEAM_IMPORT_BYTES / 1_000_000)} MB).`,
    };
  }
  const hasil = readXlsx(new Uint8Array(await file.arrayBuffer()));
  if (!hasil.ok) return hasil;
  if (hasil.rows.length === 0) return { ok: false, error: "File kosong." };
  return { ok: true, table: hasil.rows };
}

export type ImportedInviteItem = {
  email: string;
  role: Role;
  link: string;
  surel: "terkirim" | "gagal" | "tidak-diatur";
  galatSurel?: string;
};

export type CommitTeamImportResult =
  | { ok: true; imported: number; skipped: number; invites: ImportedInviteItem[] }
  | { ok: false; error: string };

export async function commitTeamImportAction(
  invitationId: string,
  rows: RawTeamRow[],
  skipProblems: boolean,
): Promise<CommitTeamImportResult> {
  const { invitation, user } = await requireInvitationById(invitationId);

  const parsed = payloadSchema.safeParse({ rows, skipProblems });
  if (!parsed.success) {
    return {
      ok: false,
      error: "Data impor tidak valid. Muat ulang halaman lalu coba lagi.",
    };
  }

  try {
    const context = await getTeamImportContext(db, invitation.id);
    const validated = validateTeamImportRows(parsed.data.rows, context);
    const hasProblems = validated.some((r) => r.status !== "siap");
    if (hasProblems && !parsed.data.skipProblems) {
      return {
        ok: false,
        error: "Perbaiki baris yang bermasalah atau centang lewati baris bermasalah.",
      };
    }

    const ready = validated.filter((r) => r.status === "siap" && r.email);
    if (ready.length === 0) {
      return {
        ok: false,
        error: "Tidak ada baris anggota yang siap diundang.",
      };
    }

    const [pemilik] = await db
      .select({ name: userTable.name })
      .from(userTable)
      .where(eq(userTable.id, user.id));
    const ownerName = pemilik?.name ?? user.name;
    const base = appBaseUrl();
    const invites: ImportedInviteItem[] = [];

    for (const item of ready) {
      const created = await createInvite(db, {
        invitationId: invitation.id,
        email: item.email!,
        invitedBy: user.id,
        role: item.role,
        checkinAccess: item.checkinAccess,
      });
      if (!created.ok) continue;

      const link = `${base}/terima/${created.token}`;
      const kirim = await sendMail(
        db,
        inviteMail({
          to: created.email,
          title: invitation.title,
          ownerName,
          link,
          expiresAt: created.expiresAt,
          role: item.role,
        }),
      );
      if (kirim.ok) {
        invites.push({ email: created.email, role: item.role, link, surel: "terkirim" });
      } else {
        const belumDiatur = kirim.error.includes("belum diaktifkan");
        invites.push({
          email: created.email,
          role: item.role,
          link,
          surel: belumDiatur ? "tidak-diatur" : "gagal",
          galatSurel: belumDiatur ? undefined : kirim.error,
        });
      }
    }

    if (invites.length === 0) {
      return {
        ok: false,
        error: "Tidak ada undangan yang berhasil dibuat. Periksa sisa kuota tim.",
      };
    }

    revalidatePath(`/undangan/${invitation.id}/tim`);
    return {
      ok: true,
      imported: invites.length,
      skipped: validated.length - invites.length,
      invites,
    };
  } catch (error) {
    console.error("Impor anggota tim gagal", error);
    return {
      ok: false,
      error: "Impor gagal disimpan. Coba lagi.",
    };
  }
}
