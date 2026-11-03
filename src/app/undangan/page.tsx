import { redirect } from "next/navigation";
import { loadInvitation, requireUser } from "@/lib/session";

export default async function UndanganIndex() {
  const user = await requireUser();
  const invitation = await loadInvitation(user.id);
  redirect(invitation ? "/undangan/isi" : "/undangan/baru");
}
