import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { invitation as invitationTable, user as userTable } from "@/db/schema";
import { getRoleLabel, getRolePermissions } from "@/lib/admin/role-service";
import { can, type Permission } from "@/lib/admin/roles";
import { auth } from "@/lib/auth";
import { getInvitationForOwner, type Invitation } from "@/lib/invitations/service";
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

export const loadInvitation = cache(async (ownerId: string) => {
  const acting = await getActing();
  if (acting && acting.owner.id === ownerId) return acting.invitation;
  return getInvitationForOwner(db, ownerId);
});

export async function requireInvitation() {
  const user = await requireUser();
  const invitation = await loadInvitation(user.id);
  if (!invitation) redirect("/undangan/baru");
  return { user, invitation };
}

export async function getWorkContext(): Promise<{ userId: string; invitation: Invitation | null } | null> {
  const session = await getSession();
  if (!session || session.user.status === "diblokir") return null;
  if (session.user.adminRole) {
    const acting = await getActing();
    return acting ? { userId: acting.owner.id, invitation: acting.invitation } : null;
  }
  return { userId: session.user.id, invitation: await loadInvitation(session.user.id) };
}
