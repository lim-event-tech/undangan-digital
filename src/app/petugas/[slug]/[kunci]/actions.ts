"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { looksLikeCheckinKey } from "@/lib/checkin/code";
import {
  findInvitationByKey,
  forceCheckIn,
  listCheckinGuests,
  scanCheckin,
  undoCheckIn,
  type UsherInvitation,
} from "@/lib/checkin/service";
import { toInfo, toResult, type CariResult, type UsherResult } from "@/lib/checkin/usher";
import { looksLikeSlug } from "@/lib/token";
import { currentClientKey, tokenGuard } from "@/lib/token-guard-instance";
import { isUuid } from "@/lib/uuid";

async function authorize(
  slug: string,
  key: string,
): Promise<{ invitation: UsherInvitation } | { ditolak: UsherResult }> {
  const client = await currentClientKey();
  if (tokenGuard.isBlocked(client)) {
    return { ditolak: { status: "ditolak", pesan: "Terlalu banyak percobaan. Tunggu beberapa menit." } };
  }
  if (!looksLikeSlug(slug) || !looksLikeCheckinKey(key)) {
    tokenGuard.recordFailure(client);
    return { ditolak: { status: "ditolak", pesan: "Link petugas tidak valid." } };
  }
  const invitation = await findInvitationByKey(db, slug, key);
  if (!invitation) {
    tokenGuard.recordFailure(client);
    return { ditolak: { status: "ditolak", pesan: "Link petugas tidak berlaku lagi. Minta link baru ke pemilik undangan." } };
  }
  return { invitation };
}

export async function pindaiAction(slug: string, key: string, code: string): Promise<UsherResult> {
  const auth = await authorize(slug, key);
  if ("ditolak" in auth) return auth.ditolak;
  const result = await scanCheckin(db, auth.invitation, String(code).slice(0, 200));
  if (result.result === "masuk" || result.result === "sudah-masuk") {
    refreshCheckin(auth.invitation, key);
  }
  return toResult(result);
}

export async function masukkanAction(slug: string, key: string, guestId: string): Promise<UsherResult> {
  const auth = await authorize(slug, key);
  if ("ditolak" in auth) return auth.ditolak;
  if (!isUuid(guestId)) return { status: "tidak-dikenal", guest: null };
  const result = await forceCheckIn(db, auth.invitation.id, guestId);
  if (result.result === "masuk" || result.result === "sudah-masuk") {
    refreshCheckin(auth.invitation, key);
  }
  return toResult(result);
}

export async function batalkanAction(slug: string, key: string, guestId: string): Promise<UsherResult> {
  const auth = await authorize(slug, key);
  if ("ditolak" in auth) return auth.ditolak;
  if (isUuid(guestId) && await undoCheckIn(db, auth.invitation.id, guestId)) {
    refreshCheckin(auth.invitation, key);
  }
  return { status: "tidak-dikenal", guest: null };
}

function refreshCheckin(invitation: UsherInvitation, key: string) {
  revalidatePath(`/petugas/${invitation.slug}/${key}`);
  revalidatePath(`/undangan/${invitation.id}/checkin`);
}

export async function cariAction(
  slug: string,
  key: string,
  query: string,
): Promise<CariResult> {
  const auth = await authorize(slug, key);
  if ("ditolak" in auth) return { status: "ditolak", pesan: auth.ditolak.status === "ditolak" ? auth.ditolak.pesan : "" };
  const guests = await listCheckinGuests(db, auth.invitation.id, { q: String(query).slice(0, 80), limit: 30 });
  return { status: "ok", guests: guests.map(toInfo) };
}
