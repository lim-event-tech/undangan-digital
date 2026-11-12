import { redirect } from "next/navigation";
import { requireInvitationAccess } from "@/lib/session";

export default async function InvitationIndex({ params }: PageProps<"/undangan/[id]">) {
  const { invitation, role } = await requireInvitationAccess((await params).id);
  redirect(`/undangan/${invitation.id}/${role === "anggota" ? "tamu" : "isi"}`);
}
