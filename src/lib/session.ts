import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { auth } from "@/lib/auth";
import { getInvitationForOwner } from "@/lib/invitations/service";

export const getSession = cache(async () =>
  auth.api.getSession({ headers: await headers() }),
);

export async function requireUser() {
  const session = await getSession();
  if (!session) redirect("/masuk");
  if (session.user.status === "diblokir") redirect("/masuk?galat=diblokir");
  return session.user;
}

export const loadInvitation = cache(async (ownerId: string) =>
  getInvitationForOwner(db, ownerId),
);

export async function requireInvitation() {
  const user = await requireUser();
  const invitation = await loadInvitation(user.id);
  if (!invitation) redirect("/undangan/baru");
  return { user, invitation };
}
