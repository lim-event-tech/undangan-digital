"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { forceCheckIn, listCheckinGuests, scanCheckin, undoCheckIn } from "@/lib/checkin/service";
import { toInfo, toResult, type CariResult, type UsherResult } from "@/lib/checkin/usher";
import { getGuest } from "@/lib/guests/service";
import { readContent } from "@/lib/invitations/content";
import { requireInvitationAccess } from "@/lib/session";
import { checkinScope } from "@/lib/team/access";
import { isUuid } from "@/lib/uuid";

type Izin = { invitationId: string; scope: string | undefined };

async function izin(invitationId: string): Promise<Izin | { ditolak: string }> {
  try {
    const access = await requireInvitationAccess(invitationId);
    if (access.checkinAccess === "tidak") return { ditolak: "Anda tidak punya akses check-in untuk undangan ini." };
    if (!readContent(access.invitation.content).checkin.aktif) return { ditolak: "Check-in dengan kode QR sedang nonaktif." };
    return { invitationId: access.invitation.id, scope: checkinScope(access.checkinAccess, access.scope) };
  } catch {
    return { ditolak: "Sesi Anda berakhir atau akses dicabut. Muat ulang halaman." };
  }
}

function tolak(pesan: string): UsherResult {
  return { status: "ditolak", pesan };
}

function refresh(invitationId: string) {
  revalidatePath(`/undangan/${invitationId}/checkin`);
}

export async function pindaiAnggotaAction(invitationId: string, code: string): Promise<UsherResult> {
  const akses = await izin(invitationId);
  if ("ditolak" in akses) return tolak(akses.ditolak);
  const result = await scanCheckin(db, { id: akses.invitationId }, String(code).slice(0, 200), new Date(), akses.scope);
  if (result.result === "masuk" || result.result === "sudah-masuk") refresh(akses.invitationId);
  return toResult(result);
}

export async function masukkanAnggotaAction(invitationId: string, guestId: string): Promise<UsherResult> {
  const akses = await izin(invitationId);
  if ("ditolak" in akses) return tolak(akses.ditolak);
  if (!isUuid(guestId) || !(await getGuest(db, akses.invitationId, guestId, akses.scope))) return { status: "tidak-dikenal", guest: null };
  const result = await forceCheckIn(db, akses.invitationId, guestId);
  refresh(akses.invitationId);
  return toResult(result);
}

export async function batalkanAnggotaAction(invitationId: string, guestId: string): Promise<UsherResult> {
  const akses = await izin(invitationId);
  if ("ditolak" in akses) return tolak(akses.ditolak);
  if (isUuid(guestId) && (await getGuest(db, akses.invitationId, guestId, akses.scope)) && (await undoCheckIn(db, akses.invitationId, guestId))) {
    refresh(akses.invitationId);
  }
  return { status: "tidak-dikenal", guest: null };
}

export async function cariAnggotaAction(invitationId: string, query: string): Promise<CariResult> {
  const akses = await izin(invitationId);
  if ("ditolak" in akses) return { status: "ditolak", pesan: akses.ditolak };
  const guests = await listCheckinGuests(db, akses.invitationId, { q: String(query).slice(0, 80), limit: 30, addedBy: akses.scope });
  return { status: "ok", guests: guests.map(toInfo) };
}
