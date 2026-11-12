import { redirect } from "next/navigation";
import { requireInvitationAccess } from "@/lib/session";

export default async function UndanganPratinjauRedirect({
  params,
}: PageProps<"/undangan/[id]/pratinjau">) {
  const { invitation } = await requireInvitationAccess((await params).id);
  redirect(`/pratinjau/${invitation.templateKey}?undangan=${invitation.id}`);
}

