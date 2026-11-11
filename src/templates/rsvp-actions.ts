"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { submitRsvp } from "@/lib/rsvp/service";
import { looksLikeGuestToken } from "@/lib/token";
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
  const token = text(formData, "token");
  const key = await currentClientKey();
  if (tokenGuard.isBlocked(key)) {
    return { status: "error", message: "Terlalu banyak percobaan. Coba lagi beberapa menit lagi." };
  }
  if (!looksLikeGuestToken(token)) {
    tokenGuard.recordFailure(key);
    return { status: "error", message: "Link undangan tidak valid." };
  }

  const result = await submitRsvp(db, {
    token,
    read: (eventId) => {
      const choice = text(formData, `hadir-${eventId}`);
      return {
        attending: choice === "" ? null : choice,
        attendeeCount: text(formData, `peserta-${eventId}`),
        note: text(formData, `pesan-${eventId}`),
        days: formData.getAll(`hari-${eventId}`).filter((value): value is string => typeof value === "string"),
        times: Object.fromEntries(
          [...formData.entries()]
            .filter(([key, value]) => key.startsWith(`jam-${eventId}-`) && typeof value === "string")
            .map(([key, value]) => [key.slice(`jam-${eventId}-`.length), value as string]),
        ),
      };
    },
  });

  if (result.ok) {
    revalidatePath(`/${token}`);
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
