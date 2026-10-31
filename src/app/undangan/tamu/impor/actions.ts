"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { MAX_IMPORT_ROWS, type RawRow } from "@/lib/guests/import";
import { commitImport, type CommitImportResult } from "@/lib/guests/service";
import { requireInvitation } from "@/lib/session";

const rowSchema = z.object({
  row: z.number().int().min(2).max(1_000_000),
  nama: z.string().max(500),
  whatsapp: z.string().max(100),
  grup: z.string().max(200),
  acara: z.string().max(300),
  maks_dewasa: z.string().max(10),
  maks_anak: z.string().max(10),
});

const payloadSchema = z.object({
  rows: z.array(rowSchema).min(1).max(MAX_IMPORT_ROWS),
  skipProblems: z.boolean(),
});

export async function commitImportAction(
  rows: RawRow[],
  skipProblems: boolean,
): Promise<CommitImportResult> {
  const { invitation } = await requireInvitation();

  const parsed = payloadSchema.safeParse({ rows, skipProblems });
  if (!parsed.success) {
    return {
      ok: false,
      error: "Data impor tidak valid. Muat ulang halaman lalu coba lagi.",
    };
  }

  try {
    const result = await commitImport(
      db,
      invitation.id,
      parsed.data.rows,
      parsed.data.skipProblems,
    );
    if (result.ok) revalidatePath("/undangan/tamu");
    return result;
  } catch (error) {
    console.error("Impor tamu gagal", error);
    return {
      ok: false,
      error: "Impor gagal disimpan. Tidak ada tamu yang ditambahkan. Coba lagi.",
    };
  }
}
