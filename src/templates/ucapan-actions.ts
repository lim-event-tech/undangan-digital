"use server";

import { db } from "@/db";
import { readContent } from "@/lib/invitations/content";
import { findGuestRow } from "@/lib/rsvp/service";
import { looksLikeGuestToken, looksLikeSlug } from "@/lib/token";
import { currentClientKey, tokenGuard } from "@/lib/token-guard-instance";
import { WISH_MAX_LENGTH, WISH_MAX_PER_GUEST } from "@/lib/wishes/shared";
import { submitWish } from "@/lib/wishes/service";
import type { HalamanUcapan } from "./bersama/jenis";
import { halamanUcapan } from "./bersama/ucapan-server";

export type HasilKirimUcapan =
  | { ok: true; status: "tampil" | "ditahan"; halaman: HalamanUcapan | null }
  | { ok: false; pesan: string };

const PESAN_GALAT = {
  "tidak-ditemukan": "Undangan tidak ditemukan.",
  "belum-terbit": "Undangan ini belum dibuka untuk pesan tamu.",
  dimatikan: "Pesan tamu sedang tidak dibuka oleh pengelola.",
  kosong: "Tulis pesan tamu terlebih dahulu.",
  "terlalu-panjang": `Pesan tamu maksimal ${WISH_MAX_LENGTH} karakter.`,
  batas: `Setiap tamu bisa mengirim paling banyak ${WISH_MAX_PER_GUEST} pesan tamu.`,
} as const;

type Kunci = { slug: string; token: string };

function bacaKunci(input: unknown): Kunci | null {
  if (typeof input !== "object" || input === null) return null;
  const { slug, token } = input as Record<string, unknown>;
  if (!looksLikeSlug(slug) || !looksLikeGuestToken(token)) return null;
  return { slug, token };
}

export async function kirimUcapanAction(input: unknown): Promise<HasilKirimUcapan> {
  const klien = await currentClientKey();
  if (tokenGuard.isBlocked(klien)) {
    return { ok: false, pesan: "Terlalu banyak percobaan. Coba lagi beberapa menit lagi." };
  }
  const kunci = bacaKunci(input);
  const pesan = (input as { pesan?: unknown } | null)?.pesan;
  if (!kunci || typeof pesan !== "string") {
    tokenGuard.recordFailure(klien);
    return { ok: false, pesan: "Link undangan tidak valid." };
  }

  const hasil = await submitWish(db, { ...kunci, message: pesan });
  if (!hasil.ok) {
    if (hasil.error === "tidak-ditemukan") tokenGuard.recordFailure(klien);
    return { ok: false, pesan: PESAN_GALAT[hasil.error] };
  }
  if (hasil.status !== "tampil") return { ok: true, status: "ditahan", halaman: null };

  const row = await findGuestRow(db, kunci.slug, kunci.token);
  return {
    ok: true,
    status: "tampil",
    halaman: row ? await halamanUcapan(db, row.invitationId, 1, new Date()) : null,
  };
}

export async function muatUcapanAction(input: unknown): Promise<HalamanUcapan | null> {
  const klien = await currentClientKey();
  if (tokenGuard.isBlocked(klien)) return null;
  const kunci = bacaKunci(input);
  const halaman = (input as { halaman?: unknown } | null)?.halaman;
  if (!kunci || typeof halaman !== "number") {
    tokenGuard.recordFailure(klien);
    return null;
  }
  const row = await findGuestRow(db, kunci.slug, kunci.token);
  if (!row) {
    tokenGuard.recordFailure(klien);
    return null;
  }
  if (row.status !== "terbit" || !readContent(row.content).ucapan.tampil) return null;
  return halamanUcapan(db, row.invitationId, halaman, new Date());
}
