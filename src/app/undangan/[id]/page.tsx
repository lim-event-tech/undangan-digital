import { redirect } from "next/navigation";
import { requireInvitationById } from "@/lib/session";

export default async function InvitationIndex({ params }: PageProps<"/undangan/[id]">) {
  const { invitation } = await requireInvitationById((await params).id);
  redirect(`/undangan/${invitation.id}/isi`);
}
