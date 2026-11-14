import { createHash, randomBytes } from "node:crypto";
import { and, asc, desc, eq, gt, isNull, sql } from "drizzle-orm";
import { guest, invitation, invitationInvite, invitationMember, user } from "@/db/schema";
import type { AppDb } from "@/db/types";
import { isEmailAddress } from "@/lib/mail/config";
import { getOwnedInvitation, type Invitation, type OwnedInvitationSummary } from "@/lib/invitations/service";
import { isUuid } from "@/lib/uuid";
import { effectiveCheckinAccess, parseCheckinAccess, parseMemberRole, type CheckinAccess, type Role } from "./access";

export { effectiveCheckinAccess, parseCheckinAccess, parseMemberRole };
export type { CheckinAccess, Role };

export const MAX_MEMBERS = 20;
export const INVITE_VALID_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

export type Access = { invitation: Invitation; role: Role; scope: string | null; creator: boolean; checkinAccess: CheckinAccess };

export function hashInviteToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function newInviteToken(): string {
  return randomBytes(24).toString("base64url");
}

export function looksLikeInviteToken(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9_-]{32}$/.test(value);
}

export async function getInvitationAccess(db: AppDb, userId: string, invitationId: unknown): Promise<Access | null> {
  if (!isUuid(invitationId)) return null;
  const owned = await getOwnedInvitation(db, userId, invitationId);
  if (owned) return { invitation: owned, role: "pemilik", scope: null, creator: true, checkinAccess: "semua" };
  const [row] = await db
    .select({ invitation, role: invitationMember.role, checkinAccess: invitationMember.checkinAccess })
    .from(invitationMember)
    .innerJoin(invitation, eq(invitation.id, invitationMember.invitationId))
    .where(and(eq(invitationMember.userId, userId), eq(invitationMember.invitationId, invitationId)));
  if (!row) return null;
  const role = parseMemberRole(row.role);
  return {
    invitation: row.invitation,
    role,
    scope: role === "pemilik" ? null : userId,
    creator: false,
    checkinAccess: effectiveCheckinAccess(role, row.checkinAccess),
  };
}

export type MemberInvitationSummary = OwnedInvitationSummary & { peran: Role; checkinAccess: CheckinAccess };

export async function listInvitationsForMember(db: AppDb, userId: string): Promise<MemberInvitationSummary[]> {
  const rows = await db
    .select({
      peran: invitationMember.role,
      checkinAccess: invitationMember.checkinAccess,
      id: invitation.id,
      title: invitation.title,
      slug: invitation.slug,
      templateKey: invitation.templateKey,
      status: invitation.status,
      createdAt: invitation.createdAt,
      updatedAt: invitation.updatedAt,
    })
    .from(invitationMember)
    .innerJoin(invitation, eq(invitation.id, invitationMember.invitationId))
    .where(eq(invitationMember.userId, userId))
    .orderBy(desc(invitation.createdAt), desc(invitation.id));
  return rows.map((row) => {
    const peran = parseMemberRole(row.peran);
    return { ...row, peran, checkinAccess: effectiveCheckinAccess(peran, row.checkinAccess) };
  });
}

export type MemberRow = {
  userId: string;
  name: string;
  email: string;
  joinedAt: Date;
  role: Role;
  checkinAccess: CheckinAccess;
  guests: number;
  contactName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
};

export async function listMembers(db: AppDb, invitationId: string): Promise<MemberRow[]> {
  const rows = await db
    .select({
      userId: user.id,
      name: user.name,
      email: user.email,
      joinedAt: invitationMember.createdAt,
      role: invitationMember.role,
      checkinAccess: invitationMember.checkinAccess,
      guests: sql<number>`(select count(*)::int from guest where guest.invitation_id = ${invitationId} and guest.added_by = ${user.id})`,
      contactName: invitationMember.contactName,
      contactPhone: invitationMember.contactPhone,
      contactEmail: invitationMember.contactEmail,
    })
    .from(invitationMember)
    .innerJoin(user, eq(user.id, invitationMember.userId))
    .where(eq(invitationMember.invitationId, invitationId))
    .orderBy(asc(invitationMember.createdAt));
  return rows.map((row) => {
    const role = parseMemberRole(row.role);
    return { ...row, role, checkinAccess: effectiveCheckinAccess(role, row.checkinAccess) };
  });
}

export type InviteRow = { id: string; email: string; expiresAt: Date; createdAt: Date };

export async function listPendingInvites(db: AppDb, invitationId: string, now: Date = new Date()): Promise<InviteRow[]> {
  return db
    .select({ id: invitationInvite.id, email: invitationInvite.email, expiresAt: invitationInvite.expiresAt, createdAt: invitationInvite.createdAt })
    .from(invitationInvite)
    .where(
      and(
        eq(invitationInvite.invitationId, invitationId),
        isNull(invitationInvite.acceptedAt),
        isNull(invitationInvite.revokedAt),
        gt(invitationInvite.expiresAt, now),
      ),
    )
    .orderBy(desc(invitationInvite.createdAt));
}

