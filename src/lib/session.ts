import { cache } from "react";
import { cookies, headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { invitation as invitationTable, user as userTable } from "@/db/schema";
import { getRoleLabel, getRolePermissions } from "@/lib/admin/role-service";
import { can, type Permission } from "@/lib/admin/roles";
import { auth } from "@/lib/auth";
import {
  getOwnedInvitation,
  type Invitation,
} from "@/lib/invitations/service";
import { getInvitationAccess, type Role } from "@/lib/team/service";
import { isUuid } from "@/lib/uuid";

export const ACTING_COOKIE = "ud_kelola";

export const getSession = cache(async () =>
  auth.api.getSession({ headers: await headers() }),
);

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  roleLabel: string;
  permissions: Permission[];
};

export const getAdmin = cache(async (): Promise<AdminUser | null> => {
  const session = await getSession();
  if (!session || session.user.status === "diblokir") return null;
  const role = session.user.adminRole;
  if (typeof role !== "string" || !role) return null;
  const [permissions, roleLabel] = await Promise.all([
    getRolePermissions(db, role),
    getRoleLabel(db, role),
  ]);
  if (!permissions || !roleLabel) return null;
  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    role,
    roleLabel,
    permissions,
  };
});

type Owner = typeof userTable.$inferSelect;

export type Acting = { admin: AdminUser; owner: Owner; invitation: Invitation };

export const getActing = cache(async (): Promise<Acting | null> => {
  const jar = await cookies();
  const target = jar.get(ACTING_COOKIE)?.value;
  if (!target || !isUuid(target)) return null;
  const admin = await getAdmin();
  if (!admin || !can(admin, "kelola-undangan")) return null;

  const [row] = await db
    .select({ invitation: invitationTable, owner: userTable })
    .from(invitationTable)
    .innerJoin(userTable, eq(userTable.id, invitationTable.ownerId))
    .where(eq(invitationTable.id, target));
  if (!row) return null;
  return { admin, owner: row.owner, invitation: row.invitation };
});

export async function requireUser() {
  const session = await getSession();
  if (!session) redirect("/masuk");
  if (session.user.status === "diblokir") redirect("/masuk?galat=diblokir");
  if (session.user.adminRole) {
    const acting = await getActing();
    if (!acting) redirect("/admin");
    return acting.owner;
  }
  return session.user;
}

export async function requireOwnAccount() {
  const session = await getSession();
  if (!session) redirect("/masuk");
  if (session.user.status === "diblokir") redirect("/masuk?galat=diblokir");
  if (session.user.adminRole) redirect("/admin");
  return session;
}

export const loadOwnedInvitation = cache(
  async (ownerId: string, invitationId: unknown): Promise<Invitation | null> => {
    if (!isUuid(invitationId)) return null;
    const session = await getSession();
    if (!session || session.user.status === "diblokir") return null;
    if (session.user.adminRole) {
      const acting = await getActing();
      if (
        !acting ||
        acting.owner.id !== ownerId ||
        acting.invitation.id !== invitationId.toLowerCase()
      ) return null;
      return acting.invitation;
    }
    if (session.user.id !== ownerId) return null;
    return getOwnedInvitation(db, ownerId, invitationId);
  },
);

export async function requireInvitationById(invitationId: unknown) {
  const user = await requireUser();
  const invitation = await loadOwnedInvitation(user.id, invitationId);
  if (!invitation) notFound();
  return { user, invitation };
}

export type InvitationAccessContext = {
  user: { id: string; name: string; email: string };
  invitation: Invitation;
  role: Role;
  scope: string | null;
};

export async function requireInvitationAccess(invitationId: unknown): Promise<InvitationAccessContext> {
  const user = await requireUser();
  const session = await getSession();
  if (session?.user.adminRole) {
    const invitation = await loadOwnedInvitation(user.id, invitationId);
    if (!invitation) notFound();
    return { user, invitation, role: "pemilik", scope: null };
  }
  const access = await getInvitationAccess(db, user.id, invitationId);
  if (!access) notFound();
  return { user, invitation: access.invitation, role: access.role, scope: access.scope };
}

export async function requireInvitationOwner(invitationId: unknown) {
  return requireInvitationById(invitationId);
}

export async function getWorkContextForInvitation(
  invitationId: unknown,
): Promise<{ userId: string; invitation: Invitation | null } | null> {
  const session = await getSession();
  if (!session || session.user.status === "diblokir") return null;
  if (session.user.adminRole) {
    const acting = await getActing();
    if (!acting) return null;
    return { userId: acting.owner.id, invitation: await loadOwnedInvitation(acting.owner.id, invitationId) };
  }
  return { userId: session.user.id, invitation: await loadOwnedInvitation(session.user.id, invitationId) };
}
