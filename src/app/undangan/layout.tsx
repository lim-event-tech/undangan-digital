import { AppShell } from "@/components/app-shell";
import { loadInvitation, requireUser } from "@/lib/session";

export default async function UndanganLayout({
  children,
}: LayoutProps<"/undangan">) {
  const user = await requireUser();
  const invitation = await loadInvitation(user.id);

  return (
    <AppShell
      user={{ name: user.name, email: user.email }}
      invitation={
        invitation
          ? {
              groomName: invitation.groomName,
              brideName: invitation.brideName,
              status: invitation.status,
            }
          : null
      }
    >
      {children}
    </AppShell>
  );
}
