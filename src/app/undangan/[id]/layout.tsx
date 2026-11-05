import { requireInvitationById } from "@/lib/session";
import { Fragment } from "react";

export default async function InvitationLayout({ children, params }: LayoutProps<"/undangan/[id]">) {
  const { id } = await params;
  await requireInvitationById(id);
  return <Fragment key={id}>{children}</Fragment>;
}