export type CreateInviteResult =
  | { ok: true; token: string; email: string; expiresAt: Date }
  | { ok: false; error: "email-tidak-valid" | "pemilik" | "sudah-anggota" | "penuh" };

export async function createInvite(
  db: AppDb,
  input: { invitationId: string; email: string; invitedBy: string; role?: Role; checkinAccess?: CheckinAccess },
  now: Date = new Date(),
): Promise<CreateInviteResult> {
  const email = input.email.trim().toLowerCase();
  if (!isEmailAddress(email)) return { ok: false, error: "email-tidak-valid" };
  return db.transaction(async (tx) => {
    const [owner] = await tx
      .select({ email: user.email })
      .from(invitation)
      .innerJoin(user, eq(user.id, invitation.ownerId))
      .where(eq(invitation.id, input.invitationId))
      .for("update", { of: invitation });
    if (!owner) return { ok: false, error: "email-tidak-valid" } as const;
    if (owner.email.toLowerCase() === email) return { ok: false, error: "pemilik" } as const;
    const members = await tx
      .select({ email: user.email })
      .from(invitationMember)
      .innerJoin(user, eq(user.id, invitationMember.userId))
      .where(eq(invitationMember.invitationId, input.invitationId));
    if (members.some((row) => row.email.toLowerCase() === email)) return { ok: false, error: "sudah-anggota" } as const;
    const pending = await listPendingInvites(tx, input.invitationId, now);
    if (members.length + pending.filter((row) => row.email !== email).length >= MAX_MEMBERS) return { ok: false, error: "penuh" } as const;
    await tx
      .update(invitationInvite)
      .set({ revokedAt: now })
      .where(and(eq(invitationInvite.invitationId, input.invitationId), eq(invitationInvite.email, email), isNull(invitationInvite.acceptedAt), isNull(invitationInvite.revokedAt)));
    const token = newInviteToken();
    const expiresAt = new Date(now.getTime() + INVITE_VALID_DAYS * DAY_MS);
    await tx.insert(invitationInvite).values({
      invitationId: input.invitationId,
      email,
      tokenHash: hashInviteToken(token),
      invitedBy: input.invitedBy,
      role: parseMemberRole(input.role),
      checkinAccess: parseCheckinAccess(input.checkinAccess),
      expiresAt,
    });
    return { ok: true, token, email, expiresAt } as const;
  });
}

export async function revokeInvite(db: AppDb, invitationId: string, inviteId: string, now: Date = new Date()): Promise<boolean> {
  if (!isUuid(inviteId)) return false;
  const rows = await db
    .update(invitationInvite)
    .set({ revokedAt: now })
    .where(and(eq(invitationInvite.id, inviteId), eq(invitationInvite.invitationId, invitationId), isNull(invitationInvite.acceptedAt), isNull(invitationInvite.revokedAt)))
    .returning({ id: invitationInvite.id });
  return rows.length > 0;
}

export async function updateMember(
  db: AppDb,
  invitationId: string,
  userId: string,
  patch: { role?: Role; checkinAccess?: CheckinAccess },
): Promise<boolean> {
  const set: Partial<{ role: Role; checkinAccess: CheckinAccess }> = {};
  if (patch.role) set.role = parseMemberRole(patch.role);
  if (patch.checkinAccess) set.checkinAccess = parseCheckinAccess(patch.checkinAccess);
  if (Object.keys(set).length === 0) return false;
  const rows = await db
    .update(invitationMember)
    .set(set)
    .where(and(eq(invitationMember.invitationId, invitationId), eq(invitationMember.userId, userId)))
    .returning({ id: invitationMember.id });
  return rows.length > 0;
}

export async function removeMember(db: AppDb, invitationId: string, userId: string): Promise<boolean> {
  return db.transaction(async (tx) => {
    const [row] = await tx
      .select({ ownerId: invitation.ownerId })
      .from(invitation)
      .where(eq(invitation.id, invitationId))
      .for("update");
    if (!row) return false;
    const removed = await tx
      .delete(invitationMember)
      .where(and(eq(invitationMember.invitationId, invitationId), eq(invitationMember.userId, userId)))
      .returning({ id: invitationMember.id });
    if (removed.length === 0) return false;
    await tx
      .update(guest)
      .set({ addedBy: row.ownerId })
      .where(and(eq(guest.invitationId, invitationId), eq(guest.addedBy, userId)));
    return true;
  });
}

export async function leaveInvitation(db: AppDb, invitationId: string, userId: string): Promise<boolean> {
  return removeMember(db, invitationId, userId);
}

export type InvitePreview = { id: string; email: string; invitationId: string; title: string; ownerName: string; expiresAt: Date; role: Role; checkinAccess: CheckinAccess };
export type InviteState = "valid" | "tidak-ada" | "kedaluwarsa" | "dipakai" | "dicabut";

