import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { db } from "@/db";
import { todayWib } from "@/lib/datetime";
import { getSettings } from "@/lib/platform/service";
import { ANNOUNCEMENT_LABEL, activeAnnouncement } from "@/lib/platform/settings";
import { getActing, requireUser } from "@/lib/session";
import { looksLikeInviteToken } from "@/lib/team/service";
import { INVITE_COOKIE } from "@/lib/token";
import { listInvitationsForOwner } from "@/lib/invitations/service";
import { listInvitationsForMember } from "@/lib/team/service";

export default async function UndanganLayout({
  children,
}: LayoutProps<"/undangan">) {
  const user = await requireUser();
  const tertunda = (await cookies()).get(INVITE_COOKIE)?.value;
  if (looksLikeInviteToken(tertunda)) redirect(`/terima/${tertunda}`);
  const [settings, acting] = await Promise.all([
    getSettings(db),
    getActing(),
  ]);
  const invitations = settings.pemeliharaan.aktif
    ? []
    : acting
      ? [{ ...acting.invitation, peran: "pemilik" as const }]
      : [
          ...(await listInvitationsForOwner(db, user.id)).map((item) => ({ ...item, peran: "pemilik" as const })),
          ...(await listInvitationsForMember(db, user.id)).map((item) => ({ ...item, peran: "anggota" as const })),
        ];
  const announcement = activeAnnouncement(settings, todayWib());

  return (
    <AppShell
      kelola={acting ? { admin: acting.admin.name } : null}
      user={{ name: user.name, email: user.email }}
      invitations={invitations.map(({ id, title, status, peran, templateKey }) => ({ id, title, status, peran, templateKey }))}
      pengumuman={
        announcement
          ? { teks: announcement.teks, jenis: ANNOUNCEMENT_LABEL[announcement.jenis] }
          : null
      }
    >
      {settings.pemeliharaan.aktif ? (
        <div className="mx-auto flex max-w-xl flex-col gap-3 rounded-[10px] border border-garis bg-white p-8 text-center">
          <h1 className="m-0 font-judul text-[34px] leading-tight font-medium">Sedang dalam pemeliharaan</h1>
          <p className="m-0 text-sm leading-relaxed whitespace-pre-line text-redup-2">
            {settings.pemeliharaan.pesan}
          </p>
          <p className="m-0 text-xs text-redup">
            Undangan dan RSVP untuk tamu tetap bisa dibuka seperti biasa.
          </p>
        </div>
      ) : (
        children
      )}
    </AppShell>
  );
}
