import { requireInvitationAccess } from "@/lib/session";
import { Fragment } from "react";

export default async function InvitationLayout({ children, params }: LayoutProps<"/undangan/[id]">) {
  const { id } = await params;
  await requireInvitationAccess(id);
  return <Fragment key={id}>{children}</Fragment>;
}