export async function previewInvite(
  db: AppDb,
  token: string,
  now: Date = new Date(),
): Promise<{ state: InviteState; invite: InvitePreview | null }> {
  if (!looksLikeInviteToken(token)) return { state: "tidak-ada", invite: null };
  const [row] = await db
    .select({
      id: invitationInvite.id,
      email: invitationInvite.email,
      invitationId: invitationInvite.invitationId,
      expiresAt: invitationInvite.expiresAt,
      acceptedAt: invitationInvite.acceptedAt,
      revokedAt: invitationInvite.revokedAt,
      role: invitationInvite.role,
      checkinAccess: invitationInvite.checkinAccess,
      title: invitation.title,
      ownerName: user.name,
    })
    .from(invitationInvite)
    .innerJoin(invitation, eq(invitation.id, invitationInvite.invitationId))
    .innerJoin(user, eq(user.id, invitation.ownerId))
    .where(eq(invitationInvite.tokenHash, hashInviteToken(token)));
  if (!row) return { state: "tidak-ada", invite: null };
  const invite: InvitePreview = { id: row.id, email: row.email, invitationId: row.invitationId, title: row.title, ownerName: row.ownerName, expiresAt: row.expiresAt, role: parseMemberRole(row.role), checkinAccess: parseCheckinAccess(row.checkinAccess) };
  if (row.acceptedAt) return { state: "dipakai", invite };
  if (row.revokedAt) return { state: "dicabut", invite };
  if (row.expiresAt.getTime() <= now.getTime()) return { state: "kedaluwarsa", invite };
  return { state: "valid", invite };
}

export type AcceptResult =
  | { ok: true; invitationId: string; role: Role }
  | {
      ok: false;
      error:
        | "tidak-ada"
        | "kedaluwarsa"
        | "dipakai"
        | "dicabut"
        | "pemilik"
        | "sudah-anggota"
        | "akun-admin"
        | "email-tidak-sesuai";
    };

export async function acceptInvite(
  db: AppDb,
  token: string,
  account: { id: string; email?: string | null; adminRole?: string | null },
  now: Date = new Date(),
): Promise<AcceptResult> {
  const { state, invite } = await previewInvite(db, token, now);
  if (!invite || state === "tidak-ada") return { ok: false, error: "tidak-ada" };
  if (state !== "valid") return { ok: false, error: state };
  if (account.adminRole) return { ok: false, error: "akun-admin" };
  const [akun] = account.email
    ? [{ email: account.email }]
    : await db.select({ email: user.email }).from(user).where(eq(user.id, account.id));
  return db.transaction(async (tx) => {
    const [target] = await tx
      .select({ ownerId: invitation.ownerId })
      .from(invitation)
      .where(eq(invitation.id, invite.invitationId))
      .for("update");
    if (!target) return { ok: false, error: "tidak-ada" } as const;
    if (target.ownerId === account.id) return { ok: false, error: "pemilik" } as const;
    const [already] = await tx
      .select({ id: invitationMember.id })
      .from(invitationMember)
      .where(and(eq(invitationMember.invitationId, invite.invitationId), eq(invitationMember.userId, account.id)));
    if (already) return { ok: false, error: "sudah-anggota" } as const;
    if (!akun || akun.email.trim().toLowerCase() !== invite.email.trim().toLowerCase()) {
      return { ok: false, error: "email-tidak-sesuai" } as const;
    }
    const claimed = await tx
      .update(invitationInvite)
      .set({ acceptedAt: now, acceptedBy: account.id })
      .where(and(eq(invitationInvite.id, invite.id), isNull(invitationInvite.acceptedAt), isNull(invitationInvite.revokedAt)))
      .returning({ id: invitationInvite.id });
    if (claimed.length === 0) return { ok: false, error: "dipakai" } as const;
    await tx
      .insert(invitationMember)
      .values({ invitationId: invite.invitationId, userId: account.id, role: invite.role, checkinAccess: invite.checkinAccess })
      .onConflictDoNothing();
    return { ok: true, invitationId: invite.invitationId, role: invite.role } as const;
  });
}

export type MemberContact = {
  name: string | null;
  phone: string | null;
  email: string | null;
};

export async function getMemberContact(
  db: AppDb,
  invitationId: string,
  userId: string,
): Promise<MemberContact | null> {
  const [row] = await db
    .select({
      name: invitationMember.contactName,
      phone: invitationMember.contactPhone,
      email: invitationMember.contactEmail,
    })
    .from(invitationMember)
    .where(and(eq(invitationMember.invitationId, invitationId), eq(invitationMember.userId, userId)));
  return row ?? null;
}

export async function saveMemberContact(
  db: AppDb,
  invitationId: string,
  userId: string,
  input: { name?: string | null; phone?: string | null; email?: string | null },
): Promise<boolean> {
  const result = await db
    .update(invitationMember)
    .set({
      contactName: input.name ? input.name.trim().slice(0, 120) : null,
      contactPhone: input.phone ? input.phone.trim().slice(0, 20) : null,
      contactEmail: input.email ? input.email.trim().slice(0, 254) : null,
    })
    .where(and(eq(invitationMember.invitationId, invitationId), eq(invitationMember.userId, userId)))
    .returning({ id: invitationMember.id });
  return result.length > 0;
}
