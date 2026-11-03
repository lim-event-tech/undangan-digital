"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { submitRsvp } from "@/lib/rsvp/service";
import { looksLikeGuestToken, looksLikeSlug } from "@/lib/token";
import { currentClientKey, tokenGuard } from "@/lib/token-guard-instance";

export type RsvpFormState =
  | { status: "ok" }
  | { status: "error"; message?: string; errors?: Record<string, string> };

function text(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export async function submitRsvpAction(
  _state: RsvpFormState | null,
  formData: FormData,
): Promise<RsvpFormState> {
  const slug = text(formData, "slug");
  const token = text(formData, "token");
  const key = await currentClientKey();
  if (tokenGuard.isBlocked(key)) {
    return { status: "error", message: "Terlalu banyak percobaan. Coba lagi beberapa menit lagi." };
  }
  if (!looksLikeSlug(slug) || !looksLikeGuestToken(token)) {
    tokenGuard.recordFailure(key);
    return { status: "error", message: "Link undangan tidak valid." };
  }

  const result = await submitRsvp(db, {
    slug,
    token,
    read: (eventId) => {
      const choice = text(formData, `hadir-${eventId}`);
      return {
        attending: choice === "" ? null : choice,
        adults: text(formData, `dewasa-${eventId}`),
        children: text(formData, `anak-${eventId}`),
        note: text(formData, `pesan-${eventId}`),
      };
    },
  });

  if (result.ok) {
    revalidatePath(`/${slug}/${token}`);
    return { status: "ok" };
  }
  if (result.error === "tidak-valid") {
    return { status: "error", message: "Periksa kembali jawaban Anda.", errors: result.errors };
  }
  if (result.error === "ditutup") {
    return { status: "error", message: "Batas waktu konfirmasi sudah lewat." };
  }
  if (result.error === "belum-terbit") {
    return { status: "error", message: "Undangan ini belum dibuka untuk konfirmasi." };
  }
  tokenGuard.recordFailure(key);
  return { status: "error", message: "Undangan tidak ditemukan." };
}
